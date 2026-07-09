'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import { ConfirmDialog } from '@/components/ui'
import { ArrowLeft, Save, Trash2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api-client'
import { useToast } from '@/components/toast'

interface ContractorOption { id: string; name: string }
interface ContactOption { id: string; firstName: string; lastName: string }
interface OutreachData {
  id: string; contractorId: string; contactId?: string | null; subject: string; status: string; priority: string;
  interactionDate?: string | null; followUpDate?: string | null; sentDate?: string | null; inquiryId?: string | null; notes?: string | null;
}

export default function OutreachDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const id = params.id as string
  const isNew = id === 'new'

  const [contractors, setContractors] = useState<ContractorOption[]>([])
  const [contacts, setContacts] = useState<ContactOption[]>([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    contractorId: '', contactId: '', subject: '', status: 'Pending', priority: 'Medium',
    interactionDate: '', followUpDate: '', sentDate: '', inquiryId: '', notes: ''
  })

  useEffect(() => {
    api.get<{ contractors: ContractorOption[] }>('/api/contractors?limit=500')
      .then(d => setContractors(d.contractors || []))
      .catch(() => toast('error', 'Failed to load contractors'))
  }, [toast])

  useEffect(() => {
    if (form.contractorId) {
      api.get<{ contacts: ContactOption[] }>(`/api/contacts?contractorId=${form.contractorId}&limit=500`)
        .then(d => setContacts(d.contacts || []))
        .catch(() => setContacts([]))
    } else { setContacts([]) }
  }, [form.contractorId])

  useEffect(() => {
    if (!isNew) {
      api.get<OutreachData>(`/api/outreach/${id}`)
        .then(d => setForm({
          contractorId: d.contractorId || '', contactId: d.contactId || '', subject: d.subject || '',
          status: d.status || 'Pending', priority: d.priority || 'Medium',
          interactionDate: d.interactionDate ? d.interactionDate.split('T')[0] : '',
          followUpDate: d.followUpDate ? d.followUpDate.split('T')[0] : '',
          sentDate: d.sentDate ? d.sentDate.split('T')[0] : '',
          inquiryId: d.inquiryId || '', notes: d.notes || ''
        }))
        .catch(() => toast('error', 'Failed to load outreach record'))
        .finally(() => setLoading(false))
    }
  }, [id, isNew, toast])

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!form.contractorId) e.contractorId = 'Required'
    if (!form.subject.trim()) e.subject = 'Required'
    setFormErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const body = {
        contractorId: form.contractorId, contactId: form.contactId || null, subject: form.subject,
        status: form.status, priority: form.priority,
        interactionDate: form.interactionDate || null, followUpDate: form.followUpDate || null,
        sentDate: form.sentDate || null, inquiryId: form.inquiryId || null, notes: form.notes || null
      }
      if (isNew) { await api.post('/api/outreach', body); toast('success', 'Outreach record created') }
      else { await api.put(`/api/outreach/${id}`, body); toast('success', 'Outreach record updated') }
      router.push('/outreach')
    } catch (err) { toast('error', err instanceof Error ? err.message : 'Failed to save') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try { await api.delete(`/api/outreach/${id}`); toast('success', 'Outreach record deleted'); router.push('/outreach') }
    catch (err) { toast('error', err instanceof Error ? err.message : 'Failed to delete') }
    finally { setDeleting(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[var(--primary)]" size={32} /></div>

  const fieldClass = (key: string) => `w-full px-3 py-2 border rounded-lg text-[13px] bg-[var(--card-bg)] text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] ${formErrors[key] ? 'border-[var(--danger)]' : 'border-[var(--border-color)]'}`

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isNew ? 'New Outreach' : form.subject}
        subtitle={!isNew ? `${form.status} - ${form.priority}` : undefined}
        actions={
          <div className="flex gap-2 items-center">
            <Link href="/outreach" className="matdash-btn matdash-btn-outline text-[12px]"><ArrowLeft size={14} /> Back</Link>
            {!isNew && <button onClick={() => setConfirmDelete(true)} disabled={deleting} className="matdash-btn matdash-btn-danger text-[12px] disabled:opacity-50">{deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete</button>}
            <button onClick={handleSave} disabled={saving} className="matdash-btn matdash-btn-primary text-[12px] disabled:opacity-50">{saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save</button>
          </div>
        }
      />

      <div className="matdash-card max-w-2xl">
        <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-4">Outreach Details</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Contractor <span className="text-[var(--danger)]">*</span></label>
            <select value={form.contractorId} onChange={e => setForm({ ...form, contractorId: e.target.value, contactId: '' })} className={fieldClass('contractorId')}>
              <option value="">Select...</option>
              {contractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {formErrors.contractorId && <p className="text-[10px] text-[var(--danger)] mt-0.5">{formErrors.contractorId}</p>}
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Contact</label>
            <select value={form.contactId} onChange={e => setForm({ ...form, contactId: e.target.value })} className={fieldClass('contactId')} disabled={!form.contractorId}>
              <option value="">None</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Subject <span className="text-[var(--danger)]">*</span></label>
            <input type="text" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className={fieldClass('subject')} placeholder="e.g. Follow up on bid proposal" />
            {formErrors.subject && <p className="text-[10px] text-[var(--danger)] mt-0.5">{formErrors.subject}</p>}
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Status</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={fieldClass('status')}>
              <option value="Pending">Pending</option>
              <option value="Contacted">Contacted</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Priority</label>
            <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className={fieldClass('priority')}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Interaction Date</label>
            <input type="date" value={form.interactionDate} onChange={e => setForm({ ...form, interactionDate: e.target.value })} className={fieldClass('interactionDate')} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Follow-Up Date</label>
            <input type="date" value={form.followUpDate} onChange={e => setForm({ ...form, followUpDate: e.target.value })} className={fieldClass('followUpDate')} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Sent Date</label>
            <input type="date" value={form.sentDate} onChange={e => setForm({ ...form, sentDate: e.target.value })} className={fieldClass('sentDate')} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Inquiry ID</label>
            <input type="text" value={form.inquiryId} onChange={e => setForm({ ...form, inquiryId: e.target.value })} className={fieldClass('inquiryId')} placeholder="e.g. RFP-2024-001" />
          </div>
          <div className="col-span-2">
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={fieldClass('notes')} rows={4} placeholder="Additional notes..." />
          </div>
        </div>
      </div>

      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={() => { setConfirmDelete(false); handleDelete() }} title="Delete Outreach" message="Delete this outreach record? This cannot be undone." />
    </div>
  )
}
