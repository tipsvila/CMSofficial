import { NextResponse } from 'next/server'
import { ensureDb } from '@/lib/db-ready'

export async function POST() {
  try {
    await ensureDb()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/init error:', error)
    return NextResponse.json({ error: 'Init failed' }, { status: 500 })
  }
}
