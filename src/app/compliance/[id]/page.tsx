'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import { ConfirmDialog } from '@/components/ui'
import { ArrowLeft, Save, Trash2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api-client'
import { useToast } from '@/components/toast'

interface ContractorOption { id: string; name: string }
interface ComplianceData {
  id: string; contractorId: string; type: string; status: string; requirement: string;
  documentation?: string | null; expiryDate?: string | null; lastAuditDate?: string | null;
  nextAuditDate?: string | null; riskLevel?: string | null; priority?: number | null;
  scope?: string | null; notes?: string | null; isActive: boolean;
  contractor?: { id: string; name: string }
}

export default function ComplianceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { toast } = useToast()
  const [id, setId] = useState<string>('')
  const [contractors, setContractors] = useState<ContractorOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    contractorId: '', type: 'License', status: 'Pending', requirement: '',
    documentation: '', expiryDate: '', lastAuditDate: '', nextAuditDate: '',
    riskLevel: 'Low', priority: 1, scope: 'Contract', notes: ''
  })

  useEffect(() => {
    params.then(p => setId(p.id))
  }, [params])

  const isNew = id === 'new'

  useEffect(() => {
    api.get<{ contractors: ContractorOption[] }>('/api/contractors?limit=500')
      .then(d => setContractors(d.contractors || []))
      .catch(() => toast('error', 'Failed to load contractors'))
  }, [toast])

  useEffect(() => {
    if (!isNew && id) {
      api.get<ComplianceData>(`/api/compliance/${id}`)
        .then(d => setForm({
          contractorId: d.contractorId || '', type: d.type || 'License', status: d.status || 'Pending',
          requirement: d.requirement || '', documentation: d.documentation || '',
          expiryDate: d.expiryDate ? d.expiryDate.split('T')[0] : '',
          lastAuditDate: d.lastAuditDate ? d.lastAuditDate.split('T')[0] : '',
          nextAuditDate: d.nextAuditDate ? d.nextAuditDate.split('T')[0] : '',
          riskLevel: d.riskLevel || 'Low', priority: d.priority || 1,
          scope: d.scope || 'Contract', notes: d.notes || ''
        }))
        .catch(() => toast('error', 'Failed to load compliance record'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [id, isNew, toast])

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!form.contractorId) e.contractorId = 'Required'
    if (!form.requirement.trim()) e.requirement = 'Required'
    setFormErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const body = {
        contractorId: form.contractorId, type: form.type, status: form.status,
        requirement: form.requirement, documentation: form.documentation || null,
        expiryDate: form.expiryDate || null, lastAuditDate: form.lastAuditDate || null,
        nextAuditDate: form.nextAuditDate || null, riskLevel: form.riskLevel,
        priority: form.priority, scope: form.scope, notes: form.notes || null
      }
      if (isNew) { await api.post('/api/compliance', body); toast('success', 'Compliance record created') }
      else { await api.put(`/api/compliance/${id}`, body); toast('success', 'Compliance record updated') }
      router.push('/compliance')
    } catch (err) { toast('error', err instanceof Error ? err.message : 'Failed to save') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try { await api.delete(`/api/compliance/${id}`); toast('success', 'Compliance record deleted'); router.push('/compliance') }
    catch (err) { toast('error', err instanceof Error ? err.message : 'Failed to delete') }
    finally { setDeleting(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[var(--primary)]" size={32} /></div>

  const fieldClass = (key: string) => `w-full px-3 py-2 border rounded-lg text-[13px] bg-[var(--card-bg)] text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] ${formErrors[key] ? 'border-[var(--danger)]' : 'border-[var(--border-color)]'}`

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isNew ? 'New Compliance Record' : form.requirement}
        subtitle={!isNew ? `${form.type} - ${form.status}` : undefined}
        actions={
          <div className="flex gap-2 items-center">
            <Link href="/compliance" className="matdash-btn matdash-btn-outline text-[12px]"><ArrowLeft size={14} /> Back</Link>
            {!isNew && <button onClick={() => setConfirmDelete(true)} disabled={deleting} className="matdash-btn matdash-btn-danger text-[12px] disabled:opacity-50">{deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete</button>}
            <button onClick={handleSave} disabled={saving} className="matdash-btn matdash-btn-primary text-[12px] disabled:opacity-50">{saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save</button>
          </div>
        }
      />

      <div className="matdash-card max-w-2xl">
        <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-4">Compliance Information</h3>
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
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Type <span className="text-[var(--danger)]">*</span></label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className={fieldClass('type')}>
              <option value="License">License</option>
              <option value="Certification">Certification</option>
              <option value="Insurance">Insurance</option>
              <option value="Training">Training</option>
              <option value="Audit">Audit</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Status</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={fieldClass('status')}>
              <option value="Pending">Pending</option>
              <option value="Active">Active</option>
              <option value="Expired">Expired</option>
              <option value="Non-Compliant">Non-Compliant</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Risk Level</label>
            <select value={form.riskLevel} onChange={e => setForm({ ...form, riskLevel: e.target.value })} className={fieldClass('riskLevel')}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Requirement <span className="text-[var(--danger)]">*</span></label>
            <input type="text" value={form.requirement} onChange={e => setForm({ ...form, requirement: e.target.value })} className={fieldClass('requirement')} placeholder="Compliance requirement description" />
            {formErrors.requirement && <p className="text-[10px] text-[var(--danger)] mt-0.5">{formErrors.requirement}</p>}
          </div>
          <div className="col-span-2">
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Documentation</label>
            <input type="text" value={form.documentation} onChange={e => setForm({ ...form, documentation: e.target.value })} className={fieldClass('documentation')} placeholder="Reference document or URL" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Expiry Date</label>
            <input type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} className={fieldClass('expiryDate')} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Last Audit Date</label>
            <input type="date" value={form.lastAuditDate} onChange={e => setForm({ ...form, lastAuditDate: e.target.value })} className={fieldClass('lastAuditDate')} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Next Audit Date</label>
            <input type="date" value={form.nextAuditDate} onChange={e => setForm({ ...form, nextAuditDate: e.target.value })} className={fieldClass('nextAuditDate')} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Priority</label>
            <input type="number" value={form.priority} onChange={e => setForm({ ...form, priority: parseInt(e.target.value) || 1 })} className={fieldClass('priority')} min="1" max="10" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Scope</label>
            <select value={form.scope} onChange={e => setForm({ ...form, scope: e.target.value })} className={fieldClass('scope')}>
              <option value="Contract">Contract</option>
              <option value="Company">Company</option>
              <option value="Program">Program</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={`${fieldClass('notes')} min-h-[80px]`} placeholder="Additional notes..." />
          </div>
        </div>
      </div>

      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={() => { setConfirmDelete(false); handleDelete() }} title="Delete Compliance Record" message="Delete this compliance record? This cannot be undone." />
    </div>
  )
}
