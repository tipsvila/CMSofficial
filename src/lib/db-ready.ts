import { initDatabase } from './db-init'

let ready = false

export async function ensureDb(): Promise<void> {
  if (ready) return
  await initDatabase()
  ready = true
}
