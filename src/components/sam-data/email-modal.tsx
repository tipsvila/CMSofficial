'use client'

import { useState, useEffect, useCallback } from 'react'
import { Modal } from '@/components/ui'
import { Mail, Loader2, Check, AlertCircle, ChevronDown, Send, X } from 'lucide-react'
import { useToast } from '@/components/toast'
import {
  sendSAMEmail,
  sendBulkSAMEmail,
  buildDefaultSubject,
  TEMPLATE_LABELS,
  SAM_TEMPLATE_KEYS,
  type SAMRecord,
  type SAMContact,
  type BulkSendResult,
} from '@/lib/sam-email'

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmailModalProps {
  open: boolean
  onClose: () => void
  records: SAMRecord[]
  mode?: 'quick' | 'bulk'
  onComplete?: () => void
}

type ModalStep = 'compose' | 'sending' | 'result'

// ─── Main Component ───────────────────────────────────────────────────────────

export function EmailModal({ open, onClose, records, mode = 'quick', onComplete }: EmailModalProps) {
  const { toast } = useToast()

  // Form state
  const [to, setTo] = useState('')
  const [cc, setCc] = useState('')
  const [bcc, setBcc] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [template, setTemplate] = useState<string>('')
  const [step, setStep] = useState<ModalStep>('compose')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<BulkSendResult | null>(null)

  // Auto-fill from first record
  const firstRecord = records[0]
  const isBulk = records.length > 1

  // Build initial values when modal opens
  const resetForm = useCallback(() => {
    setTo('')
    setCc('')
    setBcc('')
    setSubject(firstRecord ? buildDefaultSubject(firstRecord, template) : '')
    setBody('')
    setTemplate('')
    setStep('compose')
    setSending(false)
    setResult(null)
  }, [firstRecord, template])

  useEffect(() => {
    if (open) resetForm()
  }, [open, resetForm])

  // Auto-fill subject when template changes
  useEffect(() => {
    if (firstRecord && template) {
      setSubject(buildDefaultSubject(firstRecord, template))
    }
  }, [template, firstRecord])

  const handleSend = async () => {
    if (isBulk) return handleBulkSend()
    return handleQuickSend()
  }

  const handleQuickSend = async () => {
    if (!to.trim()) { toast('error', 'Recipient email is required'); return }
    if (!firstRecord) { toast('error', 'No SAM record selected'); return }

    setStep('sending')
    setSending(true)

    try {
      await sendSAMEmail(firstRecord.id, {
        to: to.trim(),
        cc: cc.trim() || undefined,
        bcc: bcc.trim() || undefined,
        subject: subject.trim() || undefined,
        template: template || undefined,
        customBody: !template ? body.trim() || undefined : undefined,
      })

      setResult({ total: 1, sent: 1, failed: 0, errors: [] })
      setStep('result')
      toast('success', 'Email sent successfully')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send email'
      setResult({ total: 1, sent: 0, failed: 1, errors: [{ error: errorMsg }] })
      setStep('result')
      toast('error', errorMsg)
    } finally {
      setSending(false)
    }
  }

  const handleBulkSend = async () => {
    if (!to.trim()) { toast('error', 'Recipient email is required'); return }
    if (records.length === 0) { toast('error', 'No SAM records selected'); return }

    setStep('sending')
    setSending(true)

    try {
      const bulkResult = await sendBulkSAMEmail(
        records.map(r => r.id),
        {
          to: to.trim(),
          cc: cc.trim() || undefined,
          bcc: bcc.trim() || undefined,
          subject: subject.trim() || undefined,
          template: template || undefined,
          customBody: !template ? body.trim() || undefined : undefined,
        }
      )

      setResult(bulkResult)
      setStep('result')

      if (bulkResult.failed === 0) {
        toast('success', `Emails sent to ${bulkResult.sent} of ${bulkResult.total} recipients`)
      } else {
        toast('error', `${bulkResult.failed} of ${bulkResult.total} emails failed`)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send emails'
      setResult({ total: records.length, sent: 0, failed: records.length, errors: [{ error: errorMsg }] })
      setStep('result')
      toast('error', errorMsg)
    } finally {
      setSending(false)
    }
  }

  const handleClose = () => {
    if (sending) return
    if (step === 'result' && result?.sent) onComplete?.()
    resetForm()
    onClose()
  }

  const getTitle = () => {
    if (step === 'sending') return 'Sending Email...'
    if (step === 'result') return result?.failed === 0 ? 'Email Sent' : 'Email Errors'
    return isBulk ? `Bulk Email (${records.length} recipients)` : 'Quick Email'
  }

  const canSend = !!to.trim() && !sending

  return (
    <Modal open={open} onClose={handleClose} title={getTitle()}>
      {step === 'compose' && (
        <ComposeForm
          to={to} setTo={setTo}
          cc={cc} setCc={setCc}
          bcc={bcc} setBcc={setBcc}
          subject={subject} setSubject={setSubject}
          body={body} setBody={setBody}
          template={template} setTemplate={setTemplate}
          records={records}
          isBulk={isBulk}
          canSend={canSend}
          onSend={handleSend}
          onCancel={handleClose}
        />
      )}

      {step === 'sending' && (
        <SendingStep total={records.length} />
      )}

      {step === 'result' && result && (
        <ResultStep
          result={result}
          onClose={handleClose}
          onRetry={() => { setStep('compose'); setResult(null) }}
        />
      )}
    </Modal>
  )
}

// ─── Compose Form ─────────────────────────────────────────────────────────────

function ComposeForm({
  to, setTo, cc, setCc, bcc, setBcc,
  subject, setSubject, body, setBody,
  template, setTemplate,
  records, isBulk, canSend, onSend, onCancel,
}: {
  to: string; setTo: (v: string) => void
  cc: string; setCc: (v: string) => void
  bcc: string; setBcc: (v: string) => void
  subject: string; setSubject: (v: string) => void
  body: string; setBody: (v: string) => void
  template: string; setTemplate: (v: string) => void
  records: SAMRecord[]
  isBulk: boolean
  canSend: boolean
  onSend: () => void
  onCancel: () => void
}) {
  const [showCcBcc, setShowCcBcc] = useState(false)

  // Pre-fill from contacts if available
  const handleContactSelect = (contact: SAMContact) => {
    if (contact.email) setTo(contact.email)
  }

  const firstRecord = records[0]

  return (
    <div className="space-y-3">
      {/* Bulk recipient list */}
      {isBulk && (
        <div className="bg-[var(--content-bg)] rounded-lg p-3 border border-[var(--border-color)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
              Sending to {records.length} SAM record{records.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="max-h-20 overflow-y-auto space-y-1">
            {records.map(r => (
              <div key={r.id} className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
                <Mail size={10} className="shrink-0 text-[var(--text-muted)]" />
                <span className="font-medium truncate">{r.awardIdPiid}</span>
                <span className="text-[var(--text-muted)]">— {r.recipientName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Template selector */}
      <div>
        <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Template</label>
        <div className="relative">
          <select value={template} onChange={e => setTemplate(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[13px] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 appearance-none">
            <option value="">Custom (no template)</option>
            {SAM_TEMPLATE_KEYS.map(key => (
              <option key={key} value={key}>{TEMPLATE_LABELS[key]}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
        </div>
        {template && (
          <p className="text-[10px] text-[var(--text-muted)] mt-1">
            Subject and body will be auto-generated from the template
          </p>
        )}
      </div>

      {/* To field with contact suggestions */}
      <div>
        <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">To *</label>
        <input type="email" value={to} onChange={e => setTo(e.target.value)}
          className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[13px] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
          placeholder="recipient@example.com" />

        {/* Quick-fill from contacts */}
        {firstRecord?.contacts && firstRecord.contacts.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            <span className="text-[10px] text-[var(--text-muted)]">Quick fill:</span>
            {firstRecord.contacts.filter(c => c.email).map(contact => (
              <button key={contact.id} type="button" onClick={() => handleContactSelect(contact)}
                className="text-[10px] text-[var(--primary)] hover:underline">
                {contact.firstName} {contact.lastName} ({contact.email})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* CC/BCC toggle */}
      <div>
        <button type="button" onClick={() => setShowCcBcc(!showCcBcc)}
          className="text-[11px] text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">
          {showCcBcc ? 'Hide' : 'Show'} CC / BCC
        </button>
      </div>

      {showCcBcc && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">CC</label>
            <input type="email" value={cc} onChange={e => setCc(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[13px] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
              placeholder="cc@example.com" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">BCC</label>
            <input type="email" value={bcc} onChange={e => setBcc(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[13px] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
              placeholder="bcc@example.com" />
          </div>
        </div>
      )}

      {/* Subject */}
      <div>
        <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Subject</label>
        <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
          disabled={!!template}
          className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[13px] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 disabled:opacity-50"
          placeholder="Email subject" />
      </div>

      {/* Body */}
      {!template && (
        <div>
          <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Message</label>
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={6}
            className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[13px] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 resize-none"
            placeholder="Type your message..." />
        </div>
      )}

      {template && (
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
          <p className="text-[11px] text-blue-600">
            Using the <strong>{TEMPLATE_LABELS[template]}</strong> template. The email content will be generated from this template using the SAM record context.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-color)]">
        <button onClick={onCancel} className="matdash-btn matdash-btn-outline text-[12px]">
          <X size={14} className="inline mr-1" /> Cancel
        </button>
        <button onClick={onSend} disabled={!canSend}
          className="matdash-btn matdash-btn-primary text-[12px] disabled:opacity-50">
          <Send size={14} className="inline mr-1" /> {isBulk ? `Send to ${records.length} Records` : 'Send Email'}
        </button>
      </div>
    </div>
  )
}

// ─── Sending Step ─────────────────────────────────────────────────────────────

function SendingStep({ total }: { total: number }) {
  return (
    <div className="text-center py-8">
      <Loader2 size={32} className="animate-spin text-[var(--primary)] mx-auto mb-3" />
      <p className="text-[13px] font-semibold text-[var(--text-primary)]">
        Sending email{total > 1 ? `s to ${total} recipients` : ''}...
      </p>
      <p className="text-[11px] text-[var(--text-muted)] mt-1">
        Please do not close this window
      </p>
    </div>
  )
}

// ─── Result Step ──────────────────────────────────────────────────────────────

function ResultStep({
  result, onClose, onRetry,
}: {
  result: BulkSendResult
  onClose: () => void
  onRetry: () => void
}) {
  const allSent = result.failed === 0

  return (
    <div className="space-y-4">
      <div className="text-center">
        {allSent ? (
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
            <Check size={24} className="text-green-500" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
            <AlertCircle size={24} className="text-amber-500" />
          </div>
        )}
        <p className="text-[13px] font-semibold text-[var(--text-primary)]">
          {allSent ? 'Email Sent Successfully' : 'Some Emails Failed'}
        </p>
        <p className="text-[11px] text-[var(--text-muted)] mt-1">
          {result.sent} of {result.total} sent
          {result.failed > 0 && <> · {result.failed} failed</>}
        </p>
      </div>

      {result.errors.length > 0 && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
          <p className="text-[11px] font-semibold text-[var(--danger)] mb-2">Errors</p>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {result.errors.map((err, i) => (
              <div key={i} className="text-[10px] text-[var(--text-secondary)]">
                {err.recipient && <span className="font-medium">{err.recipient}: </span>}
                {err.error}
              </div>
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
