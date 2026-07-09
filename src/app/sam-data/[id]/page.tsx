'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import { ConfirmDialog } from '@/components/ui'
import { ArrowLeft, Save, Trash2, Loader2, Mail, FileText, History } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api-client'
import { useToast } from '@/components/toast'
import { EmailCompose } from '@/components/email-compose'
import { SAMDataDetail } from '@/components/sam-data/sam-data-detail'

interface SAMData {
  id: string; awardIdPiid: string; recipientName: string; totalObligatedAmount?: number | null;
  periodOfPerformanceCurrentEndDate?: string | null; naicsDescription?: string | null;
  productOrServiceCodeDescription?: string | null; awardingAgencyName?: string | null;
  createdAt?: string | null; updatedAt?: string | null;
}

interface Draft {
  id: string; to: string; cc?: string; bcc?: string; subject: string; body: string;
  template?: string; createdAt: string; updatedAt: string;
}

const EMAIL_TEMPLATES = [
  { value: 'capability_statement', label: 'Capability Statement' },
  { value: 'follow_up', label: 'Follow-Up' },
  { value: 'capability_follow_up', label: 'Capability Follow-Up' },
]

interface EmailLog {
  id: string; entity_type: string; entity_id: string; recipient: string;
  subject: string; template: string; sent_at: string; created_at: string;
}

