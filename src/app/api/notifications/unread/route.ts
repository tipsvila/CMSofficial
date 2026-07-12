import { NextResponse } from 'next/server'
import { client } from '@/lib/db'

export async function GET() {
  try {
    const result = await client.execute('SELECT COUNT(*) as cnt FROM notifications WHERE is_read = 0')
    const count = Number(result.rows[0]?.cnt || 0)
    return NextResponse.json({ count })
  } catch (error) {
    console.error('GET /api/notifications/unread error:', error)
    return NextResponse.json({ count: 0 })
  }
}
