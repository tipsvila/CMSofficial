import { db } from '@/lib/db'
import { companySettings } from '@/lib/schema'

const CACHE_TTL_MS = 30 * 1000
let cachedSettings: Record<string, unknown> | null = null
let cacheTimestamp = 0

export async function getCompanySettings(): Promise<Record<string, unknown>> {
  if (cachedSettings && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cachedSettings
  }

  const settings = await db.select().from(companySettings).limit(1)
  if (settings.length === 0) return {} as Record<string, unknown>

  cachedSettings = settings[0] as unknown as Record<string, unknown>
  cacheTimestamp = Date.now()
  return cachedSettings
}

export function clearSettingsCache() {
  cachedSettings = null
  cacheTimestamp = 0
}
