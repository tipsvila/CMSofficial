import { NextResponse } from 'next/server'
import { initDatabase } from '@/lib/db-init'
import { seedDatabase } from '@/lib/seed'

export async function GET() {
  try {
    const init = await initDatabase()
    const seed = await seedDatabase()
    return NextResponse.json({ init, seed })
  } catch (error) {
    console.error('GET /api/init error:', error)
    return NextResponse.json({ error: 'Init failed' }, { status: 500 })
  }
}
