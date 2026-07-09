'use client'
import { useEffect } from 'react'
export default function ContactsError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error('Contacts error:', error) }, [error])
  return (
    <div className="matdash-card text-center py-12">
      <p className="text-[var(--danger)] mb-4">Failed to load contacts</p>
      <button onClick={reset} className="matdash-btn matdash-btn-primary text-[12px]">Try Again</button>
    </div>
  )
}
