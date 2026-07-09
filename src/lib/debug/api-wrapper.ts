import { logger } from './logger'
import { handleError } from './error-handler'
import { measure } from './performance'

export async function withDebug<T>(
  label: string,
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await measure(label, fn)
  } catch (error) {
    const message = handleError(error as Error, `Failed: ${label}`)
    logger.error(`[Debug] ${label} failed`, { error: message })
    return fallback
  }
}