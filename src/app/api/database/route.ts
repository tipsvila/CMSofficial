import { NextResponse } from 'next/server'
import { client } from '@/lib/db'

interface ColumnInfo {
  name: string
  type: string
  notnull: number
  pk: number
  dflt_value: string | null
}

interface TableInfo {
  name: string
  columns: ColumnInfo[]
  rowCount: number
}

interface QueryResult {
  columns: string[]
  rows: Record<string, unknown>[]
  total: number
}

// Whitelist of SQL statement prefixes allowed in the POST query runner
const ALLOWED_PREFIXES = /^\s*(SELECT|PRAGMA|EXPLAIN)\b/i

// Block multi-statement queries (semicolons anywhere except trailing)
// Also block SQL comments that could hide statements
function sanitizeQuery(query: string): string | null {
  // Strip SQL line comments (-- ...)
  let clean = query.replace(/--.*$/gm, '')
  // Strip SQL block comments (/* ... */)
  clean = clean.replace(/\/\*[\s\S]*?\*\//g, '')
  // Trim whitespace
  clean = clean.trim()

  // Reject multi-statement: reject if semicolon exists before end of string
  // (trailing semicolon is OK — strip it for the check)
  const withoutTrailingSemicolon = clean.replace(/;\s*$/, '')
  if (withoutTrailingSemicolon.includes(';')) {
    return null
  }

  // Must start with an allowed prefix
  if (!ALLOWED_PREFIXES.test(clean)) {
    return null
  }

  return clean
}

// Get all valid table names from sqlite_master for allowlist checks
async function getValidTableNames(): Promise<Set<string>> {
  const result = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '_prisma_%'"
  )
  return new Set(result.rows.map(r => r.name as string))
}

// Validate that a table name exists in the schema — prevents injection via table name
function validateTableName(name: string, validNames: Set<string>): boolean {
  // Table names should be alphanumeric + underscores only
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    return false
  }
  return validNames.has(name)
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const table = url.searchParams.get('table')
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
    const pageSize = Math.min(200, Math.max(1, parseInt(url.searchParams.get('pageSize') || '50')))
    const search = url.searchParams.get('search') || ''
    const action = url.searchParams.get('action') || 'list'

    // Fetch valid table names once for all allowlist checks
    const validTables = await getValidTableNames()

    if (action === 'tables') {
      const tables: TableInfo[] = []

      for (const tableName of validTables) {
        const colsResult = await client.execute(`PRAGMA table_info('${tableName}')`)
        const countResult = await client.execute(`SELECT COUNT(*) as cnt FROM "${tableName}"`)

        tables.push({
          name: tableName,
          columns: colsResult.rows as unknown as ColumnInfo[],
          rowCount: Number(countResult.rows[0]?.cnt || 0),
        })
      }

      return NextResponse.json({ success: true, data: tables })
    }

    if (action === 'schema' && table) {
      if (!validateTableName(table, validTables)) {
        return NextResponse.json({ success: false, error: 'Invalid table name' }, { status: 400 })
      }

      const colsResult = await client.execute(`PRAGMA table_info('${table}')`)
      const indexesResult = await client.execute(`PRAGMA index_list('${table}')`)
      const fksResult = await client.execute(`PRAGMA foreign_key_list('${table}')`)

      const indexes = []
      for (const idx of indexesResult.rows) {
        const info = await client.execute(`PRAGMA index_info('${idx.name}')`)
        indexes.push({
          name: idx.name,
          unique: idx.unique === 1,
          columns: info.rows.map(r => r.name),
        })
      }

      return NextResponse.json({
        success: true,
        data: {
          columns: colsResult.rows as unknown as ColumnInfo[],
          indexes,
          foreignKeys: fksResult.rows,
        },
      })
    }

    if (table) {
      if (!validateTableName(table, validTables)) {
        return NextResponse.json({ success: false, error: 'Invalid table name' }, { status: 400 })
      }

      const offset = (page - 1) * pageSize
      let whereClause = ''
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const searchParams: any[] = []

      if (search) {
        const colsResult = await client.execute(`PRAGMA table_info('${table}')`)
        const textCols = (colsResult.rows as unknown as ColumnInfo[])
          .filter(c => c.type === 'TEXT')
          .map(c => c.name)

        if (textCols.length > 0) {
          const conditions = textCols.map(col => `"${col}" LIKE ?`)
          whereClause = `WHERE ${conditions.join(' OR ')}`
          // One parameter per text column, all with same search value
          for (let i = 0; i < textCols.length; i++) {
            searchParams.push(`%${search}%`)
          }
        }
      }

      const countResult = searchParams.length > 0
        ? await client.execute({ sql: `SELECT COUNT(*) as cnt FROM "${table}" ${whereClause}`, args: searchParams })
        : await client.execute(`SELECT COUNT(*) as cnt FROM "${table}"`)
      const total = Number(countResult.rows[0]?.cnt || 0)

      const dataResult = searchParams.length > 0
        ? await client.execute({ sql: `SELECT * FROM "${table}" ${whereClause} LIMIT ${pageSize} OFFSET ${offset}`, args: searchParams })
        : await client.execute(`SELECT * FROM "${table}" LIMIT ${pageSize} OFFSET ${offset}`)

      const queryResult: QueryResult = {
        columns: dataResult.columns,
        rows: dataResult.rows as Record<string, unknown>[],
        total,
      }

      return NextResponse.json({ success: true, data: queryResult })
    }

    return NextResponse.json({ success: false, error: 'Missing table parameter' }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ success: false, error: 'Missing query string' }, { status: 400 })
    }

    if (query.length > 10000) {
      return NextResponse.json({ success: false, error: 'Query too long (max 10,000 chars)' }, { status: 400 })
    }

    const sanitized = sanitizeQuery(query)
    if (!sanitized) {
      return NextResponse.json(
        { success: false, error: 'Only single SELECT, PRAGMA, or EXPLAIN queries are allowed.' },
        { status: 403 },
      )
    }

    const start = Date.now()
    const result = await client.execute(sanitized)
    const elapsed = Date.now() - start

    return NextResponse.json({
      success: true,
      data: {
        columns: result.columns,
        rows: result.rows as Record<string, unknown>[],
        rowCount: result.rows.length,
        duration: `${elapsed}ms`,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Query failed'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}
