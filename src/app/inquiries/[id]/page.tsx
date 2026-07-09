'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import { ConfirmDialog } from '@/components/ui'
import { ArrowLeft, Save, Trash2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api-client'
import { useToast } from '@/components/toast'

interface ContractorOption { id: string; name: string }
interface InquiryData {
  id: string; inquiryId: string; partNumber: string; partDescription?: string | null;
  contractorId: string; status: string; notes?: string | null;
  contractor?: { id: string; name: string }
}

const STATUS_OPTIONS = ['Draft', 'Open', 'Quoted', 'Awarded', 'Closed'] as const

export default function InquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const id = resolvedParams.id
  const isNew = id === 'new'

  const [contractors, setContractors] = useState<ContractorOption[]>([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({ inquiryId: '', partNumber: '', partDescription: '', contractorId: '', status: 'Draft', notes: '' })

  useEffect(() => {
    api.get<{ contractors: ContractorOption[] }>('/api/contractors?limit=500')
      .then(d => setContractors(d.contractors || []))
      .catch(() => toast('error', 'Failed to load contractors'))
  }, [toast])

  useEffect(() => {
    if (!isNew) {
      api.get<InquiryData>(`/api/inquiries/${id}`)
        .then(d => setForm({ inquiryId: d.inquiryId || '', partNumber: d.partNumber || '', partDescription: d.partDescription || '', contractorId: d.contractorId || '', status: d.status || 'Draft', notes: d.notes || '' }))
        .catch(() => toast('error', 'Failed to load inquiry'))
        .finally(() => setLoading(false))
    }
  }, [id, isNew, toast])

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!form.inquiryId.trim()) e.inquiryId = 'Required'
    if (!form.partNumber.trim()) e.partNumber = 'Required'
    if (!form.contractorId) e.contractorId = 'Required'
    setFormErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const body = { ...form, partDescription: form.partDescription || null, notes: form.notes || null }
      if (isNew) { await api.post('/api/inquiries', body); toast('success', 'Inquiry created') }
      else { await api.put(`/api/inquiries/${id}`, body); toast('success', 'Inquiry updated') }
      router.push('/inquiries')
    } catch (err) { toast('error', err instanceof Error ? err.message : 'Failed to save') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try { await api.delete(`/api/inquiries/${id}`); toast('success', 'Inquiry deleted'); router.push('/inquiries') }
    catch (err) { toast('error', err instanceof Error ? err.message : 'Failed to delete') }
    finally { setDeleting(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[var(--primary)]" size={32} /></div>

  const fieldClass = (key: string) => `w-full px-3 py-2 border rounded-lg text-[13px] bg-[var(--card-bg)] text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] ${formErrors[key] ? 'border-[var(--danger)]' : 'border-[var(--border-color)]'}`

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isNew ? 'New Inquiry' : `Inquiry ${form.inquiryId}`}
        subtitle={!isNew ? form.partNumber : undefined}
        actions={
          <div className="flex gap-2 items-center">
            <Link href="/inquiries" className="matdash-btn matdash-btn-outline text-[12px]"><ArrowLeft size={14} /> Back</Link>
            {!isNew && <button onClick={() => setConfirmDelete(true)} disabled={deleting} className="matdash-btn matdash-btn-danger text-[12px] disabled:opacity-50">{deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete</button>}
            <button onClick={handleSave} disabled={saving} className="matdash-btn matdash-btn-primary text-[12px] disabled:opacity-50">{saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save</button>
          </div>
        }
      />

      <div className="matdash-card max-w-2xl">
        <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-4">Inquiry Details</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Inquiry ID <span className="text-[var(--danger)]">*</span></label>
            <input type="text" value={form.inquiryId} onChange={e => setForm({ ...form, inquiryId: e.target.value })}
              readOnly={!isNew}
              className={`${fieldClass('inquiryId')} ${!isNew ? 'opacity-60 cursor-not-allowed' : ''}`} placeholder="e.g. INQ-2024-001" />
            {formErrors.inquiryId && <p className="text-[10px] text-[var(--danger)] mt-0.5">{formErrors.inquiryId}</p>}
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Part Number <span className="text-[var(--danger)]">*</span></label>
            <input type="text" value={form.partNumber} onChange={e => setForm({ ...form, partNumber: e.target.value })} className={fieldClass('partNumber')} />
            {formErrors.partNumber && <p className="text-[10px] text-[var(--danger)] mt-0.5">{formErrors.partNumber}</p>}
          </div>
          <div className="col-span-2">
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Part Description</label>
            <input type="text" value={form.partDescription} onChange={e => setForm({ ...form, partDescription: e.target.value })} className={fieldClass('partDescription')} placeholder="Description of the part" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Contractor <span className="text-[var(--danger)]">*</span></label>
            <select value={form.contractorId} onChange={e => setForm({ ...form, contractorId: e.target.value })} className={fieldClass('contractorId')}>
              <option value="">Select...</option>
              {contractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {formErrors.contractorId && <p className="text-[10px] text-[var(--danger)] mt-0.5">{formErrors.contractorId}</p>}
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Status</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={fieldClass('status')}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={4} className={fieldClass('notes')} placeholder="Additional notes..." />
          </div>
        </div>
      </div>

      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={() => { setConfirmDelete(false); handleDelete() }} title="Delete Inquiry" message="Delete this inquiry? This cannot be undone." />
    </div>
  )
}
