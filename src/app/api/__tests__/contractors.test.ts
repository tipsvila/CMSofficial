import { describe, it, expect } from 'vitest'

describe('API route structure', () => {
  it('contractors API module exports correctly', async () => {
    // Dynamic import to avoid Next.js server component issues
    const mod = await import('../contractors/route')
    expect(typeof mod.GET).toBe('function')
    expect(typeof mod.POST).toBe('function')
  })
})
