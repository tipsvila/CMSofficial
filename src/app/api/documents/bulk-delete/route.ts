import { NextResponse } from 'next/server'
import { client } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { ids, deleteAll } = body as { ids?: string[]; deleteAll?: boolean }

    const now = new Date().toISOString()

    const tableCheck = await client.execute(`SELECT name FROM sqlite_master WHERE type='table' AND name='documents'`)
    if (tableCheck.rows.length === 0) {
      return NextResponse.json({ error: 'No documents table found' }, { status: 404 })
    }

    if (deleteAll) {
      const countResult = await client.execute('SELECT COUNT(*) as cnt FROM documents WHERE is_active = 1')
      const count = Number(countResult.rows[0]?.cnt || 0)
      await client.execute({ sql: 'UPDATE documents SET is_active = 0, updated_at = ? WHERE is_active = 1', args: [now] })
      return NextResponse.json({ success: true, deleted: count })
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No document IDs provided' }, { status: 400 })
    }

    if (ids.length > 500) {
      return NextResponse.json({ error: 'Maximum 500 documents per batch' }, { status: 400 })
    }

    const placeholders = ids.map(() => '?').join(',')
    const result = await client.execute({
      sql: `UPDATE documents SET is_active = 0, updated_at = ? WHERE id IN (${placeholders}) AND is_active = 1`,
      args: [now, ...ids],
    })

    return NextResponse.json({ success: true, deleted: result.rowsAffected })
  } catch (error) {
    console.error('POST /api/documents/bulk-delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
