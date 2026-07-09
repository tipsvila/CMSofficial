'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import { ConfirmDialog } from '@/components/ui'
import { ArrowLeft, Save, Trash2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api-client'
import { useToast } from '@/components/toast'

export default function ContractorDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const id = params.id as string
  const isNew = id === 'new'

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    name: '', uei: '', duns: '', address: '', city: '', state: '',
    zipCode: '', phone: '', email1: '', email2: '', email3: '',
    website: '', contractingTier: '', notes: ''
  })

  useEffect(() => {
    if (!isNew) {
      api.get<{ name?: string; uei?: string; duns?: string; address?: string; city?: string; state?: string; zipCode?: string; phone?: string; email1?: string; email2?: string; email3?: string; website?: string; contractingTier?: string; notes?: string }>(`/api/contractors/${id}`)
        .then(d => setForm({
          name: d.name || '', uei: d.uei || '', duns: d.duns || '', address: d.address || '',
          city: d.city || '', state: d.state || '', zipCode: d.zipCode || '', phone: d.phone || '',
          email1: d.email1 || '', email2: d.email2 || '', email3: d.email3 || '',
          website: d.website || '', contractingTier: d.contractingTier || '', notes: d.notes || ''
        }))
        .catch(() => toast('error', 'Failed to load contractor'))
        .finally(() => setLoading(false))
    }
  }, [id, isNew, toast])

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Required'
    if (form.email1 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email1)) e.email1 = 'Invalid email'
    setFormErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const body = { ...form, uei: form.uei || null, duns: form.duns || null, address: form.address || null, city: form.city || null, state: form.state || null, zipCode: form.zipCode || null, phone: form.phone || null, email1: form.email1 || null, email2: form.email2 || null, email3: form.email3 || null, website: form.website || null, contractingTier: form.contractingTier || null, notes: form.notes || null }
      if (isNew) { await api.post('/api/contractors', body); toast('success', 'Contractor created') }
      else { await api.put(`/api/contractors/${id}`, body); toast('success', 'Contractor updated') }
      router.push('/contractors')
    } catch (err) { toast('error', err instanceof Error ? err.message : 'Failed to save') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try { await api.delete(`/api/contractors/${id}`); toast('success', 'Contractor deleted'); router.push('/contractors') }
    catch (err) { toast('error', err instanceof Error ? err.message : 'Failed to delete') }
    finally { setDeleting(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[var(--primary)]" size={32} /></div>

  const fieldClass = (key: string) => `w-full px-3 py-2 border rounded-lg text-[13px] bg-[var(--card-bg)] text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] ${formErrors[key] ? 'border-[var(--danger)]' : 'border-[var(--border-color)]'}`

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isNew ? 'New Contractor' : form.name}
        subtitle={form.contractingTier || undefined}
        actions={
          <div className="flex gap-2 items-center">
            <Link href="/contractors" className="matdash-btn matdash-btn-outline text-[12px]"><ArrowLeft size={14} /> Back</Link>
            {!isNew && <button onClick={() => setConfirmDelete(true)} disabled={deleting} className="matdash-btn matdash-btn-danger text-[12px] disabled:opacity-50">{deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete</button>}
            <button onClick={handleSave} disabled={saving} className="matdash-btn matdash-btn-primary text-[12px] disabled:opacity-50">{saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save</button>
          </div>
        }
      />

      <div className="matdash-card max-w-2xl">
        <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-4">Contractor Information</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Name <span className="text-[var(--danger)]">*</span></label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={fieldClass('name')} />
            {formErrors.name && <p className="text-[10px] text-[var(--danger)] mt-0.5">{formErrors.name}</p>}
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">UEI</label>
            <input type="text" value={form.uei} onChange={e => setForm({ ...form, uei: e.target.value })} className={fieldClass('uei')} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">DUNS</label>
            <input type="text" value={form.duns} onChange={e => setForm({ ...form, duns: e.target.value })} className={fieldClass('duns')} />
          </div>
          <div className="col-span-2">
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Address</label>
            <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className={fieldClass('address')} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">City</label>
            <input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className={fieldClass('city')} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">State</label>
            <input type="text" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} className={fieldClass('state')} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Zip Code</label>
            <input type="text" value={form.zipCode} onChange={e => setForm({ ...form, zipCode: e.target.value })} className={fieldClass('zipCode')} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Phone</label>
            <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={fieldClass('phone')} placeholder="(555) 123-4567" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Email 1</label>
            <input type="email" value={form.email1} onChange={e => setForm({ ...form, email1: e.target.value })} className={fieldClass('email1')} placeholder="email@example.com" />
            {formErrors.email1 && <p className="text-[10px] text-[var(--danger)] mt-0.5">{formErrors.email1}</p>}
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Email 2</label>
            <input type="email" value={form.email2} onChange={e => setForm({ ...form, email2: e.target.value })} className={fieldClass('email2')} placeholder="email@example.com" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Email 3</label>
            <input type="email" value={form.email3} onChange={e => setForm({ ...form, email3: e.target.value })} className={fieldClass('email3')} placeholder="email@example.com" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Website</label>
            <input type="url" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} className={fieldClass('website')} placeholder="https://example.com" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Contracting Tier</label>
            <select value={form.contractingTier} onChange={e => setForm({ ...form, contractingTier: e.target.value })} className={fieldClass('contractingTier')}>
              <option value="">Select...</option>
              <option value="Free">Free</option>
              <option value="Basic">Basic</option>
              <option value="Premium">Premium</option>
              <option value="Enterprise">Enterprise</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={fieldClass('notes')} rows={3} />
          </div>
        </div>
      </div>

      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={() => { setConfirmDelete(false); handleDelete() }} title="Delete Contractor" message="Delete this contractor? This cannot be undone." />
    </div>
  )
}
