'use client'

import { AlertTriangle } from 'lucide-react'

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-[600px] flex items-center justify-center">
      <div className="text-center max-w-md">
        <AlertTriangle className="mx-auto h-16 w-16 text-[var(--danger)] mb-6" />
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Something went wrong</h1>
        <p className="text-[var(--text-secondary)] mb-2">{error.message || 'An unexpected error occurred'}</p>
        {error.digest && <p className="text-xs text-[var(--text-muted)] mb-6">Error ID: {error.digest}</p>}
        <button
          onClick={reset}
          className="px-6 py-3 matdash-btn matdash-btn-primary rounded-lg font-medium"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
