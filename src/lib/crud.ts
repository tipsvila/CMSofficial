import { NextResponse } from 'next/server'
import { client } from '@/lib/db'

// ponytail: single source of truth for CSV parsing — was copy-pasted 6 times
function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let current = ''
  let inQuotes = false
  const row: string[] = []

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { current += '"'; i++ }
      else if (ch === '"') inQuotes = false
      else current += ch
    } else {
      if (ch === '"') inQuotes = true
      else if (ch === ',') { row.push(current); current = '' }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++
        row.push(current); current = ''
        if (row.length > 0 && row.some(c => c.trim())) rows.push(row)
        row.length = 0
      } else current += ch
    }
  }
  row.push(current)
  if (row.length > 0 && row.some(c => c.trim())) rows.push(row)
  return rows
}

// ponytail: one mapper factory — was duplicated 3-5x per entity across list/detail/update/export
function buildMapper(columns: Record<string, string>, joins?: JoinConfig[]) {
  return (row: Record<string, unknown>) => {
    const obj: Record<string, unknown> = {}
    for (const [camel, dbCol] of Object.entries(columns)) {
      const val = row[dbCol]
      obj[camel] = dbCol === 'is_active' ? val === 1 : val
    }
    if (joins) {
      for (const j of joins) {
        const refId = row[j.alias + '_id_ref']
        const refName = row[j.alias + '_name']
        obj[j.camelKey] = refId ? { id: refId as string, name: refName as string, ...j.extraFields?.reduce((acc, f) => { acc[f] = row[j.alias + '_' + f]; return acc }, {} as Record<string, unknown>) } : j.nullValue
      }
    }
    return obj
  }
}

export interface JoinConfig {
  table: string
  alias: string           // SQL alias in SELECT (e.g. "ct" → "ct.name as ct_name", "ct.id as ct_id_ref")
  on: string              // e.g. "c.contractor_id = ct.id"
  camelKey: string        // JS key in response (e.g. "contractor")
  nullValue: unknown      // null or undefined
  extraFields?: string[]  // additional fields to include (e.g. ["awardIdPiid"] with alias prefix)
  nameColumn?: string | null  // column to use for name (default "name"; set to null to skip name column entirely)
}

export interface FieldMapping {
  db: string       // DB column (snake_case)
  body?: string    // body key (camelCase) — defaults to camelCase(db)
  transform?: (val: unknown) => unknown
  trim?: boolean
}

export interface CrudConfig {
  table: string
  alias: string              // SQL table alias (e.g. "c" for contacts)
  entityName: string         // Human name for error messages (e.g. "Contact")
  responseKey: string        // JSON response key (e.g. "contacts")
  columns: Record<string, string>  // camelCase → snake_case mapping for row→object
  joins?: JoinConfig[]
  sortColumns: Record<string, string>  // sortField → SQL column
  defaultSort: string
  searchColumns: string[]    // DB columns to search (with alias prefix)
  searchTable?: string       // table alias for search (defaults to config.alias)
  filters?: string[]         // query param names that map to eq conditions (e.g. ["status", "type"])
  filterColumns?: Record<string, string>  // param name → DB column (if different from param name)
  requiredFields: Record<string, string>  // body key → error message
  updateFields: FieldMapping[]
  insertColumns: string[]    // DB columns for INSERT (in order)
  insertMapper: (body: Record<string, unknown>, id: string, now: string) => (string | number | null)[] | Promise<(string | number | null)[]>
  postCreateSelect?: string  // custom SELECT for re-fetch after create (defaults to standard join select)
  generateId?: () => string
  createStatus?: number      // HTTP status for POST response (default 200)
  detailExtra?: (id: string, client_: typeof client) => Promise<Record<string, unknown>>
  import?: ImportConfig
}

export interface ImportConfig {
  requiredHeaders: Record<string, string>  // header keyword → error message
  requiredFields: string[]                 // fields that must have values in each CSV row
  headerKeywords: Record<string, string[]> // field name → header keywords to match
  defaults: Record<string, unknown>        // default values for missing fields
  contractorMatch?: {
    csvField: string          // keyword to find in CSV headers
    entityField: string       // body field name for contractorId
    fallbackToFirst?: boolean // if true, use first active contractor when no match
  }
  customInsert?: (
    row: string[], headers: string[], now: string
  ) => Promise<{ sql: string; args: (string | number)[] } | null> | { sql: string; args: (string | number)[] } | null
}

