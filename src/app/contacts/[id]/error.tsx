'use client'
import { useEffect } from 'react'
export default function ContactDetailError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error('Contact detail error:', error) }, [error])
  return (
    <div className="matdash-card text-center py-12">
      <p className="text-[var(--danger)] mb-4">Failed to load contact details</p>
      <button onClick={reset} className="matdash-btn matdash-btn-primary text-[12px]">Try Again</button>
    </div>
  )
}
