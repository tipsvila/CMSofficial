import { logger } from './logger'

export async function measure<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now()
  try {
    return await fn()
  } finally {
    const duration = Math.round(performance.now() - start)
    if (duration > 500) {
      logger.warn(`[Performance] Slow operation: ${label} - ${duration}ms`)
    } else {
      logger.debug(`[Performance] ${label} - ${duration}ms`)
    }
  }
}

export async function trackApiCall<T>(endpoint: string, fetchFn: () => Promise<T>): Promise<T> {
  const start = performance.now()
  try {
    return await fetchFn()
  } finally {
    const duration = Math.round(performance.now() - start)
    logger.info(`[API] ${endpoint} - ${duration}ms`)
  }
}
