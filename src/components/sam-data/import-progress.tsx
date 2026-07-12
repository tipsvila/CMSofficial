'use client'

import { X, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface ImportProgressProps {
  status: 'idle' | 'importing' | 'done' | 'error'
  imported: number
  total: number
  percent: number
  skipped: number
  error: string | null
  onCancel: () => void
  onDismiss: () => void
}

export function ImportProgress({ status, imported, total, percent, skipped, error, onCancel, onDismiss }: ImportProgressProps) {
  if (status === 'idle') return null

  return (
    <div className="matdash-card mb-4 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {status === 'importing' && <Loader2 size={16} className="animate-spin text-[var(--primary)]" />}
          {status === 'done' && <CheckCircle size={16} className="text-green-500" />}
          {status === 'error' && <AlertCircle size={16} className="text-[var(--danger)]" />}
          <span className="text-[13px] font-semibold text-[var(--text-primary)]">
            {status === 'importing' && 'Importing CSV...'}
            {status === 'done' && 'Import Complete'}
            {status === 'error' && 'Import Failed'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {status === 'importing' && (
            <button onClick={onCancel} className="text-[11px] text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors">
              Cancel
            </button>
          )}
          {(status === 'done' || status === 'error') && (
            <button onClick={onDismiss} className="p-1 hover:bg-[var(--content-bg)] rounded transition-colors">
              <X size={14} className="text-[var(--text-muted)]" />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {status === 'importing' && (
        <div className="w-full bg-[var(--border-color)] rounded-full h-2 mb-2">
          <div
            className="bg-[var(--primary)] h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}

      {/* Status text */}
      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
        <span>
          {status === 'importing' && `${imported.toLocaleString()} of ${total.toLocaleString()} rows (${percent}%)`}
          {status === 'done' && `${imported.toLocaleString()} imported${skipped > 0 ? `, ${skipped.toLocaleString()} skipped` : ''}`}
          {status === 'error' && error}
        </span>
        {status === 'importing' && total > 0 && (
          <span>{Math.round((imported / total) * 100)}%</span>
        )}
      </div>
    </div>
  )
}
