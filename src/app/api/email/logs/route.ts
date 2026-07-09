import { NextResponse } from 'next/server'
import { client } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
    const offset = (page - 1) * limit

    const result = await client.execute({
      sql: `SELECT * FROM email_log ORDER BY sent_at DESC LIMIT ? OFFSET ?`,
      args: [limit, offset],
    })

    const countResult = await client.execute({ sql: 'SELECT COUNT(*) as total FROM email_log' })
    const total = Number(countResult.rows[0]?.total || 0)

    return NextResponse.json({ logs: result.rows, total, page, limit })
  } catch {
    return NextResponse.json({ logs: [], total: 0, page: 1, limit: 50 })
  }
}
