type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface Logger {
  debug(message: string, context?: Record<string, unknown>): void
  info(message: string, context?: Record<string, unknown>): void
  warn(message: string, context?: Record<string, unknown>): void
  error(message: string, context?: Record<string, unknown>): void
}

function createLogger(): Logger {
  const log = (level: LogLevel, message: string, context?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString()

    if (process.env.NODE_ENV === 'development') {
      const colors: Record<LogLevel, string> = {
        debug: '\x1b[36m',
        info: '\x1b[32m',
        warn: '\x1b[33m',
        error: '\x1b[31m',
      }
      const contextStr = context ? ` ${JSON.stringify(context)}` : ''
      console.log(`${colors[level]}[${timestamp}] [${level.toUpperCase()}]\x1b[0m ${message}${contextStr}`)
    } else {
      console.log(JSON.stringify({ timestamp, level, message, context }))
    }
  }

  return {
    debug: (msg, ctx) => log('debug', msg, ctx),
    info: (msg, ctx) => log('info', msg, ctx),
    warn: (msg, ctx) => log('warn', msg, ctx),
    error: (msg, ctx) => log('error', msg, ctx),
  }
}

export const logger = createLogger()
