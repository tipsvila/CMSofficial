import { NextResponse } from 'next/server'
import { client } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const search = url.searchParams.get('search') || ''
    const sortBy = url.searchParams.get('sortBy') || 'fileName'
    const sortOrder = url.searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'

    const allowed = ['fileName', 'fileType', 'createdAt', 'updatedAt'] as const
    type SF = (typeof allowed)[number]
    const safeSort: SF = allowed.includes(sortBy as SF) ? (sortBy as SF) : 'fileName'
    const sortCol = safeSort === 'fileName' ? 'd.file_name'
      : safeSort === 'fileType' ? 'd.file_type'
      : `d.${safeSort === 'createdAt' ? 'created_at' : safeSort}`

    const tableCheck = await client.execute(`SELECT name FROM sqlite_master WHERE type='table' AND name='documents'`)
    const hasDocumentsTable = tableCheck.rows.length > 0

    if (hasDocumentsTable) {
      let where = 'WHERE d.is_active = 1'
      const args: (string | number)[] = []
      if (search) {
        where += ' AND (d.file_name LIKE ? OR d.file_type LIKE ? OR d.notes LIKE ?)'
        const pattern = `%${search}%`
        args.push(pattern, pattern, pattern)
      }

      const result = await client.execute({
        sql: `
        SELECT d.*, ct.name as contractor_name
        FROM documents d
        LEFT JOIN contractors ct ON d.contractor_id = ct.id
        ${where}
        ORDER BY ${sortCol} ${sortOrder}`,
        args,
      })

      const documents = result.rows.map(row => ({
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

      return NextResponse.json({ documents, total: documents.length })
    }

    // Fallback: use contractors table
    let where = 'WHERE is_active = 1'
    const args: (string | number)[] = []
    if (search) {
      where += ' AND (name LIKE ? OR website LIKE ?)'
      const pattern = `%${search}%`
      args.push(pattern, pattern)
    }

    const sortMap: Record<string, string> = {
      fileName: 'name',
      fileType: 'website',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
    const sortColumn = sortMap[safeSort] || 'created_at'

    const result = await client.execute({
      sql: `
      SELECT id, name, website, created_at, updated_at
      FROM contractors
      ${where}
      ORDER BY ${sortColumn} ${sortOrder}`,
      args,
    })

    const documents = result.rows.map(row => ({
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

    return NextResponse.json({ documents, total: documents.length })
  } catch (error) {
    console.error('GET /api/documents/export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