// ponytail: one factory generates GET/POST/GET-by-id/PUT/DELETE for all 7 entities
export function createCrudHandlers(config: CrudConfig) {
  const {
    table, alias, entityName, responseKey, columns, joins,
    sortColumns, defaultSort, searchColumns, searchTable,
    filters, filterColumns, requiredFields, updateFields,
    insertColumns, insertMapper, postCreateSelect,
    generateId, createStatus, detailExtra, import: importConfig,
  } = config

  const searchTableAlias = searchTable || alias

  const joinSelect = postCreateSelect || (() => {
    let sel = `SELECT ${alias}.*`
    if (joins) {
      for (const j of joins) {
        if (j.nameColumn !== null) {
          const nameCol = j.nameColumn || 'name'
          sel += `, ${j.alias}.${nameCol} as ${j.alias}_name`
        }
        sel += `, ${j.alias}.id as ${j.alias}_id_ref`
        if (j.extraFields) {
          for (const f of j.extraFields) sel += `, ${j.alias}.${snakeCase(f)} as ${j.alias}_${f}`
        }
      }
    }
    sel += `\nFROM ${table} ${alias}`
    if (joins) {
      for (const j of joins) sel += `\nLEFT JOIN ${j.table} ${j.alias} ON ${j.on}`
    }
    return sel
  })()

  const map = buildMapper(columns, joins)

  // ─── GET (list) ───
  async function handleList(request: Request) {
    try {
      const url = new URL(request.url)
      const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
      const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20')))
      const search = url.searchParams.get('search') || ''
      const sortBy = url.searchParams.get('sortBy') || defaultSort
      const sortOrder = url.searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'
      const offset = (page - 1) * limit

      const safeSort = Object.keys(sortColumns).includes(sortBy) ? sortBy : defaultSort
      const sortColumn = sortColumns[safeSort]

      const conditions: string[] = [`${alias}.is_active = 1`]
      const args: (string | number)[] = []

      if (search) {
        const pattern = `%${search}%`
        const st = searchTableAlias
        conditions.push(`(${searchColumns.map(c => `${st}.${c} LIKE ?`).join(' OR ')})`)
        args.push(...searchColumns.map(() => pattern))
      }

      if (filters) {
        for (const f of filters) {
          const val = url.searchParams.get(f) || ''
          if (val) {
            const col = filterColumns?.[f] || `${alias}.${f}`
            conditions.push(`${col} = ?`)
            args.push(val)
          }
        }
      }

      const whereClause = `WHERE ${conditions.join(' AND ')}`

      const countResult = await client.execute({
        sql: `SELECT COUNT(*) as cnt FROM ${table} ${alias} ${joins ? joins.map(j => `LEFT JOIN ${j.table} ${j.alias} ON ${j.on}`).join(' ') : ''} ${whereClause}`,
        args,
      })
      const total = Number(countResult.rows[0]?.cnt || 0)

      const dataResult = await client.execute({
        sql: `${joinSelect} ${whereClause} ORDER BY ${sortColumn} ${sortOrder} LIMIT ? OFFSET ?`,
        args: [...args, limit, offset],
      })

      const items = dataResult.rows.map(map)
      return NextResponse.json({ [responseKey]: items, total, page, limit })
    } catch (error) {
      console.error(`GET /api/${table} error:`, error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }

  // ─── POST (create) ───
  async function handleCreate(request: Request) {
    try {
      const body = await request.json()

      for (const [field, msg] of Object.entries(requiredFields)) {
        const val = body[field]
        if (!val || (typeof val === 'string' && !val.trim())) {
          return NextResponse.json({ error: msg }, { status: 400 })
        }
      }

      const id = generateId ? generateId() : crypto.randomUUID()
      const now = new Date().toISOString()
      const values = insertMapper(body, id, now)
      const placeholders = insertColumns.map(() => '?').join(', ')

      const resolvedValues = await Promise.resolve(values)
      await client.execute({
        sql: `INSERT INTO ${table} (${insertColumns.join(', ')}, is_active, created_at, updated_at) VALUES (${placeholders}, 1, ?, ?)`,
        args: [id, ...resolvedValues, now, now],
      })

      const result = await client.execute({
        sql: `${joinSelect} WHERE ${alias}.id = ?`,
        args: [id],
      })

      return NextResponse.json(map(result.rows[0]), { status: createStatus || 200 })
    } catch (error) {
      console.error(`POST /api/${table} error:`, error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }

  // ─── GET by ID ───
  async function handleGetById(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id } = await params
      const result = await client.execute({
        sql: `${joinSelect} WHERE ${alias}.id = ?`,
        args: [id],
      })

      if (result.rows.length === 0) {
        return NextResponse.json({ error: `${entityName} not found` }, { status: 404 })
      }

      const item = map(result.rows[0])

      if (detailExtra) {
        const extra = await detailExtra(id, client)
        return NextResponse.json({ ...item, ...extra })
      }

      return NextResponse.json(item)
    } catch (error) {
      console.error(`GET /api/${table}/[id] error:`, error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }

  // ─── PUT (update) ───
  async function handleUpdate(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id } = await params
      const body = await _request.json()

      const existing = await client.execute({ sql: `SELECT id FROM ${table} WHERE id = ?`, args: [id] })
      if (existing.rows.length === 0) {
        return NextResponse.json({ error: `${entityName} not found` }, { status: 404 })
      }

      const now = new Date().toISOString()
      const updates: string[] = ['updated_at = ?']
      const args: (string | number | null)[] = [now]

      for (const field of updateFields) {
        const bodyKey = field.body || camelCase(field.db)
        if (body[bodyKey] !== undefined) {
          updates.push(`${field.db} = ?`)
          const val = field.transform
            ? field.transform(body[bodyKey])
            : field.trim && typeof body[bodyKey] === 'string'
              ? body[bodyKey].trim()
              : body[bodyKey] || null
          args.push(val as string | number | null)
        }
      }

      args.push(id)
      await client.execute({ sql: `UPDATE ${table} SET ${updates.join(', ')} WHERE id = ?`, args })

      const result = await client.execute({
        sql: `${joinSelect} WHERE ${alias}.id = ?`,
        args: [id],
      })

      return NextResponse.json(map(result.rows[0]))
    } catch (error) {
      console.error(`PUT /api/${table}/[id] error:`, error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }

  // ─── DELETE (soft) ───
  async function handleDelete(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id } = await params
      const now = new Date().toISOString()

      const existing = await client.execute({ sql: `SELECT id FROM ${table} WHERE id = ? AND is_active = 1`, args: [id] })
      if (existing.rows.length === 0) {
        return NextResponse.json({ error: `${entityName} not found` }, { status: 404 })
      }

      await client.execute({ sql: `UPDATE ${table} SET is_active = 0, updated_at = ? WHERE id = ?`, args: [now, id] })
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error(`DELETE /api/${table}/[id] error:`, error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }

  // ─── POST bulk-delete ───
  async function handleBulkDelete(request: Request) {
    try {
      const { ids, deleteAll } = await request.json() as { ids?: string[]; deleteAll?: boolean }
      const now = new Date().toISOString()

      if (deleteAll) {
        const countResult = await client.execute(`SELECT COUNT(*) as cnt FROM ${table} WHERE is_active = 1`)
        const count = Number(countResult.rows[0]?.cnt || 0)
        await client.execute({ sql: `UPDATE ${table} SET is_active = 0, updated_at = ? WHERE is_active = 1`, args: [now] })
        return NextResponse.json({ success: true, deleted: count })
      }

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: `No ${entityName.toLowerCase()} IDs provided` }, { status: 400 })
      }
      if (ids.length > 500) {
        return NextResponse.json({ error: `Maximum 500 ${entityName.toLowerCase()}s per batch` }, { status: 400 })
      }

      const placeholders = ids.map(() => '?').join(',')
      const result = await client.execute({
        sql: `UPDATE ${table} SET is_active = 0, updated_at = ? WHERE id IN (${placeholders}) AND is_active = 1`,
        args: [now, ...ids],
      })

      return NextResponse.json({ success: true, deleted: result.rowsAffected })
    } catch (error) {
      console.error(`POST /api/${table}/bulk-delete error:`, error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }

  // ─── GET export ───
  async function handleExport(request: Request) {
    try {
      const url = new URL(request.url)
      const search = url.searchParams.get('search') || ''
      const sortBy = url.searchParams.get('sortBy') || defaultSort
      const sortOrder = url.searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'

      const safeSort = Object.keys(sortColumns).includes(sortBy) ? sortBy : defaultSort
      const sortColumn = sortColumns[safeSort]

      const conditions: string[] = [`${alias}.is_active = 1`]
      const args: (string | number)[] = []

      if (search) {
        const pattern = `%${search}%`
        const st = searchTableAlias
        conditions.push(`(${searchColumns.map(c => `${st}.${c} LIKE ?`).join(' OR ')})`)
        args.push(...searchColumns.map(() => pattern))
      }

      const whereClause = `WHERE ${conditions.join(' AND ')}`

      // ponytail: cap export at 10k rows to prevent DoS via memory exhaustion
      const MAX_EXPORT = 10_000
      const result = await client.execute({
        sql: `${joinSelect} ${whereClause} ORDER BY ${sortColumn} ${sortOrder} LIMIT ?`,
        args: [...args, MAX_EXPORT],
      })

      const items = result.rows.map(map)
      return NextResponse.json({ [responseKey]: items, total: items.length })
    } catch (error) {
      console.error(`GET /api/${table}/export error:`, error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }

  // ─── POST import ───
  async function handleImport(request: Request) {
    if (!importConfig) {
      return NextResponse.json({ error: 'Import not supported' }, { status: 404 })
    }
    try {
      const formData = await request.formData()
      const file = formData.get('file') as File | null
      if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
      if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })

      const text = await file.text()
      const rows = parseCSV(text)
      if (rows.length < 2) return NextResponse.json({ error: 'CSV must have a header row and at least one data row' }, { status: 400 })

      const headers = rows[0].map(h => h.trim().toLowerCase())

      // Validate required headers
      for (const [keyword, msg] of Object.entries(importConfig.requiredHeaders)) {
        if (!headers.some(h => h.includes(keyword))) {
          return NextResponse.json({ error: msg }, { status: 400 })
        }
      }

      // Resolve header indices
      const fieldIndices: Record<string, number> = {}
      for (const [field, keywords] of Object.entries(importConfig.headerKeywords)) {
        fieldIndices[field] = headers.findIndex(h => keywords.some(k => h.includes(k) || h === k))
      }

      const now = new Date().toISOString()
      let imported = 0

      for (let i = 1; i < rows.length && i <= 10000; i++) {
        const row = rows[i]
        if (row.length < 1) continue

        // Validate required fields
        let valid = true
        for (const field of importConfig.requiredFields) {
          const idx = fieldIndices[field]
          if (idx === -1 || !row[idx]?.trim()) { valid = false; break }
        }
        if (!valid) continue

        const body: Record<string, unknown> = { ...importConfig.defaults }

        // Resolve contractor ID
        if (importConfig.contractorMatch) {
          const cm: { csvField: string; entityField: string; fallbackToFirst?: boolean } = importConfig.contractorMatch
          const cmIdx = fieldIndices[cm.csvField]
          let contractorId: string | null = null
          if (cmIdx !== -1 && row[cmIdx]?.trim()) {
            const match = await client.execute({
              sql: 'SELECT id FROM contractors WHERE name LIKE ? AND is_active = 1 LIMIT 1',
              args: [`%${row[cmIdx].trim()}%`],
            })
            if (match.rows.length > 0) contractorId = match.rows[0].id as string
          }
          if (!contractorId && cm.fallbackToFirst) {
            const fallback = await client.execute('SELECT id FROM contractors WHERE is_active = 1 LIMIT 1')
            if (fallback.rows.length > 0) contractorId = fallback.rows[0].id as string
            else continue
          }
          if (contractorId) body[cm.entityField] = contractorId
        }

        // Map CSV fields to body
        for (const [field] of Object.entries(importConfig.headerKeywords)) {
          if (field === importConfig.contractorMatch?.csvField) continue
          const idx = fieldIndices[field]
          if (idx !== -1 && row[idx]?.trim()) {
            body[field] = row[idx].trim()
          }
        }

        // Custom insert or standard
        if (importConfig.customInsert) {
          const custom = await importConfig.customInsert(row, headers, now)
          if (custom) {
            await client.execute({ sql: custom.sql, args: custom.args })
          }
        } else {
          const id = generateId ? generateId() : crypto.randomUUID()
          const cols = [...insertColumns, 'is_active', 'created_at', 'updated_at']
          const vals = await Promise.resolve(insertMapper(body, id, now))
          const placeholders = cols.map(() => '?').join(', ')
          await client.execute({
            sql: `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`,
            args: [id, ...vals, 1, now, now],
          })
        }
        imported++
      }

      return NextResponse.json({ success: true, imported })
    } catch (error) {
      console.error(`POST /api/${table}/import error:`, error)
      return NextResponse.json({ error: 'Import failed' }, { status: 500 })
    }
  }

  return {
    GET: handleList,
    POST: handleCreate,
    GETById: handleGetById,
    PUT: handleUpdate,
    DELETE: handleDelete,
    bulkDelete: handleBulkDelete,
    export: handleExport,
    import: handleImport,
  }
}

// ─── Helpers ───

function camelCase(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

function snakeCase(s: string): string {
  return s.replace(/[A-Z]/g, c => '_' + c.toLowerCase())
}
