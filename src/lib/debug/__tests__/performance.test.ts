import { describe, it, expect } from 'vitest'
import { measure, trackApiCall } from '../performance'

describe('performance', () => {
  it('should measure function execution time', async () => {
    const result = await measure('test', async () => 42)
    expect(result).toBe(42)
  })

  it('should track API calls', async () => {
    const mockFetch = async () => ({ ok: true })
    const result = await trackApiCall('/api/test', mockFetch)
    expect(result.ok).toBe(true)
  })

  it('should propagate errors from measure', async () => {
    const err = new Error('boom')
    await expect(measure('failing', async () => { throw err })).rejects.toThrow('boom')
  })

  it('should propagate errors from trackApiCall', async () => {
    const err = new Error('network error')
    await expect(trackApiCall('/fail', async () => { throw err })).rejects.toThrow('network error')
  })
})
