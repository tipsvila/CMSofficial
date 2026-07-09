'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui'
import { Save, Loader2, Mail, FileSpreadsheet, ArrowRightLeft, Phone, ExternalLink } from 'lucide-react'
import { useToast } from '@/components/toast'
import { api } from '@/lib/api-client'

interface SAMData {
  id: string; awardIdPiid: string; recipientName: string; totalObligatedAmount?: number | null;
  periodOfPerformanceCurrentEndDate?: string | null; naicsDescription?: string | null;
  productOrServiceCodeDescription?: string | null; awardingAgencyName?: string | null;
  createdAt?: string | null; updatedAt?: string | null;
}

interface SAMDataDetailProps {
  data: SAMData
  onUpdate: (updated: SAMData) => void
}

export function SAMDataDetail({ data, onUpdate }: SAMDataDetailProps) {
  const { toast } = useToast()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [transferTarget, setTransferTarget] = useState('')
  const [transferEntity, setTransferEntity] = useState<'contract' | 'outreach' | 'compliance'>('contract')
  const [form, setForm] = useState({
    awardIdPiid: data.awardIdPiid || '',
    recipientName: data.recipientName || '',
    totalObligatedAmount: data.totalObligatedAmount != null ? String(data.totalObligatedAmount) : '',
    periodOfPerformanceCurrentEndDate: data.periodOfPerformanceCurrentEndDate ? data.periodOfPerformanceCurrentEndDate.split('T')[0] : '',
    naicsDescription: data.naicsDescription || '',
    productOrServiceCodeDescription: data.productOrServiceCodeDescription || '',
    awardingAgencyName: data.awardingAgencyName || '',
  })

  const fieldClass = `w-full px-3 py-2 border rounded-lg text-[13px] bg-[var(--card-bg)] text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] border-[var(--border-color)]`

  const handleSave = async () => {
    if (!form.awardIdPiid.trim() || !form.recipientName.trim()) {
      toast('error', 'Award ID and Recipient Name are required')
      return
    }
    setSaving(true)
    try {
      const body = {
        awardIdPiid: form.awardIdPiid,
        recipientName: form.recipientName,
        totalObligatedAmount: form.totalObligatedAmount ? Number(form.totalObligatedAmount) : 0,
        periodOfPerformanceCurrentEndDate: form.periodOfPerformanceCurrentEndDate || null,
        naicsDescription: form.naicsDescription || null,
        productOrServiceCodeDescription: form.productOrServiceCodeDescription || null,
        awardingAgencyName: form.awardingAgencyName || null,
      }
      await api.put(`/api/sam-data/${data.id}`, body)
      onUpdate({ ...data, ...body })
      setEditing(false)
      toast('success', 'SAM record updated')
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleExport = async () => {
    try {
      const csvRow = [
        data.awardIdPiid, data.recipientName, data.totalObligatedAmount,
        data.awardingAgencyName, data.naicsDescription, data.productOrServiceCodeDescription,
        data.periodOfPerformanceCurrentEndDate,
      ]
      const csv = ['Award ID/PIID,Recipient Name,Total Obligated Amount,Awarding Agency,NAICS Description,Product/Service Code,Period of Performance End Date',
        csvRow.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
      ].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `sam-data-${data.awardIdPiid || data.id}.csv`; a.click()
      URL.revokeObjectURL(url)
      toast('success', 'Exported SAM record to CSV')
    } catch { toast('error', 'Export failed') }
  }

  const handleTransfer = async () => {
    if (!transferTarget.trim()) {
      toast('error', 'Please select or enter a target')
      return
    }
    try {
      // Create a linked record in the target entity
      const endpoints: Record<string, string> = {
        contract: '/api/contracts',
        outreach: '/api/outreach',
        compliance: '/api/compliance',
      }
      const body: Record<string, unknown> = {
        notes: `Linked from SAM Record: ${data.awardIdPiid} - ${data.recipientName}`,
        samDataId: data.id,
      }
      if (transferEntity === 'contract') {
        body.title = `Contract from ${data.awardIdPiid}`
        body.contractorId = transferTarget
      } else if (transferEntity === 'outreach') {
        body.contractorId = transferTarget
        body.subject = `Outreach for ${data.awardIdPiid}`
      } else {
        body.contractorId = transferTarget
        body.type = 'SAM Record Transfer'
        body.requirement = `Compliance from ${data.awardIdPiid}`
      }
      await api.post(endpoints[transferEntity], body)
      toast('success', `Transferred to ${transferEntity}`)
      setTransferModalOpen(false)
      setTransferTarget('')
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Transfer failed')
    }
  }

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-'
    try { return new Date(dateStr).toLocaleDateString() }
    catch { return dateStr }
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setEditing(!editing)}
          className={`matdash-btn text-[12px] ${editing ? 'matdash-btn-outline' : 'matdash-btn-primary'}`}>
          {editing ? 'Cancel' : 'Edit'}
        </button>
        {editing && (
          <button onClick={handleSave} disabled={saving}
            className="matdash-btn matdash-btn-primary text-[12px] disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setTransferModalOpen(true)}
            className="matdash-btn matdash-btn-outline text-[12px]">
            <ArrowRightLeft size={14} /> Transfer to...
          </button>
          <button onClick={handleExport}
            className="matdash-btn matdash-btn-outline text-[12px]">
            <FileSpreadsheet size={14} /> Export
          </button>
        </div>
      </div>

      <div className="matdash-card max-w-3xl">
        <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-4">SAM Data Information</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Award ID/PIID</label>
            {editing ? (
              <input type="text" value={form.awardIdPiid} onChange={e => setForm({ ...form, awardIdPiid: e.target.value })}
                className={fieldClass} />
            ) : (
              <p className="text-[13px] text-[var(--text-primary)] py-2">{data.awardIdPiid || '-'}</p>
            )}
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Recipient Name</label>
            {editing ? (
              <input type="text" value={form.recipientName} onChange={e => setForm({ ...form, recipientName: e.target.value })}
                className={fieldClass} />
            ) : (
              <p className="text-[13px] text-[var(--text-primary)] py-2">{data.recipientName || '-'}</p>
            )}
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Total Obligated Amount</label>
            {editing ? (
              <input type="number" step="0.01" value={form.totalObligatedAmount} onChange={e => setForm({ ...form, totalObligatedAmount: e.target.value })}
                className={fieldClass} placeholder="0.00" />
            ) : (
              <p className="text-[13px] text-[var(--text-primary)] py-2">
                {data.totalObligatedAmount != null ? `$${Number(data.totalObligatedAmount).toLocaleString()}` : '-'}
              </p>
            )}
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Period of Performance End Date</label>
            {editing ? (
              <input type="date" value={form.periodOfPerformanceCurrentEndDate}
                onChange={e => setForm({ ...form, periodOfPerformanceCurrentEndDate: e.target.value })}
                className={fieldClass} />
            ) : (
              <p className="text-[13px] text-[var(--text-primary)] py-2">{formatDate(data.periodOfPerformanceCurrentEndDate)}</p>
            )}
          </div>
          <div className="col-span-2">
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">NAICS Description</label>
            {editing ? (
              <textarea value={form.naicsDescription} onChange={e => setForm({ ...form, naicsDescription: e.target.value })}
                className={fieldClass} rows={2} />
            ) : (
              <p className="text-[13px] text-[var(--text-primary)] py-2">{data.naicsDescription || '-'}</p>
            )}
          </div>
          <div className="col-span-2">
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Product or Service Code Description</label>
            {editing ? (
              <textarea value={form.productOrServiceCodeDescription}
                onChange={e => setForm({ ...form, productOrServiceCodeDescription: e.target.value })}
                className={fieldClass} rows={2} />
            ) : (
              <p className="text-[13px] text-[var(--text-primary)] py-2">{data.productOrServiceCodeDescription || '-'}</p>
            )}
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Awarding Agency</label>
            {editing ? (
              <input type="text" value={form.awardingAgencyName} onChange={e => setForm({ ...form, awardingAgencyName: e.target.value })}
                className={fieldClass} />
            ) : (
              <p className="text-[13px] text-[var(--text-primary)] py-2">{data.awardingAgencyName || '-'}</p>
            )}
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Created At</label>
            <p className="text-[13px] text-[var(--text-muted)] py-2">{formatDate(data.createdAt)}</p>
          </div>
        </div>
      </div>

      <div className="matdash-card max-w-3xl mt-4">
        <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-3">Related Data</h3>
        <div className="grid grid-cols-3 gap-4 text-[12px]">
          <div className="border border-[var(--border-color)] rounded-lg p-3">
            <h4 className="font-semibold text-[var(--text-secondary)] mb-2 flex items-center gap-1">
              <Phone size={14} /> Contacts
            </h4>
            <p className="text-[var(--text-muted)]">No contacts linked yet.</p>
            <a href={`/contacts?samDataId=${data.id}`}
              className="text-[11px] text-[var(--primary)] hover:underline mt-2 inline-flex items-center gap-1">
              <ExternalLink size={12} /> View Contacts
            </a>
          </div>
          <div className="border border-[var(--border-color)] rounded-lg p-3">
            <h4 className="font-semibold text-[var(--text-secondary)] mb-2 flex items-center gap-1">
              <Phone size={14} /> Compliance
            </h4>
            <p className="text-[var(--text-muted)]">No compliance records linked.</p>
            <a href={`/compliance?samDataId=${data.id}`}
              className="text-[11px] text-[var(--primary)] hover:underline mt-2 inline-flex items-center gap-1">
              <ExternalLink size={12} /> View Compliance
            </a>
          </div>
          <div className="border border-[var(--border-color)] rounded-lg p-3">
            <h4 className="font-semibold text-[var(--text-secondary)] mb-2 flex items-center gap-1">
              <Phone size={14} /> Outreach
            </h4>
            <p className="text-[var(--text-muted)]">No outreach records linked.</p>
            <a href={`/outreach?samDataId=${data.id}`}
              className="text-[11px] text-[var(--primary)] hover:underline mt-2 inline-flex items-center gap-1">
              <ExternalLink size={12} /> View Outreach
            </a>
          </div>
        </div>
      </div>

      <Modal open={transferModalOpen} onClose={() => setTransferModalOpen(false)} title="Transfer SAM Record">
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Transfer to entity type</label>
            <select value={transferEntity} onChange={e => setTransferEntity(e.target.value as typeof transferEntity)}
              className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[13px] bg-[var(--card-bg)] text-[var(--text-primary)]">
              <option value="contract">Contract</option>
              <option value="outreach">Outreach</option>
              <option value="compliance">Compliance</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Contractor ID</label>
            <input type="text" value={transferTarget} onChange={e => setTransferTarget(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[13px] bg-[var(--card-bg)] text-[var(--text-primary)]"
              placeholder="Enter contractor ID" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setTransferModalOpen(false)} className="matdash-btn matdash-btn-outline text-[12px]">Cancel</button>
            <button onClick={handleTransfer} className="matdash-btn matdash-btn-primary text-[12px]">
              <ArrowRightLeft size={14} className="inline mr-1" /> Transfer
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
