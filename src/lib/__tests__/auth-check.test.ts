import { describe, it, expect } from 'vitest'
import { requireAuth, requireRole, getUserIdentifier } from '../auth-check'

describe('auth-check', () => {
  // DEV_MODE is true in test env (NODE_ENV !== 'production')
  describe('requireAuth', () => {
    it('returns session in dev mode', () => {
      const result = requireAuth()
      expect('session' in result).toBe(true)
      if ('session' in result) {
        expect(result.session.role).toBe('ADMIN')
        expect(result.session.email).toContain('@')
        expect(result.session.userId).toBe('dev-user')
      }
    })

    it('returns session with all required fields', () => {
      const result = requireAuth()
      expect('session' in result).toBe(true)
      if ('session' in result) {
        expect(result.session).toHaveProperty('userId')
        expect(result.session).toHaveProperty('email')
        expect(result.session).toHaveProperty('name')
        expect(result.session).toHaveProperty('role')
      }
    })
  })

  describe('requireRole', () => {
    it('allows ADMIN access to any requested role', () => {
      const result = requireRole(['BUYER'])
      expect('session' in result).toBe(true)
    })

    it('allows ADMIN access when ADMIN is in the list', () => {
      const result = requireRole(['ADMIN', 'SELLER'])
      expect('session' in result).toBe(true)
    })

    it('returns session for matching role', () => {
      const result = requireRole(['ADMIN'])
      expect('session' in result).toBe(true)
      if ('session' in result) {
        expect(result.session.role).toBe('ADMIN')
      }
    })
  })

  describe('getUserIdentifier', () => {
    it('formats name and email', () => {
      const id = getUserIdentifier({
        userId: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'ADMIN',
      })
      expect(id).toBe('Test User (test@example.com)')
    })

    it('handles special characters in name', () => {
      const id = getUserIdentifier({
        userId: '2',
        email: 'user@domain.com',
        name: 'O\'Brien & Co.',
        role: 'BUYER',
      })
      expect(id).toContain('O\'Brien')
      expect(id).toContain('user@domain.com')
    })
  })
})
