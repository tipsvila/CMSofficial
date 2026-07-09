import { logger } from './logger'

type ErrorType = 'network' | 'auth' | 'validation' | 'unknown'

export function classifyError(error: Error): ErrorType {
  const message = error.message.toLowerCase()
  if (message.includes('fetch') || message.includes('network')) return 'network'
  if (message.includes('unauthorized') || message.includes('forbidden')) return 'auth'
  if (message.includes('validation') || message.includes('invalid')) return 'validation'
  return 'unknown'
}

export function handleError(error: Error, fallbackMessage: string): string {
  const type = classifyError(error)
  logger.error(`[${type}] ${error.message}`, { error: error.message, type })
  return fallbackMessage
}
