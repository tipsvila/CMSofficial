'use client'
import { memo, ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BadgeProps { variant: 'default' | 'success' | 'warning' | 'danger' | 'info'; children: ReactNode; className?: string }
const badgeVariants = {
  default: 'matdash-badge light-primary',
  success: 'matdash-badge light-success',
  warning: 'matdash-badge light-warning',
  danger: 'matdash-badge light-danger',
  info: 'matdash-badge light-primary',
}
export function Badge({ variant, children, className }: BadgeProps) {
  return <span className={cn(badgeVariants[variant], className)}>{children}</span>
}

interface DataTableProps<T = Record<string, unknown>> {
  columns: { key: string; label: string; headerRender?: () => ReactNode; render?: (row: T) => ReactNode }[]
  data: T[]
  emptyMessage?: string
  onRowClick?: (row: T) => void
}
export const DataTable = memo(function DataTable<T = Record<string, unknown>>({ columns, data, emptyMessage = 'No data found', onRowClick }: DataTableProps<T>) {
  const rows = Array.isArray(data) ? data : []
  return (
    <div className="matdash-card p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="matdash-table">
          <thead>
            <tr>{columns.map((col) => <th key={col.key}>{col.headerRender ? col.headerRender() : col.label}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={columns.length} className="text-center py-8 text-[var(--text-muted)]">{emptyMessage}</td></tr>
            ) : rows.map((row, i) => (
              <tr key={((row as Record<string, unknown>).id as string) || i} onClick={() => onRowClick?.(row)} className={onRowClick ? 'cursor-pointer' : ''}>
                {columns.map((col) => (
                  <td key={col.key}>{col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '-')}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
})

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
}
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Delete' }: ConfirmDialogProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in" onClick={onClose}>
      <div className="matdash-card w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">{title}</h3>
        <p className="text-sm text-[var(--text-secondary)] mb-6">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="matdash-btn matdash-btn-outline text-[12px]">Cancel</button>
          <button onClick={onConfirm} className="matdash-btn matdash-btn-danger text-[12px]">{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

interface ModalProps { open: boolean; onClose: () => void; title: string; children: ReactNode }
export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in" onClick={onClose}>
      <div className="matdash-card w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--primary-light)]"><X size={18} className="text-[var(--text-muted)]" /></button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  )
}
