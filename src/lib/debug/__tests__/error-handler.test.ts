import { describe, it, expect } from 'vitest'
import { handleError, classifyError } from '../error-handler'

describe('error-handler', () => {
  it('should classify network errors', () => {
    const error = new TypeError('Failed to fetch')
    expect(classifyError(error)).toBe('network')
  })

  it('should classify auth errors', () => {
    const error = new Error('Unauthorized')
    expect(classifyError(error)).toBe('auth')
  })

  it('should classify validation errors', () => {
    const error = new Error('Validation failed')
    expect(classifyError(error)).toBe('validation')
  })

  it('should return user-friendly message', () => {
    const error = new Error('Network error')
    const message = handleError(error, 'Failed to load data')
    expect(message).toBe('Failed to load data')
  })
})
