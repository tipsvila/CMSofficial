import { db } from './db'
import { contractors } from './schema'
import { initDatabase } from './db-init'
import { seedDatabase } from './seed'

let ready = false

export async function ensureDb(): Promise<void> {
  if (ready) return
  await initDatabase()
  const existing = await db.select({ id: contractors.id }).from(contractors).limit(1)
  if (existing.length === 0) {
    await seedDatabase()
  }
  ready = true
}
