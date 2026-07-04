import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { companySettings } from '@/lib/schema'
import { initDatabase } from '@/lib/db-init'
import { seedDatabase } from '@/lib/seed'

let initialized = false

async function ensureDb() {
  if (initialized) return
  await initDatabase()
  const existing = await db.select().from(companySettings).limit(1)
  if (existing.length === 0) {
    await seedDatabase()
  }
  initialized = true
}

export async function GET() {
  try {
    await ensureDb()
    const settings = await db.select().from(companySettings).limit(1)
    if (settings.length === 0) {
      return NextResponse.json({ companyName: 'INTAEROBASE', tagline: 'Aviation CMS' })
    }
    return NextResponse.json(settings[0])
  } catch (error) {
    console.error('GET /api/settings error:', error)
    return NextResponse.json({ companyName: 'INTAEROBASE', tagline: 'Aviation CMS' })
  }
}
