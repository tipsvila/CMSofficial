'use client'

import { useState, useEffect, useCallback } from 'react'
import { Modal } from '@/components/ui'
import { AlertTriangle, Loader2, Check, X, Calendar, User, FileText, Flag } from 'lucide-react'
import { useToast } from '@/components/toast'
import {
  createSAMFollowUp,
  createBulkSAMFollowUps,
  COMPLIANCE_PRIORITIES,
  formatDueDate,
  type SAMRecord,
  type CompliancePriority,
} from '@/lib/sam-compliance'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ComplianceModalProps {
  open: boolean
  onClose: () => void
  records: SAMRecord[]
  onComplete?: () => void
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ComplianceModal({ open, onClose, records, onComplete }: ComplianceModalProps) {
  const { toast } = useToast()

  const [priority, setPriority] = useState<CompliancePriority>('Medium')
  const [notes, setNotes] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [assignTo, setAssignTo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ created: number; failed: number; errors: string[] } | null>(null)

  const isBulk = records.length > 1

  const resetForm = useCallback(() => {
    setPriority('Medium')
    setNotes('')
    setDueDate('')
    setAssignTo('')
    setSubmitting(false)
    setResult(null)
  }, [])

  useEffect(() => {
    if (open) resetForm()
  }, [open, resetForm])

  const handleSubmit = async () => {
    if (records.length === 0) { toast('error', 'No SAM records selected'); return }

    setSubmitting(true)

    try {
      if (isBulk) {
        const res = await createBulkSAMFollowUps(records, { priority, notes, dueDate, assignTo })
        setResult(res)

        if (res.failed === 0) {
          toast('success', `Created ${res.created} compliance follow-up${res.created !== 1 ? 's' : ''}`)
        } else {
          toast('error', `${res.failed} of ${res.total} follow-ups failed`)
        }
      } else {
        const res = await createSAMFollowUp(records[0], { samRecordId: records[0].id, priority, notes, dueDate, assignTo })

        if (res.success) {
          setResult({ created: 1, failed: 0, errors: [] })
          toast('success', 'Compliance follow-up created')
        } else {
          setResult({ created: 0, failed: 1, errors: [res.error || 'Failed'] })
          toast('error', res.error || 'Failed to create compliance follow-up')
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create follow-ups'
      setResult({ created: 0, failed: records.length, errors: [errorMsg] })
      toast('error', errorMsg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (submitting) return
    if (result && result.created > 0) onComplete?.()
    resetForm()
    onClose()
  }

  const getTitle = () => {
    if (result) return result.failed === 0 ? 'Follow-ups Created' : 'Partial Failure'
    return isBulk ? `Mark for Follow-up (${records.length} records)` : 'Mark for Follow-up'
  }

  const canSubmit = !submitting

  return (
    <Modal open={open} onClose={handleClose} title={getTitle()}>
      {!result ? (
        <FollowUpForm
          priority={priority} setPriority={setPriority}
          notes={notes} setNotes={setNotes}
          dueDate={dueDate} setDueDate={setDueDate}
          assignTo={assignTo} setAssignTo={setAssignTo}
          records={records}
          isBulk={isBulk}
          canSubmit={canSubmit}
          onSubmit={handleSubmit}
          onCancel={handleClose}
        />
      ) : (
        <ResultStep
          result={result}
          isBulk={isBulk}
          totalRecords={records.length}
          onClose={handleClose}
          onRetry={() => setResult(null)}
        />
      )}
    </Modal>
  )
}

// ─── Follow-Up Form ──────────────────────────────────────────────────────────

function FollowUpForm({
  priority, setPriority, notes, setNotes,
  dueDate, setDueDate, assignTo, setAssignTo,
  records, isBulk, canSubmit, onSubmit, onCancel,
}: {
  priority: CompliancePriority; setPriority: (v: CompliancePriority) => void
  notes: string; setNotes: (v: string) => void
  dueDate: string; setDueDate: (v: string) => void
  assignTo: string; setAssignTo: (v: string) => void
  records: SAMRecord[]
  isBulk: boolean
  canSubmit: boolean
  onSubmit: () => void
  onCancel: () => void
}) {
  const inputClass = 'w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[13px] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30'

  return (
    <div className="space-y-4">
      {/* Record summary */}
      <div className="bg-[var(--content-bg)] rounded-lg p-3 border border-[var(--border-color)]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
            {isBulk ? `${records.length} SAM records selected` : 'SAM Record'}
          </span>
        </div>
        {isBulk ? (
          <div className="max-h-20 overflow-y-auto space-y-1">
            {records.map(r => (
              <div key={r.id} className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
                <FileText size={10} className="shrink-0 text-[var(--text-muted)]" />
                <span className="font-medium truncate">{r.awardIdPiid}</span>
                <span className="text-[var(--text-muted)]">— {r.recipientName}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[12px] text-[var(--text-primary)]">
            <FileText size={12} className="shrink-0 text-[var(--text-muted)]" />
            <span className="font-medium">{records[0].awardIdPiid}</span>
            <span className="text-[var(--text-muted)]">— {records[0].recipientName}</span>
          </div>
        )}
      </div>

      {/* Priority */}
      <div>
        <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
          <Flag size={10} className="inline mr-1" /> Priority *
        </label>
        <div className="flex gap-2">
          {COMPLIANCE_PRIORITIES.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              className={`flex-1 px-3 py-2 rounded-lg text-[12px] font-medium border transition-colors ${
                priority === p
                  ? p === 'High'
                    ? 'bg-red-500/10 border-red-500/30 text-red-600'
                    : p === 'Medium'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-600'
                    : 'bg-green-500/10 border-green-500/30 text-green-600'
                  : 'bg-[var(--card-bg)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--primary)]/30'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Due Date */}
      <div>
        <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
          <Calendar size={10} className="inline mr-1" /> Due Date
        </label>
        <input
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
          className={inputClass}
          min={new Date().toISOString().split('T')[0]}
        />
        {dueDate && (
          <p className="text-[10px] text-[var(--text-muted)] mt-1">
            Due: {formatDueDate(dueDate)}
          </p>
        )}
      </div>

      {/* Assign To */}
      <div>
        <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
          <User size={10} className="inline mr-1" /> Assign To
        </label>
        <input
          type="text"
          value={assignTo}
          onChange={e => setAssignTo(e.target.value)}
          className={inputClass}
          placeholder="Team member name or email"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
          <FileText size={10} className="inline mr-1" /> Notes
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          className={`${inputClass} resize-none`}
          placeholder="Internal notes for compliance team..."
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border-color)]">
        <button onClick={onCancel} className="matdash-btn matdash-btn-outline text-[12px]">
          <X size={14} className="inline mr-1" /> Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={!canSubmit}
          className="matdash-btn matdash-btn-primary text-[12px] disabled:opacity-50"
        >
          {isBulk ? `Create ${records.length} Follow-ups` : 'Create Follow-up'}
        </button>
      </div>
    </div>
  )
}

// ─── Result Step ──────────────────────────────────────────────────────────────

function ResultStep({
  result, isBulk, totalRecords, onClose, onRetry,
}: {
  result: { created: number; failed: number; errors: string[] }
  isBulk: boolean
  totalRecords: number
  onClose: () => void
  onRetry: () => void
}) {
  const allCreated = result.failed === 0

  return (
    <div className="space-y-4">
      <div className="text-center">
        {allCreated ? (
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
            <Check size={24} className="text-green-500" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle size={24} className="text-amber-500" />
          </div>
        )}
        <p className="text-[13px] font-semibold text-[var(--text-primary)]">
          {allCreated ? 'Follow-ups Created Successfully' : 'Some Follow-ups Failed'}
        </p>
        <p className="text-[11px] text-[var(--text-muted)] mt-1">
          {result.created} of {totalRecords} created
          {result.failed > 0 && <> · {result.failed} failed</>}
        </p>
      </div>

      {result.errors.length > 0 && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
          <p className="text-[11px] font-semibold text-[var(--danger)] mb-2">Errors</p>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {result.errors.map((err, i) => (
              <div key={i} className="text-[10px] text-[var(--text-secondary)]">{err}</div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-color)]">
        {result.failed > 0 && (
          <button onClick={onRetry} className="matdash-btn matdash-btn-outline text-[12px]">
            Retry Failed
          </button>
        )}
        <button onClick={onClose} className="matdash-btn matdash-btn-primary text-[12px]">
          Done
        </button>
      </div>
    </div>
  )
}
