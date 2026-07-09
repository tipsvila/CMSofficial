import { NextResponse } from 'next/server'
import { client } from '@/lib/db'

export async function DELETE() {
  try {
    await client.execute('DELETE FROM notifications')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/notifications/clear error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
