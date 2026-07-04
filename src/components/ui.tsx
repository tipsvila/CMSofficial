'use client'
import { ReactNode } from 'react'
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

interface DataTableProps {
  columns: { key: string; label: string; render?: (row: Record<string, unknown>) => ReactNode }[]
  data: Record<string, unknown>[]
  emptyMessage?: string
}
export function DataTable({ columns, data, emptyMessage = 'No data found' }: DataTableProps) {
  const rows = Array.isArray(data) ? data : []
  return (
    <div className="matdash-card p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="matdash-table">
          <thead>
            <tr>{columns.map((col) => <th key={col.key}>{col.label}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={columns.length} className="text-center py-8 text-[var(--text-muted)]">{emptyMessage}</td></tr>
            ) : rows.map((row, i) => (
              <tr key={(row.id as string) || i}>
                {columns.map((col) => (
                  <td key={col.key}>{col.render ? col.render(row) : String(row[col.key] ?? '-')}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
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
