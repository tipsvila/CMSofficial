'use client'

import { useEffect } from 'react'

export default function CapabilitiesError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('Capabilities error:', error) }, [error])

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="matdash-card max-w-md text-center">
        <h2 className="text-lg font-bold text-[var(--danger)] mb-2">Failed to load capabilities</h2>
        <p className="text-[13px] text-[var(--text-secondary)] mb-4">{error.message || 'Could not load capabilities data'}</p>
        <button onClick={reset} className="matdash-btn matdash-btn-primary text-[13px]">Try Again</button>
      </div>
    </div>
  )
}
