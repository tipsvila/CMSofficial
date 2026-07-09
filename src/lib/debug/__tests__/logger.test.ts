import { describe, it, expect } from 'vitest'
import { logger } from '../logger'

describe('logger', () => {
  it('should have debug, info, warn, error methods', () => {
    expect(typeof logger.debug).toBe('function')
    expect(typeof logger.info).toBe('function')
    expect(typeof logger.warn).toBe('function')
    expect(typeof logger.error).toBe('function')
  })

  it('should accept message and context', () => {
    expect(() => logger.info('[Test] Message', { key: 'value' })).not.toThrow()
  })
})
