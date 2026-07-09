import { NextResponse } from 'next/server'

export type UserRole = 'ADMIN' | 'BUYER' | 'SELLER' | 'COMPLIANCE_OFFICER'

interface Session {
  userId: string
  email: string
  name: string
  role: UserRole
}

// Session lookup - reads from cookie
function getSession(): Session | null {
  // TODO: implement real JWT session lookup
  // For now, check for session token cookie
  const cookies = document.cookie.split(';')
  const sessionCookie = cookies.find(c => c.trim().startsWith('session-token='))
  if (!sessionCookie) return null

  // TODO: validate JWT and extract session data
  // For now, return null until JWT implementation is complete
  return null
}

export function requireAuth(): { session: Session } | { error: NextResponse } {
  const session = getSession()
  if (!session) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  return { session }
}

export function requireRole(roles: UserRole[]) {
  const result = requireAuth()
  if ('error' in result) return result
  if (result.session.role === 'ADMIN') return result
  if (!roles.includes(result.session.role)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return result
}

export function requireAnyRole(roles: UserRole[]) {
  return requireRole(roles)
}

export function getUserIdentifier(session: Session): string {
  return `${session.name} (${session.email})`
}
