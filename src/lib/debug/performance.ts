import { logger } from './logger'

export async function measure<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now()
  const result = await fn()
  const duration = Math.round(performance.now() - start)

  if (duration > 500) {
    logger.warn(`[Performance] Slow operation: ${label} - ${duration}ms`)
  } else {
    logger.debug(`[Performance] ${label} - ${duration}ms`)
  }

  return result
}

export async function trackApiCall<T>(endpoint: string, fetchFn: () => Promise<T>): Promise<T> {
  const start = performance.now()
  const result = await fetchFn()
  const duration = Math.round(performance.now() - start)

  logger.info(`[API] ${endpoint} - ${duration}ms`)

  return result
}
