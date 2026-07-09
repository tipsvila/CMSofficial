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
interface ContactData {
  id: string; contractorId: string; firstName: string; lastName: string;
  title?: string | null; email?: string | null; phone?: string | null; isPrimary: boolean;
  contractor?: { id: string; name: string }
}

export default function ContactDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const id = params.id as string
  const isNew = id === 'new'

  const [contractors, setContractors] = useState<ContractorOption[]>([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({ contractorId: '', firstName: '', lastName: '', title: '', email: '', phone: '', isPrimary: false })

  useEffect(() => {
    api.get<{ contractors: ContractorOption[] }>('/api/contractors?limit=500')
      .then(d => setContractors(d.contractors || []))
      .catch(() => toast('error', 'Failed to load contractors'))
  }, [toast])

  useEffect(() => {
    if (!isNew) {
      api.get<ContactData>(`/api/contacts/${id}`)
        .then(d => setForm({ contractorId: d.contractorId || '', firstName: d.firstName || '', lastName: d.lastName || '', title: d.title || '', email: d.email || '', phone: d.phone || '', isPrimary: d.isPrimary || false }))
        .catch(() => toast('error', 'Failed to load contact'))
        .finally(() => setLoading(false))
    }
  }, [id, isNew, toast])

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!form.contractorId) e.contractorId = 'Required'
    if (!form.firstName.trim()) e.firstName = 'Required'
    if (!form.lastName.trim()) e.lastName = 'Required'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email'
    setFormErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const body = { ...form, title: form.title || null, email: form.email || null, phone: form.phone || null }
      if (isNew) { await api.post('/api/contacts', body); toast('success', 'Contact created') }
      else { await api.put(`/api/contacts/${id}`, body); toast('success', 'Contact updated') }
      router.push('/contacts')
    } catch (err) { toast('error', err instanceof Error ? err.message : 'Failed to save') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try { await api.delete(`/api/contacts/${id}`); toast('success', 'Contact deleted'); router.push('/contacts') }
    catch (err) { toast('error', err instanceof Error ? err.message : 'Failed to delete') }
    finally { setDeleting(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[var(--primary)]" size={32} /></div>

  const fieldClass = (key: string) => `w-full px-3 py-2 border rounded-lg text-[13px] bg-[var(--card-bg)] text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] ${formErrors[key] ? 'border-[var(--danger)]' : 'border-[var(--border-color)]'}`

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isNew ? 'New Contact' : `${form.firstName} ${form.lastName}`}
        subtitle={!isNew ? form.title : undefined}
        actions={
          <div className="flex gap-2 items-center">
            <Link href="/contacts" className="matdash-btn matdash-btn-outline text-[12px]"><ArrowLeft size={14} /> Back</Link>
            {!isNew && <button onClick={() => setConfirmDelete(true)} disabled={deleting} className="matdash-btn matdash-btn-danger text-[12px] disabled:opacity-50">{deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete</button>}
            <button onClick={handleSave} disabled={saving} className="matdash-btn matdash-btn-primary text-[12px] disabled:opacity-50">{saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save</button>
          </div>
        }
      />

      <div className="matdash-card max-w-2xl">
        <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-4">Contact Information</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Contractor <span className="text-[var(--danger)]">*</span></label>
            <select value={form.contractorId} onChange={e => setForm({ ...form, contractorId: e.target.value })} className={fieldClass('contractorId')}>
              <option value="">Select...</option>
              {contractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {formErrors.contractorId && <p className="text-[10px] text-[var(--danger)] mt-0.5">{formErrors.contractorId}</p>}
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Title</label>
            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={fieldClass('title')} placeholder="e.g. Procurement Manager" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">First Name <span className="text-[var(--danger)]">*</span></label>
            <input type="text" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} className={fieldClass('firstName')} />
            {formErrors.firstName && <p className="text-[10px] text-[var(--danger)] mt-0.5">{formErrors.firstName}</p>}
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Last Name <span className="text-[var(--danger)]">*</span></label>
            <input type="text" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} className={fieldClass('lastName')} />
            {formErrors.lastName && <p className="text-[10px] text-[var(--danger)] mt-0.5">{formErrors.lastName}</p>}
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={fieldClass('email')} placeholder="email@example.com" />
            {formErrors.email && <p className="text-[10px] text-[var(--danger)] mt-0.5">{formErrors.email}</p>}
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Phone</label>
            <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={fieldClass('phone')} placeholder="(555) 123-4567" />
          </div>
          <div className="col-span-2">
            <label className="flex items-center gap-2 text-[12px] text-[var(--text-secondary)] cursor-pointer">
              <input type="checkbox" checked={form.isPrimary} onChange={e => setForm({ ...form, isPrimary: e.target.checked })} className="rounded border-[var(--border-color)]" />
              Primary contact for this contractor
            </label>
          </div>
        </div>
      </div>

      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={() => { setConfirmDelete(false); handleDelete() }} title="Delete Contact" message="Delete this contact? This cannot be undone." />
    </div>
  )
}
