import { NextResponse } from 'next/server'
import { client } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50')))
    const offset = (page - 1) * limit

    const countResult = await client.execute('SELECT COUNT(*) as cnt FROM notifications')
    const total = Number(countResult.rows[0]?.cnt || 0)

    const dataResult = await client.execute({
      sql: 'SELECT * FROM notifications ORDER BY created_at DESC LIMIT ? OFFSET ?',
      args: [limit, offset],
    })

    const notifications = dataResult.rows.map(row => ({
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      entityId: row.entity_id,
      entityType: row.entity_type,
      isRead: row.is_read === 1,
      createdAt: row.created_at,
    }))

    return NextResponse.json({ notifications, total, page, limit })
  } catch (error) {
    console.error('GET /api/notifications error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
