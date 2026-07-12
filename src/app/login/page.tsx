'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useSettings } from '@/lib/settings-context'

export default function LoginPage() {
  const router = useRouter()
  const { settings } = useSettings()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || 'Login failed')
        setLoading(false)
        return
      }

      router.push('/')
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--content-bg)] p-4">
      <div className="w-full max-w-[380px]">
        <div className="matdash-card p-8">
          <div className="text-center mb-6">
            {settings.logoUrl && (
              <Image
                src={settings.logoUrl}
                alt={settings.companyName}
                width={64} height={64}
                className="w-16 h-16 mx-auto mb-3 rounded-xl object-contain"
                unoptimized
              />
            )}
            <h1 className="text-lg font-bold text-[var(--text-primary)]">{settings.companyName || 'CMS'}</h1>
            {settings.tagline && <p className="text-[var(--text-secondary)] text-[11px] mt-1">{settings.tagline}</p>}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-[var(--danger-light)] text-[var(--danger)] text-[13px] font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[12px] font-semibold text-[var(--text-secondary)] mb-1.5">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="matdash-input" placeholder="admin@intaerobase.com" required autoFocus
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[var(--text-secondary)] mb-1.5">Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="matdash-input" placeholder="Enter your password" required
              />
            </div>

            <button type="submit" disabled={loading} className="matdash-btn matdash-btn-primary w-full">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-[var(--text-muted)] text-[10px] mt-4">
            Contact your administrator for account access
          </p>
        </div>
      </div>
    </div>
  )
}
