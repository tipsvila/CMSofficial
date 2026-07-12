'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui'
import { ArrowRightLeft, Check, Loader2, AlertCircle, Mail, FileText, Users, ClipboardCheck, Phone, HelpCircle, Send } from 'lucide-react'
import { useToast } from '@/components/toast'
import { api } from '@/lib/api-client'
import type { SAMRecord } from '@/lib/sam-email'

type EntityType = 'contractor' | 'contract' | 'compliance' | 'contact' | 'outreach' | 'inquiry' | 'email'

interface TransferOption {
  type: EntityType
  label: string
  description: string
  icon: React.ReactNode
}

const TRANSFER_OPTIONS: TransferOption[] = [
  { type: 'contractor', label: 'Contractors', description: 'Create contractor records from SAM recipients', icon: <Users size={18} /> },
  { type: 'contract', label: 'Contracts', description: 'Create contract records linked to SAM data', icon: <FileText size={18} /> },
  { type: 'compliance', label: 'Compliance', description: 'Add to compliance tracking', icon: <ClipboardCheck size={18} /> },
  { type: 'contact', label: 'Contacts', description: 'Create contact records from SAM recipients', icon: <Phone size={18} /> },
  { type: 'outreach', label: 'Outreach', description: 'Create outreach activities', icon: <Send size={18} /> },
  { type: 'inquiry', label: 'Inquiries', description: 'Create inquiry records', icon: <HelpCircle size={18} /> },
  { type: 'email', label: 'Email', description: 'Send email to SAM contacts', icon: <Mail size={18} /> },
]

interface MappingRow {
  samField: string
  targetField: string
  value: string
}

function buildMappingPreview(records: SAMRecord[], entityType: EntityType): MappingRow[] {
  const record = records[0]
  if (!record) return []

  const samLink = `Linked from SAM Record: ${record.awardIdPiid} - ${record.recipientName}`

  switch (entityType) {
    case 'contractor':
      return [
        { samField: 'Recipient Name', targetField: 'Name', value: record.recipientName || '-' },
        { samField: 'Award ID/PIID', targetField: 'Notes', value: `SAM ID: ${record.awardIdPiid}` },
        { samField: 'Awarding Agency', targetField: 'Notes', value: record.awardingAgencyName || '-' },
      ]
    case 'contract':
      return [
        { samField: 'Award ID/PIID', targetField: 'Title', value: `Contract from ${record.awardIdPiid}` },
        { samField: 'Award ID/PIID', targetField: 'Notes', value: samLink },
        { samField: 'Total Obligated Amount', targetField: 'Total Amount', value: record.totalObligatedAmount != null ? `$${Number(record.totalObligatedAmount).toLocaleString()}` : '-' },
      ]
    case 'compliance':
      return [
        { samField: '(User)', targetField: 'Type', value: 'SAM Record Transfer' },
        { samField: 'Award ID/PIID', targetField: 'Requirement', value: `Compliance for ${record.awardIdPiid}` },
        { samField: 'NAICS', targetField: 'Scope', value: record.naicsDescription || 'Contract' },
        { samField: 'Award ID/PIID', targetField: 'Notes', value: samLink },
      ]
    case 'contact':
      return [
        { samField: 'Recipient Name', targetField: 'Name', value: record.recipientName || '-' },
        { samField: 'Award ID/PIID', targetField: 'Title', value: 'SAM Record Contact' },
        { samField: 'Award ID/PIID', targetField: 'Notes', value: samLink },
      ]
    case 'outreach':
      return [
        { samField: 'Award ID/PIID', targetField: 'Subject', value: `Outreach for ${record.awardIdPiid}` },
        { samField: 'Award ID/PIID', targetField: 'Notes', value: samLink },
        { samField: 'Awarding Agency', targetField: 'Notes', value: record.awardingAgencyName || '-' },
      ]
    case 'inquiry':
      return [
        { samField: 'Product/Service Code', targetField: 'Part Number', value: record.productOrServiceCodeDescription || record.awardIdPiid },
        { samField: 'NAICS Description', targetField: 'Part Description', value: record.naicsDescription || '-' },
        { samField: 'Award ID/PIID', targetField: 'Notes', value: samLink },
      ]
    case 'email':
      return [
        { samField: 'Recipient Name', targetField: 'To', value: '(enter email address)' },
        { samField: 'Awarding Agency', targetField: 'Subject', value: record.awardingAgencyName ? `Regarding ${record.awardingAgencyName}` : 'SAM Record Inquiry' },
        { samField: 'All SAM fields', targetField: 'Body', value: `${record.awardIdPiid} - ${record.recipientName}` },
      ]
  }
}

