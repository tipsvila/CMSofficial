'use client'

import { memo } from 'react'
import { FileSpreadsheet, Trash2, ArrowRightLeft, Mail, X } from 'lucide-react'

interface BulkActionsProps {
  selectedCount: number
  onClearSelection: () => void
  onExportSelected: () => void
  onDeleteSelected: () => void
  onTransferSelected: () => void
  onEmailSelected?: () => void
  entityName?: string
}

export const BulkActions = memo(function BulkActions({
  selectedCount,
  onClearSelection,
  onExportSelected,
  onDeleteSelected,
  onTransferSelected,
  onEmailSelected,
  entityName = 'items'
}: BulkActionsProps) {
  if (selectedCount === 0) return null

  return (
    <div className="bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-lg p-3 mb-4 flex items-center justify-between animate-fade-in">
      <div className="flex items-center gap-3">
        <span className="text-[12px] font-medium text-[var(--primary)]">
          {selectedCount} {selectedCount === 1 ? entityName.slice(0, -1) || 'item' : entityName} selected
        </span>
        <button onClick={onClearSelection}
          className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
          <X size={14} /> Clear
        </button>
      </div>
      <div className="flex items-center gap-2">
        {onEmailSelected && (
          <button onClick={onEmailSelected}
            className="flex items-center gap-2 matdash-btn matdash-btn-outline px-3 py-1.5 rounded-md text-[11px] transition-colors">
            <Mail size={14} /> Email
          </button>
        )}
        <button onClick={onExportSelected}
          className="flex items-center gap-2 matdash-btn matdash-btn-outline px-3 py-1.5 rounded-md text-[11px] transition-colors">
          <FileSpreadsheet size={14} /> Export Selected
        </button>
        <button onClick={onTransferSelected}
          className="flex items-center gap-2 matdash-btn matdash-btn-outline px-3 py-1.5 rounded-md text-[11px] transition-colors">
          <ArrowRightLeft size={14} /> Transfer To
        </button>
        <button onClick={onDeleteSelected}
          className="flex items-center gap-2 matdash-btn matdash-btn-danger px-3 py-1.5 rounded-md text-[11px] transition-colors">
          <Trash2 size={14} /> Delete Selected
        </button>
      </div>
    </div>
  )
})