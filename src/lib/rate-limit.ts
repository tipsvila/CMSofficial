const hits = new Map<string, { count: number; resetAt: number }>()

export interface RateLimitConfig {
  windowMs: number
  max: number
}

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  api: { windowMs: 60_000, max: 100 },
  write: { windowMs: 60_000, max: 30 },
  init: { windowMs: 300_000, max: 5 },
}

export function checkRateLimit(key: string, cfg: RateLimitConfig): { allowed: boolean; resetAt: number } {
  const now = Date.now()
  const entry = hits.get(key)

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + cfg.windowMs })
    return { allowed: true, resetAt: now + cfg.windowMs }
  }

  entry.count++
  if (entry.count > cfg.max) {
    return { allowed: false, resetAt: entry.resetAt }
  }

  return { allowed: true, resetAt: entry.resetAt }
}

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of hits) {
    if (now > entry.resetAt) hits.delete(key)
  }
}, 300_000)
