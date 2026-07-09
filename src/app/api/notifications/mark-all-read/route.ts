import { NextResponse } from 'next/server'
import { client } from '@/lib/db'

export async function POST() {
  try {
    await client.execute('UPDATE notifications SET is_read = 1 WHERE is_read = 0')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/notifications/mark-all-read error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
