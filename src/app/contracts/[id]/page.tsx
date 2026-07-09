'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import { ConfirmDialog, Modal } from '@/components/ui'
import { ArrowLeft, Save, Trash2, Loader2, Mail } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api-client'
import { useToast } from '@/components/toast'

interface ContractorOption { id: string; name: string }
interface ContactOption { id: string; firstName: string; lastName: string; email?: string | null }
interface EmailTemplate { id: string; name: string; description?: string | null }
interface ContractData {
  id: string; contractNumber: string; title: string; contractorId?: string | null; contactId?: string | null;
  status: string; totalAmount?: number | null; taxAmount?: number | null; shippingAmount?: number | null;
  currency?: string | null; startDate?: string | null; endDate?: string | null;
  paymentTerms?: string | null; deliveryTerms?: string | null; notes?: string | null; internalNotes?: string | null;
  contractor?: { id: string; name: string }; contact?: { id: string; firstName: string; lastName: string; email?: string | null };
}

const STATUS_OPTIONS = ['Draft', 'Pending', 'Active', 'Completed', 'Cancelled', 'Suspended']
const CURRENCY_OPTIONS = ['USD', 'EUR', 'GBP']

export default function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const isNew = id === 'new'

  const [contractors, setContractors] = useState<ContractorOption[]>([])
  const [contacts, setContacts] = useState<ContactOption[]>([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState<'details' | 'email'>('details')

  // Email templates state
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [emailForm, setEmailForm] = useState({ recipientEmail: '', recipientName: '', customMessage: '' })
  const [sendingEmail, setSendingEmail] = useState(false)

  const [form, setForm] = useState({
    contractNumber: '', title: '', contractorId: '', contactId: '', status: 'Draft',
    totalAmount: '', taxAmount: '', shippingAmount: '', currency: 'USD',
    startDate: '', endDate: '', paymentTerms: '', deliveryTerms: '', notes: '', internalNotes: '',
  })

  useEffect(() => {
    api.get<{ contractors: ContractorOption[] }>('/api/contractors?limit=500')
      .then(d => setContractors(d.contractors || []))
      .catch(() => toast('error', 'Failed to load contractors'))
  }, [toast])

  useEffect(() => {
    if (!isNew) {
      api.get<ContractData>(`/api/contracts/${id}`)
        .then(d => setForm({
          contractNumber: d.contractNumber || '', title: d.title || '', contractorId: d.contractorId || '', contactId: d.contactId || '',
          status: d.status || 'Draft', totalAmount: d.totalAmount != null ? String(d.totalAmount) : '',
          taxAmount: d.taxAmount != null ? String(d.taxAmount) : '', shippingAmount: d.shippingAmount != null ? String(d.shippingAmount) : '',
          currency: d.currency || 'USD', startDate: d.startDate ? d.startDate.split('T')[0] : '',
          endDate: d.endDate ? d.endDate.split('T')[0] : '', paymentTerms: d.paymentTerms || '',
          deliveryTerms: d.deliveryTerms || '', notes: d.notes || '', internalNotes: d.internalNotes || '',
        }))
        .catch(() => toast('error', 'Failed to load contract'))
        .finally(() => setLoading(false))
    }
  }, [id, isNew, toast])

  useEffect(() => {
    if (form.contractorId) {
      api.get<{ contacts: ContactOption[] }>(`/api/contacts?contractorId=${form.contractorId}&limit=500`)
        .then(d => setContacts(d.contacts || []))
        .catch(() => setContacts([]))
    } else {
      setContacts([])
      if (form.contactId) setForm(f => ({ ...f, contactId: '' }))
    }
  }, [form.contractorId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeTab === 'email' && templates.length === 0) {
      setTemplatesLoading(true)
      api.get<{ templates: EmailTemplate[] }>('/api/contracts/templates')
        .then(d => setTemplates(d.templates || []))
        .catch(() => toast('error', 'Failed to load email templates'))
        .finally(() => setTemplatesLoading(false))
    }
  }, [activeTab, templates.length, toast])

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!form.title.trim()) e.title = 'Required'
    setFormErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const body = {
        ...form,
        contractorId: form.contractorId || null,
        contactId: form.contactId || null,
        totalAmount: form.totalAmount ? Number(form.totalAmount) : null,
        taxAmount: form.taxAmount ? Number(form.taxAmount) : null,
        shippingAmount: form.shippingAmount ? Number(form.shippingAmount) : null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        paymentTerms: form.paymentTerms || null,
        deliveryTerms: form.deliveryTerms || null,
        notes: form.notes || null,
        internalNotes: form.internalNotes || null,
      }
      if (isNew) { await api.post('/api/contracts', body); toast('success', 'Contract created') }
      else { await api.put(`/api/contracts/${id}`, body); toast('success', 'Contract updated') }
      router.push('/contracts')
    } catch (err) { toast('error', err instanceof Error ? err.message : 'Failed to save') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try { await api.delete(`/api/contracts/${id}`); toast('success', 'Contract deleted'); router.push('/contracts') }
    catch (err) { toast('error', err instanceof Error ? err.message : 'Failed to delete') }
    finally { setDeleting(false) }
  }

  const handleSendEmail = async () => {
    if (!selectedTemplate) return
    setSendingEmail(true)
    try {
      await api.post('/api/contracts/send-email', {
        contractId: id,
        templateId: selectedTemplate.id,
        recipientEmail: emailForm.recipientEmail,
        recipientName: emailForm.recipientName,
        customMessage: emailForm.customMessage || undefined,
      })
      toast('success', 'Email sent successfully')
      setEmailModalOpen(false)
      setEmailForm({ recipientEmail: '', recipientName: '', customMessage: '' })
      setSelectedTemplate(null)
    } catch (err) { toast('error', err instanceof Error ? err.message : 'Failed to send email') }
    finally { setSendingEmail(false) }
  }

  const openEmailModal = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    const primaryContact = contacts.find(c => c.email)
    setEmailForm({
      recipientEmail: primaryContact?.email || '',
      recipientName: primaryContact ? `${primaryContact.firstName} ${primaryContact.lastName}` : '',
      customMessage: '',
    })
    setEmailModalOpen(true)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[var(--primary)]" size={32} /></div>

  const fieldClass = (key: string) => `w-full px-3 py-2 border rounded-lg text-[13px] bg-[var(--card-bg)] text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] ${formErrors[key] ? 'border-[var(--danger)]' : 'border-[var(--border-color)]'}`

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isNew ? 'New Contract' : form.title || `Contract`}
        subtitle={!isNew ? form.contractNumber || undefined : undefined}
        actions={
          <div className="flex gap-2 items-center">
            <Link href="/contracts" className="matdash-btn matdash-btn-outline text-[12px]"><ArrowLeft size={14} /> Back</Link>
            {!isNew && <button onClick={() => setConfirmDelete(true)} disabled={deleting} className="matdash-btn matdash-btn-danger text-[12px] disabled:opacity-50">{deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete</button>}
            <button onClick={handleSave} disabled={saving} className="matdash-btn matdash-btn-primary text-[12px] disabled:opacity-50">{saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save</button>
          </div>
        }
      />

      <div className="flex gap-2 mb-4">
        <button onClick={() => setActiveTab('details')}
          className={`px-4 py-2 rounded-md text-[12px] font-medium transition-colors ${activeTab === 'details' ? 'matdash-btn matdash-btn-primary' : 'matdash-btn matdash-btn-outline'}`}>
          Details
        </button>
        <button onClick={() => setActiveTab('email')}
          className={`px-4 py-2 rounded-md text-[12px] font-medium transition-colors ${activeTab === 'email' ? 'matdash-btn matdash-btn-primary' : 'matdash-btn matdash-btn-outline'}`}>
          <Mail size={14} className="inline mr-1" /> Email Templates
        </button>
      </div>

      {activeTab === 'details' && (
        <div className="matdash-card max-w-3xl">
          <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-4">Contract Information</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Title <span className="text-[var(--danger)]">*</span></label>
              <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={fieldClass('title')} placeholder="Contract title" />
              {formErrors.title && <p className="text-[10px] text-[var(--danger)] mt-0.5">{formErrors.title}</p>}
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Contractor</label>
              <select value={form.contractorId} onChange={e => setForm({ ...form, contractorId: e.target.value })} className={fieldClass('contractorId')}>
                <option value="">Select...</option>
                {contractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Contact</label>
              <select value={form.contactId} onChange={e => setForm({ ...form, contactId: e.target.value })} className={fieldClass('contactId')} disabled={!form.contractorId}>
                <option value="">Select...</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={fieldClass('status')}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Total Amount</label>
              <input type="number" step="0.01" value={form.totalAmount} onChange={e => setForm({ ...form, totalAmount: e.target.value })} className={fieldClass('totalAmount')} placeholder="0.00" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Tax Amount</label>
              <input type="number" step="0.01" value={form.taxAmount} onChange={e => setForm({ ...form, taxAmount: e.target.value })} className={fieldClass('taxAmount')} placeholder="0.00" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Shipping Amount</label>
              <input type="number" step="0.01" value={form.shippingAmount} onChange={e => setForm({ ...form, shippingAmount: e.target.value })} className={fieldClass('shippingAmount')} placeholder="0.00" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Currency</label>
              <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className={fieldClass('currency')}>
                {CURRENCY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Start Date</label>
              <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className={fieldClass('startDate')} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">End Date</label>
              <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className={fieldClass('endDate')} />
            </div>
            <div className="col-span-2">
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Payment Terms</label>
              <textarea value={form.paymentTerms} onChange={e => setForm({ ...form, paymentTerms: e.target.value })} className={fieldClass('paymentTerms')} rows={3} placeholder="Payment terms..." />
            </div>
            <div className="col-span-2">
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Delivery Terms</label>
              <textarea value={form.deliveryTerms} onChange={e => setForm({ ...form, deliveryTerms: e.target.value })} className={fieldClass('deliveryTerms')} rows={3} placeholder="Delivery terms..." />
            </div>
            <div className="col-span-2">
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Notes</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={fieldClass('notes')} rows={3} placeholder="Notes..." />
            </div>
            <div className="col-span-2">
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Internal Notes</label>
              <textarea value={form.internalNotes} onChange={e => setForm({ ...form, internalNotes: e.target.value })} className={fieldClass('internalNotes')} rows={3} placeholder="Internal notes..." />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'email' && (
        <div className="matdash-card">
          <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-4">Email Templates</h3>
          {templatesLoading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="animate-spin text-[var(--primary)]" size={24} /></div>
          ) : templates.length === 0 ? (
            <p className="text-[12px] text-[var(--text-muted)]">No email templates available.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {templates.map(template => (
                <div key={template.id} className="border border-[var(--border-color)] rounded-lg p-4 hover:border-[var(--primary)]/30 transition-colors">
                  <h4 className="text-[13px] font-bold text-[var(--text-primary)] mb-1">{template.name}</h4>
                  {template.description && <p className="text-[11px] text-[var(--text-muted)] mb-3">{template.description}</p>}
                  <button onClick={() => openEmailModal(template)}
                    className="flex items-center gap-1 matdash-btn matdash-btn-primary px-3 py-1.5 rounded-md text-[11px]">
                    <Mail size={14} /> Send
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={() => { setConfirmDelete(false); handleDelete() }} title="Delete Contract" message="Delete this contract? This cannot be undone." />

      <Modal open={emailModalOpen} onClose={() => { setEmailModalOpen(false); setSelectedTemplate(null) }} title={`Send: ${selectedTemplate?.name || ''}`}>
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Recipient Email</label>
            <input type="email" value={emailForm.recipientEmail} onChange={e => setEmailForm({ ...emailForm, recipientEmail: e.target.value })}
              className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[13px] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30" placeholder="email@example.com" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Recipient Name</label>
            <input type="text" value={emailForm.recipientName} onChange={e => setEmailForm({ ...emailForm, recipientName: e.target.value })}
              className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[13px] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30" placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Custom Message (optional)</label>
            <textarea value={emailForm.customMessage} onChange={e => setEmailForm({ ...emailForm, customMessage: e.target.value })}
              className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[13px] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30" rows={4} placeholder="Add a custom message..." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => { setEmailModalOpen(false); setSelectedTemplate(null) }} className="matdash-btn matdash-btn-outline text-[12px]">Cancel</button>
            <button onClick={handleSendEmail} disabled={sendingEmail || !emailForm.recipientEmail}
              className="matdash-btn matdash-btn-primary text-[12px] disabled:opacity-50">
              {sendingEmail ? <Loader2 size={14} className="animate-spin inline mr-1" /> : <Mail size={14} className="inline mr-1" />}
              Send
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
