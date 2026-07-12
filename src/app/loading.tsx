import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-[var(--primary)]" size={36} />
        <p className="text-sm font-medium text-[var(--text-secondary)]">Loading...</p>
      </div>
    </div>
  )
}