export default function SAMDataDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const isNew = id === 'new'

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'email' | 'drafts' | 'history'>('details')
  const [samData, setSamData] = useState<SAMData | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // New record form
  const [form, setForm] = useState({
    awardIdPiid: '', recipientName: '', totalObligatedAmount: '',
    periodOfPerformanceCurrentEndDate: '', naicsDescription: '',
    productOrServiceCodeDescription: '', awardingAgencyName: '',
  })

  // Email state
  const [sendingEmail, setSendingEmail] = useState(false)

  // Drafts state
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [draftsLoading, setDraftsLoading] = useState(false)
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null)
  const [savingDraft, setSavingDraft] = useState(false)

  // Email history state
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([])
  const [emailLogsLoading, setEmailLogsLoading] = useState(false)

  useEffect(() => {
    if (!isNew) {
      api.get<SAMData>(`/api/sam-data/${id}`)
        .then(d => setSamData(d))
        .catch(() => toast('error', 'Failed to load SAM record'))
        .finally(() => setLoading(false))
    }
  }, [id, isNew, toast])

  // Load drafts when tab switches to drafts
  useEffect(() => {
    if (activeTab === 'drafts' && !isNew) {
      setDraftsLoading(true)
      fetch(`/api/sam-data/${id}/drafts`)
        .then(r => r.json())
        .then(d => setDrafts(d.drafts || []))
        .catch(() => setDrafts([]))
        .finally(() => setDraftsLoading(false))
    }
  }, [activeTab, id, isNew])

  // Load email logs when tab switches to history
  useEffect(() => {
    if (activeTab === 'history' && !isNew) {
      setEmailLogsLoading(true)
      fetch('/api/email/logs?limit=50')
        .then(r => r.json())
        .then(d => setEmailLogs(d.logs || []))
        .catch(() => setEmailLogs([]))
        .finally(() => setEmailLogsLoading(false))
    }
  }, [activeTab, isNew])

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!form.awardIdPiid.trim()) e.awardIdPiid = 'Required'
    if (!form.recipientName.trim()) e.recipientName = 'Required'
    setFormErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
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
      await api.post('/api/sam-data', body)
      toast('success', 'SAM record created')
      router.push('/sam-data')
    } catch (err) { toast('error', err instanceof Error ? err.message : 'Failed to save') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try { await api.delete(`/api/sam-data/${id}`); toast('success', 'SAM record deleted'); router.push('/sam-data') }
    catch (err) { toast('error', err instanceof Error ? err.message : 'Failed to delete') }
    finally { setDeleting(false) }
  }

  const handleSendEmail = async (emailData: { to: string; cc: string; bcc: string; subject: string; body: string; template: string }) => {
    setSendingEmail(true)
    try {
      await api.post(`/api/sam-data/${id}/send-email`, {
        to: emailData.to, cc: emailData.cc || undefined, bcc: emailData.bcc || undefined,
        subject: emailData.subject, template: emailData.template || undefined, customBody: emailData.body || undefined,
      })
      toast('success', 'Email sent successfully')
    } catch (err) { toast('error', err instanceof Error ? err.message : 'Failed to send email') }
    finally { setSendingEmail(false) }
  }

  const handleSaveDraft = async (draftData: { to: string; cc: string; bcc: string; subject: string; body: string; template: string }) => {
    setSavingDraft(true)
    try {
      await fetch(`/api/sam-data/${id}/drafts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...draftData, draftId: selectedDraft?.id }),
      })
      toast('success', selectedDraft ? 'Draft updated' : 'Draft saved')
      setSelectedDraft(null)
      // Refresh drafts list
      const r = await fetch(`/api/sam-data/${id}/drafts`)
      const d = await r.json()
      setDrafts(d.drafts || [])
    } catch (err) { toast('error', err instanceof Error ? err.message : 'Failed to save draft') }
    finally { setSavingDraft(false) }
  }

  const handleDeleteDraft = async (draftId: string) => {
    try {
      await fetch(`/api/sam-data/${id}/drafts?draftId=${draftId}`, { method: 'DELETE' })
      toast('success', 'Draft deleted')
      setDrafts(drafts.filter(d => d.id !== draftId))
      if (selectedDraft?.id === draftId) setSelectedDraft(null)
    } catch { toast('error', 'Failed to delete draft') }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[var(--primary)]" size={32} /></div>

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isNew ? 'New SAM Record' : samData?.awardIdPiid || 'SAM Record'}
        subtitle={!isNew ? samData?.recipientName : undefined}
        actions={
          <div className="flex gap-2 items-center">
            <Link href="/sam-data" className="matdash-btn matdash-btn-outline text-[12px]"><ArrowLeft size={14} /> Back</Link>
            {!isNew && <button onClick={() => setConfirmDelete(true)} disabled={deleting} className="matdash-btn matdash-btn-danger text-[12px] disabled:opacity-50">{deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete</button>}
            <button onClick={handleSave} disabled={saving} className="matdash-btn matdash-btn-primary text-[12px] disabled:opacity-50">{saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save</button>
          </div>
        }
      />

      {/* Tabs */}
      {!isNew && (
        <div className="flex gap-2 mb-4">
          <button onClick={() => setActiveTab('details')}
            className={`px-4 py-2 rounded-md text-[12px] font-medium transition-colors ${activeTab === 'details' ? 'matdash-btn matdash-btn-primary' : 'matdash-btn matdash-btn-outline'}`}>
            <FileText size={14} className="inline mr-1" /> Details
          </button>
          <button onClick={() => setActiveTab('email')}
            className={`px-4 py-2 rounded-md text-[12px] font-medium transition-colors ${activeTab === 'email' ? 'matdash-btn matdash-btn-primary' : 'matdash-btn matdash-btn-outline'}`}>
            <Mail size={14} className="inline mr-1" /> Email
          </button>
          <button onClick={() => setActiveTab('drafts')}
            className={`px-4 py-2 rounded-md text-[12px] font-medium transition-colors ${activeTab === 'drafts' ? 'matdash-btn matdash-btn-primary' : 'matdash-btn matdash-btn-outline'}`}>
            Drafts {drafts.length > 0 && <span className="ml-1 bg-[var(--primary)]/20 text-[var(--primary)] px-1.5 rounded-full text-[10px]">{drafts.length}</span>}
          </button>
          <button onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-md text-[12px] font-medium transition-colors ${activeTab === 'history' ? 'matdash-btn matdash-btn-primary' : 'matdash-btn matdash-btn-outline'}`}>
            <History size={14} className="inline mr-1" /> History
          </button>
        </div>
      )}

      {/* New Record Form */}
      {isNew && (
        <div className="matdash-card max-w-3xl">
          <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-4">SAM Data Information</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Award ID/PIID <span className="text-[var(--danger)]">*</span></label>
              <input type="text" value={form.awardIdPiid} onChange={e => setForm({ ...form, awardIdPiid: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg text-[13px] bg-[var(--card-bg)] text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] ${formErrors.awardIdPiid ? 'border-[var(--danger)]' : 'border-[var(--border-color)]'}`}
                placeholder="e.g. W911KB18C0026" />
              {formErrors.awardIdPiid && <p className="text-[10px] text-[var(--danger)] mt-0.5">{formErrors.awardIdPiid}</p>}
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Recipient Name <span className="text-[var(--danger)]">*</span></label>
              <input type="text" value={form.recipientName} onChange={e => setForm({ ...form, recipientName: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg text-[13px] bg-[var(--card-bg)] text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] ${formErrors.recipientName ? 'border-[var(--danger)]' : 'border-[var(--border-color)]'}`}
                placeholder="Company name" />
              {formErrors.recipientName && <p className="text-[10px] text-[var(--danger)] mt-0.5">{formErrors.recipientName}</p>}
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Total Obligated Amount</label>
              <input type="number" step="0.01" value={form.totalObligatedAmount} onChange={e => setForm({ ...form, totalObligatedAmount: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[13px] bg-[var(--card-bg)] text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                placeholder="0.00" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Period of Performance End Date</label>
              <input type="date" value={form.periodOfPerformanceCurrentEndDate}
                onChange={e => setForm({ ...form, periodOfPerformanceCurrentEndDate: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[13px] bg-[var(--card-bg)] text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30" />
            </div>
            <div className="col-span-2">
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">NAICS Description</label>
              <textarea value={form.naicsDescription} onChange={e => setForm({ ...form, naicsDescription: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[13px] bg-[var(--card-bg)] text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                rows={2} placeholder="NAICS description..." />
            </div>
            <div className="col-span-2">
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Product or Service Code Description</label>
              <textarea value={form.productOrServiceCodeDescription}
                onChange={e => setForm({ ...form, productOrServiceCodeDescription: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[13px] bg-[var(--card-bg)] text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                rows={2} placeholder="PSC description..." />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Awarding Agency</label>
              <input type="text" value={form.awardingAgencyName} onChange={e => setForm({ ...form, awardingAgencyName: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[13px] bg-[var(--card-bg)] text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                placeholder="e.g. Department of Defense" />
            </div>
          </div>
        </div>
      )}

      {/* Details Tab */}
      {activeTab === 'details' && samData && (
        <SAMDataDetail data={samData} onUpdate={(updated) => setSamData(updated)} />
      )}

      {/* Email Tab */}
      {activeTab === 'email' && (
        <div className="max-w-3xl">
          <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-3">Send Email</h3>
          <EmailCompose
            templates={EMAIL_TEMPLATES}
            onSend={handleSendEmail}
            onSaveDraft={handleSaveDraft}
            sending={sendingEmail}
            saving={savingDraft}
            defaultTo=""
            defaultSubject={`Re: ${samData?.awardIdPiid || ''} — ${samData?.recipientName || ''}`}
          />
        </div>
      )}

      {/* Drafts Tab */}
      {activeTab === 'drafts' && (
        <div className="flex gap-4">
          {/* Draft list */}
          <div className="w-72 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-bold text-[var(--text-primary)]">Drafts</h3>
              <button onClick={() => { setSelectedDraft(null); setActiveTab('email') }}
                className="text-[11px] text-[var(--primary)] hover:underline">+ New</button>
            </div>
            {draftsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[var(--primary)]" size={20} /></div>
            ) : drafts.length === 0 ? (
              <p className="text-[12px] text-[var(--text-muted)] py-4">No drafts yet.</p>
            ) : (
              <div className="space-y-1.5">
                {drafts.map(d => (
                  <div key={d.id} onClick={() => setSelectedDraft(d)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedDraft?.id === d.id ? 'border-[var(--primary)] bg-[var(--primary-light)]' : 'border-[var(--border-color)] hover:border-[var(--primary)]/30'
                    }`}>
                    <p className="text-[12px] font-medium text-[var(--text-primary)] truncate">{d.subject}</p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">To: {d.to || '—'}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{new Date(d.updatedAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Draft preview / compose */}
          <div className="flex-1 min-w-0">
            {selectedDraft ? (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-[13px] font-bold text-[var(--text-primary)] flex-1 truncate">{selectedDraft.subject}</h3>
                  <button onClick={() => handleDeleteDraft(selectedDraft.id)} className="matdash-btn matdash-btn-danger text-[11px] px-2 py-1">Delete</button>
                  <button onClick={() => setSelectedDraft(null)} className="matdash-btn matdash-btn-outline text-[11px] px-2 py-1">Close</button>
                </div>
                <div className="matdash-card space-y-2 text-[12px]">
                  <div><span className="font-semibold text-[var(--text-secondary)]">To:</span> <span className="text-[var(--text-primary)]">{selectedDraft.to}</span></div>
                  {selectedDraft.cc && <div><span className="font-semibold text-[var(--text-secondary)]">Cc:</span> <span className="text-[var(--text-primary)]">{selectedDraft.cc}</span></div>}
                  {selectedDraft.template && <div><span className="font-semibold text-[var(--text-secondary)]">Template:</span> <span className="text-[var(--text-primary)]">{selectedDraft.template}</span></div>}
                  <div className="border-t border-[var(--border-color)] pt-2 mt-2 whitespace-pre-wrap text-[var(--text-primary)]">{selectedDraft.body}</div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => {
                    setActiveTab('email')
                    // Pre-populate email compose with draft data
                  }} className="matdash-btn matdash-btn-primary text-[12px]"><Mail size={14} className="inline mr-1" /> Send</button>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-3">New Draft</h3>
                <EmailCompose
                  templates={EMAIL_TEMPLATES}
                  onSend={handleSendEmail}
                  onSaveDraft={handleSaveDraft}
                  sending={sendingEmail}
                  saving={savingDraft}
                  defaultSubject={`Re: ${samData?.awardIdPiid || ''} — ${samData?.recipientName || ''}`}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="matdash-card max-w-4xl">
          <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-4"><History size={14} className="inline mr-1" /> Email History</h3>
          {emailLogsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[var(--primary)]" size={20} /></div>
          ) : emailLogs.length === 0 ? (
            <p className="text-[12px] text-[var(--text-muted)] py-4">No emails sent yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th className="text-left py-2 px-3 font-semibold text-[var(--text-secondary)]">Recipient</th>
                    <th className="text-left py-2 px-3 font-semibold text-[var(--text-secondary)]">Subject</th>
                    <th className="text-left py-2 px-3 font-semibold text-[var(--text-secondary)]">Template</th>
                    <th className="text-left py-2 px-3 font-semibold text-[var(--text-secondary)]">Sent At</th>
                  </tr>
                </thead>
                <tbody>
                  {emailLogs.map(log => (
                    <tr key={log.id} className="border-b border-[var(--border-color)]/50 hover:bg-[var(--hover-bg)]">
                      <td className="py-2 px-3 text-[var(--text-primary)]">{log.recipient}</td>
                      <td className="py-2 px-3 text-[var(--text-primary)] truncate max-w-[200px]">{log.subject}</td>
                      <td className="py-2 px-3"><span className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--primary-light)] text-[var(--primary)]">{log.template || 'custom'}</span></td>
                      <td className="py-2 px-3 text-[var(--text-muted)]">{new Date(log.sent_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={() => { setConfirmDelete(false); handleDelete() }} title="Delete SAM Record" message="Delete this SAM record? This cannot be undone." />
    </div>
  )
}