interface TransferProgress {
  total: number
  completed: number
  failed: number
  errors: string[]
}

interface TransferModalProps {
  open: boolean
  onClose: () => void
  records: SAMRecord[]
  onComplete?: () => void
}

export function TransferModal({ open, onClose, records, onComplete }: TransferModalProps) {
  const { toast } = useToast()
  const [step, setStep] = useState<'select' | 'preview' | 'confirm' | 'progress' | 'done'>('select')
  const [selectedType, setSelectedType] = useState<EntityType>('contractor')
  const [targetId, setTargetId] = useState('')
  const [emailTo, setEmailTo] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [transferring, setTransferring] = useState(false)
  const [progress, setProgress] = useState<TransferProgress>({ total: 0, completed: 0, failed: 0, errors: [] })

  const reset = () => {
    setStep('select')
    setSelectedType('contractor')
    setTargetId('')
    setEmailTo('')
    setEmailSubject('')
    setEmailBody('')
    setTransferring(false)
    setProgress({ total: 0, completed: 0, failed: 0, errors: [] })
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const needsTargetId = ['contract', 'compliance', 'contact', 'outreach', 'inquiry'].includes(selectedType)
  const mapping = buildMappingPreview(records, selectedType)

  const canProceedToPreview = () => {
    if (needsTargetId && !targetId.trim()) return false
    if (selectedType === 'email' && !emailTo.trim()) return false
    return true
  }

  const handleTransfer = async () => {
    setStep('progress')
    setTransferring(true)
    const total = records.length
    setProgress({ total, completed: 0, failed: 0, errors: [] })

    let completed = 0
    let failed = 0
    const errors: string[] = []

    for (const record of records) {
      try {
        if (selectedType === 'email') {
          await api.post(`/api/sam-data/${record.id}/send-email`, {
            to: emailTo,
            subject: emailSubject || `Regarding ${record.awardingAgencyName || record.awardIdPiid}`,
            customBody: emailBody || `SAM Record: ${record.awardIdPiid} - ${record.recipientName}`,
          })
        } else {
          const body = buildTransferBody(record, selectedType, targetId)
          await api.post(getEndpoint(selectedType), body)
        }
        completed++
      } catch (err) {
        failed++
        errors.push(`${record.awardIdPiid}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
      setProgress({ total, completed, failed, errors: [...errors] })
    }

    setTransferring(false)
    setStep('done')
    if (failed === 0) {
      toast('success', `Transferred ${completed} record${completed !== 1 ? 's' : ''} to ${getEntityLabel(selectedType)}`)
    } else {
      toast('error', `${failed} of ${total} transfers failed`)
    }
  }

  const selectedOption = TRANSFER_OPTIONS.find(o => o.type === selectedType)!

  return (
    <Modal open={open} onClose={handleClose} title={getTitle(step, selectedOption)}>
      {step === 'select' && (
        <SelectStep
          options={TRANSFER_OPTIONS}
          selected={selectedType}
          onSelect={setSelectedType}
          targetId={targetId}
          onTargetIdChange={setTargetId}
          emailTo={emailTo}
          onEmailToChange={setEmailTo}
          emailSubject={emailSubject}
          onEmailSubjectChange={setEmailSubject}
          emailBody={emailBody}
          onEmailBodyChange={setEmailBody}
          recordCount={records.length}
          onNext={() => setStep('preview')}
          onClose={handleClose}
        />
      )}

      {step === 'preview' && (
        <PreviewStep
          mapping={mapping}
          records={records}
          entityType={selectedType}
          targetId={targetId}
          onBack={() => setStep('select')}
          onConfirm={() => setStep('confirm')}
        />
      )}

      {step === 'confirm' && (
        <ConfirmStep
          records={records}
          entityType={selectedType}
          onBack={() => setStep('preview')}
          onTransfer={handleTransfer}
        />
      )}

      {step === 'progress' && (
        <ProgressStep progress={progress} entityType={selectedType} />
      )}

      {step === 'done' && (
        <DoneStep
          progress={progress}
          entityType={selectedType}
          onClose={handleClose}
          onDone={onComplete}
        />
      )}
    </Modal>
  )
}

// ─── Step Components ──────────────────────────────────────────────────────────

function SelectStep({
  options, selected, onSelect,
  targetId, onTargetIdChange,
  emailTo, onEmailToChange,
  emailSubject, onEmailSubjectChange,
  emailBody, onEmailBodyChange,
  recordCount, onNext, onClose,
}: {
  options: TransferOption[]
  selected: EntityType
  onSelect: (t: EntityType) => void
  targetId: string
  onTargetIdChange: (v: string) => void
  emailTo: string
  onEmailToChange: (v: string) => void
  emailSubject: string
  onEmailSubjectChange: (v: string) => void
  emailBody: string
  onEmailBodyChange: (v: string) => void
  recordCount: number
  onNext: () => void
  onClose: () => void
}) {
  const needsTargetId = ['contract', 'compliance', 'contact', 'outreach', 'inquiry'].includes(selected)

  return (
    <div className="space-y-4">
      <p className="text-[12px] text-[var(--text-secondary)]">
        Transfer {recordCount} SAM record{recordCount !== 1 ? 's' : ''} to:
      </p>

      <div className="grid grid-cols-2 gap-2">
        {options.map(opt => (
          <button key={opt.type} onClick={() => onSelect(opt.type)}
            className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
              selected === opt.type
                ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                : 'border-[var(--border-color)] hover:border-[var(--primary)]/50'
            }`}>
            <span className={selected === opt.type ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}>{opt.icon}</span>
            <div>
              <div className="text-[12px] font-semibold text-[var(--text-primary)]">{opt.label}</div>
              <div className="text-[10px] text-[var(--text-muted)]">{opt.description}</div>
            </div>
          </button>
        ))}
      </div>

      {needsTargetId && (
        <div>
          <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
            Contractor ID
          </label>
          <input type="text" value={targetId} onChange={e => onTargetIdChange(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[13px] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
            placeholder="Enter the contractor ID to link to" />
        </div>
      )}

      {selected === 'email' && (
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">To *</label>
            <input type="email" value={emailTo} onChange={e => onEmailToChange(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[13px] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
              placeholder="recipient@example.com" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Subject</label>
            <input type="text" value={emailSubject} onChange={e => onEmailSubjectChange(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[13px] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
              placeholder="Email subject (auto-generated if empty)" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Message</label>
            <textarea value={emailBody} onChange={e => onEmailBodyChange(e.target.value)} rows={3}
              className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[13px] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
              placeholder="Custom email body (optional)" />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onClose} className="matdash-btn matdash-btn-outline text-[12px]">Cancel</button>
        <button onClick={onNext} className="matdash-btn matdash-btn-primary text-[12px]">
          <ArrowRightLeft size={14} className="inline mr-1" /> Preview Mapping
        </button>
      </div>
    </div>
  )
}

function PreviewStep({
  mapping, records, entityType, targetId, onBack, onConfirm,
}: {
  mapping: MappingRow[]
  records: SAMRecord[]
  entityType: EntityType
  targetId: string
  onBack: () => void
  onConfirm: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="bg-[var(--content-bg)] rounded-lg p-3 border border-[var(--border-color)]">
        <h4 className="text-[12px] font-semibold text-[var(--text-primary)] mb-2">
          Data Mapping Preview
        </h4>
        <p className="text-[11px] text-[var(--text-muted)] mb-3">
          {records.length} record{records.length !== 1 ? 's' : ''} will be created as <strong>{getEntityLabel(entityType)}</strong>
          {targetId && <> linked to contractor <code className="bg-[var(--card-bg)] px-1 rounded text-[10px]">{targetId}</code></>}
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-[var(--border-color)]">
                <th className="text-left py-2 pr-4 text-[var(--text-secondary)] font-semibold">SAM Field</th>
                <th className="text-left py-2 pr-4 text-[var(--text-secondary)] font-semibold">Target Field</th>
                <th className="text-left py-2 text-[var(--text-secondary)] font-semibold">Value</th>
              </tr>
            </thead>
            <tbody>
              {mapping.map((row, i) => (
                <tr key={i} className="border-b border-[var(--border-color)]/50">
                  <td className="py-2 pr-4 text-[var(--text-muted)]">{row.samField}</td>
                  <td className="py-2 pr-4 text-[var(--text-primary)] font-medium">{row.targetField}</td>
                  <td className="py-2 text-[var(--text-primary)] truncate max-w-[200px]">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {records.length > 1 && (
        <div className="bg-[var(--content-bg)] rounded-lg p-3 border border-[var(--border-color)]">
          <h4 className="text-[12px] font-semibold text-[var(--text-primary)] mb-2">
            Records to Transfer ({records.length})
          </h4>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {records.map(r => (
              <div key={r.id} className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
                <Check size={12} className="text-[var(--primary)] shrink-0" />
                <span className="font-medium">{r.awardIdPiid}</span>
                <span className="text-[var(--text-muted)]">- {r.recipientName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onBack} className="matdash-btn matdash-btn-outline text-[12px]">Back</button>
        <button onClick={onConfirm} className="matdash-btn matdash-btn-primary text-[12px]">
          <ArrowRightLeft size={14} className="inline mr-1" /> Confirm Transfer
        </button>
      </div>
    </div>
  )
}

function ConfirmStep({
  records, entityType, onBack, onTransfer,
}: {
  records: SAMRecord[]
  entityType: EntityType
  onBack: () => void
  onTransfer: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
        <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-[12px] font-semibold text-amber-600">Confirm Transfer</p>
          <p className="text-[11px] text-[var(--text-secondary)] mt-1">
            You are about to create {records.length} {getEntityLabel(entityType).toLowerCase()}
            record{records.length !== 1 ? 's' : ''} from SAM data. This action cannot be undone.
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onBack} className="matdash-btn matdash-btn-outline text-[12px]">Back</button>
        <button onClick={onTransfer} className="matdash-btn matdash-btn-primary text-[12px]">
          <ArrowRightLeft size={14} className="inline mr-1" /> Start Transfer
        </button>
      </div>
    </div>
  )
}

function ProgressStep({ progress, entityType }: { progress: TransferProgress; entityType: EntityType }) {
  const pct = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0

  return (
    <div className="space-y-4">
      <div className="text-center">
        <Loader2 size={32} className="animate-spin text-[var(--primary)] mx-auto mb-3" />
        <p className="text-[13px] font-semibold text-[var(--text-primary)]">
          Transferring to {getEntityLabel(entityType)}...
        </p>
        <p className="text-[11px] text-[var(--text-muted)] mt-1">
          {progress.completed} of {progress.total} completed
          {progress.failed > 0 && <>, {progress.failed} failed</>}
        </p>
      </div>

      <div className="w-full bg-[var(--content-bg)] rounded-full h-2 border border-[var(--border-color)]">
        <div
          className={`h-full rounded-full transition-all duration-300 ${progress.failed > 0 ? 'bg-amber-500' : 'bg-[var(--primary)]'}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {progress.errors.length > 0 && (
        <div className="max-h-24 overflow-y-auto space-y-1">
          {progress.errors.map((err, i) => (
            <div key={i} className="text-[10px] text-[var(--danger)] bg-red-500/5 rounded px-2 py-1">{err}</div>
          ))}
        </div>
      )}
    </div>
  )
}

function DoneStep({
  progress, entityType, onClose, onDone,
}: {
  progress: TransferProgress
  entityType: EntityType
  onClose: () => void
  onDone?: () => void
}) {
  const allSuccess = progress.failed === 0

  return (
    <div className="space-y-4">
      <div className="text-center">
        {allSuccess ? (
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
            <Check size={24} className="text-green-500" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
            <AlertCircle size={24} className="text-amber-500" />
          </div>
        )}
        <p className="text-[13px] font-semibold text-[var(--text-primary)]">
          {allSuccess ? 'Transfer Complete' : 'Transfer Completed with Errors'}
        </p>
        <p className="text-[11px] text-[var(--text-muted)] mt-1">
          {progress.completed} {getEntityLabel(entityType).toLowerCase()} record{progress.completed !== 1 ? 's' : ''} created
          {progress.failed > 0 && <>, {progress.failed} failed</>}
        </p>
      </div>

      {progress.errors.length > 0 && (
        <div className="max-h-32 overflow-y-auto space-y-1">
          {progress.errors.map((err, i) => (
            <div key={i} className="text-[10px] text-[var(--danger)] bg-red-500/5 rounded px-2 py-1">{err}</div>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <button onClick={() => { onDone?.(); onClose() }}
          className="matdash-btn matdash-btn-primary text-[12px]">
          Done
        </button>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTitle(step: string, option: TransferOption): string {
  switch (step) {
    case 'select': return 'Transfer SAM Records'
    case 'preview': return `Preview: ${option.label}`
    case 'confirm': return 'Confirm Transfer'
    case 'progress': return 'Transferring...'
    case 'done': return 'Transfer Complete'
    default: return 'Transfer SAM Records'
  }
}

function getEndpoint(type: EntityType): string {
  const endpoints: Record<string, string> = {
    contractor: '/api/contractors',
    contract: '/api/contracts',
    compliance: '/api/compliance',
    contact: '/api/contacts',
    outreach: '/api/outreach',
    inquiry: '/api/inquiries',
  }
  return endpoints[type]
}

function getEntityLabel(type: EntityType): string {
  return TRANSFER_OPTIONS.find(o => o.type === type)?.label || type
}

function buildTransferBody(record: SAMRecord, entityType: EntityType, targetId: string): Record<string, unknown> {
  const samLink = `Linked from SAM Record: ${record.awardIdPiid} - ${record.recipientName}`
  const base = { notes: samLink, samDataId: record.id }

  switch (entityType) {
    case 'contractor':
      return { ...base, name: record.recipientName }
    case 'contract':
      return { ...base, title: `Contract from ${record.awardIdPiid}`, contractorId: targetId }
    case 'compliance':
      return { ...base, contractorId: targetId, type: 'SAM Record Transfer', requirement: `Compliance for ${record.awardIdPiid}` }
    case 'contact': {
      const nameParts = (record.recipientName || '').split(/\s+/)
      return {
        ...base,
        contractorId: targetId,
        firstName: nameParts[0] || record.recipientName,
        lastName: nameParts.slice(1).join(' ') || record.recipientName,
      }
    }
    case 'outreach':
      return { ...base, contractorId: targetId, subject: `Outreach for ${record.awardIdPiid}` }
    case 'inquiry':
      return { ...base, partNumber: record.productOrServiceCodeDescription || record.awardIdPiid, partDescription: record.naicsDescription || '', contractorId: targetId }
    default:
      return base
  }
}
