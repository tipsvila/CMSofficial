import { NextResponse } from 'next/server'
import { client } from '@/lib/db'

const ALLOWED_SORT_FIELDS = ['fileName', 'fileType', 'contractorId', 'createdAt', 'updatedAt'] as const
type SortField = (typeof ALLOWED_SORT_FIELDS)[number]

const DOCUMENTS_TABLE_EXISTS_SQL = `
  SELECT name FROM sqlite_master WHERE type='table' AND name='documents'
`

async function ensureDocumentsTable() {
  const check = await client.execute(DOCUMENTS_TABLE_EXISTS_SQL)
  if (check.rows.length === 0) {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        contractor_id TEXT,
        file_name TEXT NOT NULL,
        file_type TEXT,
        file_size INTEGER DEFAULT 0,
        file_path TEXT,
        notes TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `)
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20')))
    const search = url.searchParams.get('search') || ''
    const sortBy = url.searchParams.get('sortBy') || 'createdAt'
    const sortOrder = url.searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'
    const offset = (page - 1) * limit

    const safeSort: SortField = ALLOWED_SORT_FIELDS.includes(sortBy as SortField) ? (sortBy as SortField) : 'createdAt'

    const tableCheck = await client.execute(DOCUMENTS_TABLE_EXISTS_SQL)
    const hasDocumentsTable = tableCheck.rows.length > 0

    if (hasDocumentsTable) {
      let whereClause = 'WHERE d.is_active = 1'
      const args: (string | number)[] = []
      if (search) {
        whereClause += ' AND (d.file_name LIKE ? OR d.file_type LIKE ? OR d.notes LIKE ?)'
        const pattern = `%${search}%`
        args.push(pattern, pattern, pattern)
      }

      const sortColumn = safeSort === 'fileName' ? 'd.file_name'
        : safeSort === 'fileType' ? 'd.file_type'
        : safeSort === 'contractorId' ? 'd.contractor_id'
        : `d.${safeSort === 'createdAt' ? 'created_at' : safeSort}`

      const countResult = await client.execute({ sql: `SELECT COUNT(*) as cnt FROM documents d ${whereClause}`, args })
      const total = Number(countResult.rows[0]?.cnt || 0)

      const dataResult = await client.execute({
        sql: `
        SELECT d.*, ct.name as contractor_name
        FROM documents d
        LEFT JOIN contractors ct ON d.contractor_id = ct.id
        ${whereClause}
        ORDER BY ${sortColumn} ${sortOrder}
        LIMIT ? OFFSET ?`,
        args: [...args, limit, offset],
      })

      const documents = dataResult.rows.map(row => ({
        id: row.id,
        contractorId: row.contractor_id,
        fileName: row.file_name,
        fileType: row.file_type,
        fileSize: row.file_size,
        filePath: row.file_path,
        notes: row.notes,
        isActive: row.is_active === 1,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        contractor: row.contractor_name ? { id: row.contractor_id as string, name: row.contractor_name as string } : undefined,
      }))

      return NextResponse.json({ documents, total, page, limit })
    }

    // Fallback: use contractors table as document source
    let whereClause = 'WHERE is_active = 1'
    const args: (string | number)[] = []
    if (search) {
      whereClause += ' AND (name LIKE ? OR website LIKE ?)'
      const pattern = `%${search}%`
      args.push(pattern, pattern)
    }

    const sortMap: Record<string, string> = {
      fileName: 'name',
      fileType: 'website',
      contractorId: 'id',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
    const sortCol = sortMap[safeSort] || 'created_at'

    const countResult = await client.execute({ sql: `SELECT COUNT(*) as cnt FROM contractors ${whereClause}`, args })
    const total = Number(countResult.rows[0]?.cnt || 0)

    const dataResult = await client.execute({
      sql: `
      SELECT id, name, website, created_at, updated_at
      FROM contractors
      ${whereClause}
      ORDER BY ${sortCol} ${sortOrder}
      LIMIT ? OFFSET ?`,
      args: [...args, limit, offset],
    })

    const documents = dataResult.rows.map(row => ({
      id: row.id,
      contractorId: row.id,
      fileName: row.name,
      fileType: 'certificate',
      fileSize: 0,
      filePath: row.website,
      notes: null,
      isActive: true,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      contractor: { id: row.id as string, name: row.name as string },
    }))

    return NextResponse.json({ documents, total, page, limit })
  } catch (error) {
    console.error('GET /api/documents error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { contractorId, fileName, fileType, fileSize, filePath, notes } = body

    if (!fileName?.trim()) return NextResponse.json({ error: 'File name is required' }, { status: 400 })

    await ensureDocumentsTable()

    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    await client.execute({
      sql: `INSERT INTO documents (id, contractor_id, file_name, file_type, file_size, file_path, notes, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      args: [
        id,
        contractorId || null,
        fileName.trim(),
        fileType || null,
        fileSize || 0,
        filePath || null,
        notes || null,
        now,
        now,
      ],
    })

    const result = await client.execute({
      sql: `SELECT d.*, ct.name as contractor_name FROM documents d LEFT JOIN contractors ct ON d.contractor_id = ct.id WHERE d.id = ?`,
      args: [id],
    })

    const row = result.rows[0]
    return NextResponse.json({
      id: row.id,
      contractorId: row.contractor_id,
      fileName: row.file_name,
      fileType: row.file_type,
      fileSize: row.file_size,
      filePath: row.file_path,
      notes: row.notes,
      isActive: row.is_active === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      contractor: row.contractor_name ? { id: row.contractor_id as string, name: row.contractor_name as string } : undefined,
    }, { status: 201 })
  } catch (error) {
    console.error('POST /api/documents error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
