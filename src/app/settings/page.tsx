'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { PageHeader } from '@/components/page-header'
import { useToast } from '@/components/toast'
import { Save, Loader2, Building2, MapPin, Phone, Shield, FileText, User, CreditCard, CheckCircle, Globe, Award, Download, AlertTriangle, Trash2, Mail, Check, X } from 'lucide-react'
import { Modal } from '@/components/ui'
import { useSettings, type SettingsData } from '@/lib/settings-context'

const inputClass = "w-full px-3 py-2 text-[13px] border border-[var(--border-color)] rounded-lg bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-colors disabled:opacity-50"
const roClass = "w-full px-3 py-2 text-[13px] border border-[var(--border-color)] rounded-lg bg-[var(--content-bg)] text-[var(--text-muted)]"

function Section({ icon: Icon, title, children }: { icon: React.ComponentType<{ size?: number; className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="matdash-card p-0 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 bg-[var(--content-bg)] border-b border-[var(--border-color)]">
        <Icon size={16} className="text-[var(--primary)]" />
        <h3 className="text-[13px] font-bold text-[var(--text-primary)]">{title}</h3>
      </div>
      <div className="p-5 space-y-3">{children}</div>
    </div>
  )
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
        {label}{required && <span className="text-[var(--danger)] ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const { toast } = useToast()
  const { settings: ctxSettings, loading: ctxLoading, refresh } = useSettings()
  const [settings, setSettings] = useState<SettingsData | null>(null)
  const [saving, setSaving] = useState(false)

  // Reset data state
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [resetStep, setResetStep] = useState<'warning' | 'sending' | 'code' | 'resetting' | 'done' | 'error'>('warning')
  const [requestId, setRequestId] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [resetError, setResetError] = useState('')
  const [resetDetails, setResetDetails] = useState<{ table: string; deleted: number }[]>([])

  // Export data state
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)

  // Initialize local state from context
  const pageLoading = ctxLoading && !settings
  const displaySettings = settings || ctxSettings

  useEffect(() => {
    if (!settings && !ctxLoading) {
      setSettings({ ...ctxSettings } as SettingsData)
    }
  }, [ctxSettings, ctxLoading, settings])

  const update = (field: keyof SettingsData, value: string | boolean | number) => setSettings(prev => prev ? { ...prev, [field]: value } : prev)

  const handleSave = async () => {
    if (!settings) return
    const backup = { ...settings }
    setSaving(true)
    try {
      const saveRes = await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) })
      if (!saveRes.ok) throw new Error('Server rejected the save')
      const saveJson = await saveRes.json()
      if (!saveJson.success) throw new Error(saveJson.error || 'Save failed')
      const res = await fetch('/api/settings')
      const json = await res.json()
      if (json.success && json.data) {
        setSettings({ ...json.data } as SettingsData)
      }
      await refresh()
      toast('success', 'Settings saved')
    } catch (err) {
      setSettings(backup)
      toast('error', err instanceof Error ? err.message : 'Failed — changes reverted')
    } finally { setSaving(false) }
  }

  if (pageLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 size={24} className="animate-spin text-[var(--primary)]" /></div>

  const handleSendCode = async () => {
    setResetStep('sending')
    setResetError('')
    try {
      const res = await fetch('/api/settings/reset', { method: 'POST' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed to send code')
      setRequestId(json.requestId)
      setResetStep('code')
      toast('success', 'Verification code sent to your email')
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Failed to send code')
      setResetStep('warning')
    }
  }

  const handleConfirmReset = async () => {
    setResetStep('resetting')
    setResetError('')
    try {
      const res = await fetch('/api/settings/reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, code: verificationCode }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Reset failed')
      setResetDetails(json.details || [])
      setResetStep('done')
      toast('success', `Reset complete — ${json.deleted} records deleted`)
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Reset failed')
      setResetStep('code')
    }
  }

  const closeResetModal = () => {
    setResetModalOpen(false)
    setResetStep('warning')
    setRequestId('')
    setVerificationCode('')
    setResetError('')
    setResetDetails([])
  }

  const handleExportAll = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/settings/export', { method: 'POST' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Export failed')
      toast('success', `Exported ${json.totalRows} records to DataBank/ folder (${json.files.length} CSV files)`)
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  const handleImportAll = async () => {
    setImporting(true)
    try {
      const res = await fetch('/api/settings/import', { method: 'POST' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Import failed')
      toast('success', `Imported ${json.totalImported} records from DataBank/ (${json.files.length} files)`)
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Company Settings"
        subtitle="Configure your company details used across the CMS"
        actions={
          <button onClick={handleSave} disabled={saving} className="matdash-btn matdash-btn-primary text-[12px] disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Changes
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Company Identity */}
        <Section icon={Building2} title="Company Identity">
          <Field label="Company Name" required><input type="text" value={displaySettings.companyName} onChange={e => update('companyName', e.target.value)} className={inputClass} placeholder="Company Name" /></Field>
          <Field label="Tagline"><input type="text" value={displaySettings.tagline} onChange={e => update('tagline', e.target.value)} className={inputClass} placeholder="Tagline" /></Field>
          <Field label="Website"><input type="text" value={displaySettings.website} onChange={e => update('website', e.target.value)} className={inputClass} placeholder="https://" /></Field>
          <Field label="Logo">
            <div className="flex items-center gap-3">
              <div className="rounded-lg border border-[var(--border-color)] overflow-hidden flex items-center justify-center shrink-0" style={{ width: displaySettings.logoSize || 64, height: displaySettings.logoSize || 64 }}>
                {displaySettings.logoUrl ? <Image src={displaySettings.logoUrl} alt="Logo" width={displaySettings.logoSize || 64} height={displaySettings.logoSize || 64} className="w-full h-full" unoptimized /> : <span className="text-[var(--text-muted)] text-xs">No logo</span>}
              </div>
              <div className="flex-1 space-y-2">
                <input type="text" value={displaySettings.logoUrl} onChange={e => update('logoUrl', e.target.value)} className={inputClass} placeholder="/logo.svg" />
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-[var(--text-muted)]">Size: {displaySettings.logoSize || 36}px</span>
                    <span className="text-[10px] text-[var(--text-muted)]">Min 24 / Max 96</span>
                  </div>
                  <input type="range" min="24" max="96" value={displaySettings.logoSize || 36} onChange={e => update('logoSize', parseInt(e.target.value))} className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-[var(--border-color)] accent-[var(--primary)]" />
                </div>
              </div>
            </div>
          </Field>
          <Field label="Favicon URL">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded border border-[var(--border-color)] overflow-hidden flex items-center justify-center shrink-0">
                {displaySettings.faviconUrl ? <Image src={displaySettings.faviconUrl} alt="Favicon" width={32} height={32} className="w-full h-full" unoptimized /> : <span className="text-[10px] text-[var(--text-muted)]">---</span>}
              </div>
              <div className="flex-1">
                <input type="text" value={displaySettings.faviconUrl} onChange={e => update('faviconUrl', e.target.value)} className={inputClass} placeholder="/favicon.ico or image URL" />
                <p className="text-[10px] text-[var(--text-muted)] mt-1">Browser tab icon. Falls back to logo if empty.</p>
              </div>
            </div>
          </Field>
          <Field label="Currency">
            <select value={displaySettings.defaultCurrency} onChange={e => update('defaultCurrency', e.target.value)} className={inputClass}>
              {['USD', 'EUR', 'GBP', 'CAD', 'PKR'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </Section>

        {/* Address */}
        <Section icon={MapPin} title="Address">
          <Field label="Street Address"><input type="text" value={displaySettings.address} onChange={e => update('address', e.target.value)} className={inputClass} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="City"><input type="text" value={displaySettings.city} onChange={e => update('city', e.target.value)} className={inputClass} /></Field>
            <Field label="State"><input type="text" value={displaySettings.state} onChange={e => update('state', e.target.value)} className={inputClass} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="ZIP"><input type="text" value={displaySettings.zipCode} onChange={e => update('zipCode', e.target.value)} className={inputClass} /></Field>
            <Field label="Country"><input type="text" value={displaySettings.country} onChange={e => update('country', e.target.value)} className={inputClass} /></Field>
          </div>
        </Section>

        {/* Contact */}
        <Section icon={Phone} title="Contact">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Primary Phone"><input type="text" value={displaySettings.phone} onChange={e => update('phone', e.target.value)} className={inputClass} /></Field>
            <Field label="Alternate Phone"><input type="text" value={displaySettings.phoneAlt} onChange={e => update('phoneAlt', e.target.value)} className={inputClass} /></Field>
          </div>
          <Field label="Email"><input type="text" value={displaySettings.email} onChange={e => update('email', e.target.value)} className={inputClass} /></Field>
        </Section>

        {/* Government IDs */}
        <Section icon={Shield} title="Government Registrations">
          <div className="grid grid-cols-2 gap-3">
            <Field label="UEI"><input type="text" value={displaySettings.uei} onChange={e => update('uei', e.target.value)} className={inputClass} /></Field>
            <Field label="CAGE Code"><input type="text" value={displaySettings.cageCode} onChange={e => update('cageCode', e.target.value)} className={inputClass} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="DUNS"><input type="text" value={displaySettings.duns} onChange={e => update('duns', e.target.value)} className={inputClass} /></Field>
            <Field label="Tax ID / NTN"><input type="text" value={displaySettings.taxId} onChange={e => update('taxId', e.target.value)} className={inputClass} /></Field>
          </div>
          <Field label="NAICS Codes"><input type="text" value={displaySettings.naicsCodes} onChange={e => update('naicsCodes', e.target.value)} className={inputClass} placeholder="Comma-separated" /></Field>
          <label className="flex items-center gap-2 text-[12px] text-[var(--text-secondary)] cursor-pointer">
            <input type="checkbox" checked={displaySettings.samRegistration} onChange={e => update('samRegistration', e.target.checked)} className="rounded border-[var(--border-color)]" />
            SAM.gov Active Registration
          </label>
          <Field label="SAM.gov Status"><input type="text" value={displaySettings.samGovStatus} onChange={e => update('samGovStatus', e.target.value)} className={inputClass} placeholder="Submitted Registration" /></Field>
          <Field label="Registration Purpose"><input type="text" value={displaySettings.registrationPurpose} onChange={e => update('registrationPurpose', e.target.value)} className={inputClass} placeholder="All Awards" /></Field>
        </Section>

        {/* Owner */}
        <Section icon={User} title="Owner / Administrator">
          <Field label="Full Name"><input type="text" value={displaySettings.ownerName} onChange={e => update('ownerName', e.target.value)} className={inputClass} placeholder="Owner Name" /></Field>
          <div className="space-y-2.5">
            {[
              { label: 'Role', value: 'Administrator' },
              { label: 'CAGE Code', value: displaySettings.cageCode || '—' },
              { label: 'UEI', value: displaySettings.uei || '—' },
              { label: 'Tax ID', value: displaySettings.taxId || '—' },
            ].map(r => (
              <div key={r.label}>
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">{r.label}</label>
                <div className={roClass}>{r.value}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Registration Status */}
        <Section icon={CheckCircle} title="Registration Status">
          <div className="space-y-2.5">
            {[
              { label: 'SAM.gov Status', value: displaySettings.samGovStatus || '—' },
              { label: 'Purpose', value: displaySettings.registrationPurpose || '—' },
              { label: 'SAM Registration', value: displaySettings.samRegistration ? 'Active' : 'Not Registered' },
            ].map(r => (
              <div key={r.label}>
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">{r.label}</label>
                <div className={roClass}>{r.value}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Capabilities */}
        <Section icon={FileText} title="Capabilities">
          <Field label="Company Description">
            <textarea value={displaySettings.capabilities} onChange={e => update('capabilities', e.target.value)} rows={3} className={`${inputClass} resize-none`} placeholder="Describe your company capabilities..." />
          </Field>
          <Field label="Core Services (JSON array)">
            <textarea value={displaySettings.coreCapabilities} onChange={e => update('coreCapabilities', e.target.value)} rows={5} className={`${inputClass} resize-none font-mono text-[11px]`} placeholder='[{"title":"Service Name","desc":"Description"}]' />
            <p className="text-[10px] text-[var(--text-muted)] mt-1">JSON array: [{"{"}title, desc{"}"}] — shows on Capabilities page</p>
          </Field>
          <Field label="Certifications">
            <input type="text" value={displaySettings.certifications} onChange={e => update('certifications', e.target.value)} className={inputClass} placeholder="FAA 8130-3, AS9120, ISO 9001" />
          </Field>
        </Section>

        {/* Capabilities */}
        <Section icon={FileText} title="Capabilities">
          <Field label="Company Description">
            <textarea value={displaySettings.capabilities} onChange={e => update('capabilities', e.target.value)} rows={3} className={`${inputClass} resize-none`} placeholder="IT-Enabled Services, Aviation Supply Chain..." />
          </Field>
          <Field label="Core Services (JSON array)">
            <textarea value={displaySettings.coreCapabilities} onChange={e => update('coreCapabilities', e.target.value)} rows={5} className={`${inputClass} resize-none font-mono text-[11px]`} placeholder='[{"title":"Service Name","desc":"Description"}]' />
            <p className="text-[10px] text-[var(--text-muted)] mt-1">JSON array: [{"{"}title, desc{"}"}] — shows on Capabilities page</p>
          </Field>
          <Field label="Certifications (comma-separated)">
            <input type="text" value={displaySettings.certifications} onChange={e => update('certifications', e.target.value)} className={inputClass} placeholder="FAA Form 8130-3, AS9120, AS9110" />
          </Field>
          <Field label="Compliance Frameworks (comma-separated)">
            <input type="text" value={displaySettings.complianceFrameworks} onChange={e => update('complianceFrameworks', e.target.value)} className={inputClass} placeholder="FAR, DFARS, CMMC, ITAR" />
          </Field>
          <Field label="NAICS Descriptions (JSON object)">
            <textarea value={displaySettings.naicsDescriptions} onChange={e => update('naicsDescriptions', e.target.value)} rows={4} className={`${inputClass} resize-none font-mono text-[11px]`} placeholder='{"423860":"Transportation Equipment..."}' />
            <p className="text-[10px] text-[var(--text-muted)] mt-1">JSON object: {"{"}code: description{"}"} — maps NAICS codes to descriptions</p>
          </Field>
          <Field label="Service Highlights (JSON array)">
            <textarea value={displaySettings.serviceHighlights} onChange={e => update('serviceHighlights', e.target.value)} rows={4} className={`${inputClass} resize-none font-mono text-[11px]`} placeholder='[["Area","Details"]]' />
            <p className="text-[10px] text-[var(--text-muted)] mt-1">{`JSON array: [["Service Area","Details description"]]`}</p>
          </Field>
          <Field label="Why Choose Us (JSON array)">
            <textarea value={displaySettings.whyChooseUs} onChange={e => update('whyChooseUs', e.target.value)} rows={4} className={`${inputClass} resize-none font-mono text-[11px]`} placeholder='["Reason 1","Reason 2"]' />
            <p className="text-[10px] text-[var(--text-muted)] mt-1">{`JSON array of bullet point strings for PDF page 3`}</p>
          </Field>
        </Section>
      </div>

      {/* Danger Zone */}
      <div className="matdash-card p-0 overflow-hidden border border-red-500/30">
        <div className="flex items-center gap-2 px-5 py-3 bg-red-500/5 border-b border-red-500/20">
          <AlertTriangle size={16} className="text-red-500" />
          <h3 className="text-[13px] font-bold text-red-600">Danger Zone</h3>
        </div>
        <div className="p-5 space-y-4">
          {/* Export All Data */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[12px] font-semibold text-[var(--text-primary)]">Export All Data</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                Export all records from SAM Data, Contracts, Contractors, Outreach, Compliance, Inquiries, RFQs, and Orders as CSV files into a <code className="bg-[var(--content-bg)] px-1 rounded text-[10px]">DataBank/</code> folder.
              </p>
            </div>
            <button onClick={handleExportAll} disabled={exporting}
              className="flex items-center gap-2 matdash-btn matdash-btn-outline px-4 py-2 rounded-md text-[12px] font-medium shrink-0 transition-colors disabled:opacity-50">
              {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Export CSV
            </button>
          </div>

          <div className="border-t border-[var(--border-color)]" />

          {/* Import All Data */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[12px] font-semibold text-[var(--text-primary)]">Import All Data</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                Import all CSV files from the <code className="bg-[var(--content-bg)] px-1 rounded text-[10px]">DataBank/</code> folder back into the database. Uses INSERT OR REPLACE — existing records are overwritten by ID.
              </p>
            </div>
            <button onClick={handleImportAll} disabled={importing}
              className="flex items-center gap-2 matdash-btn matdash-btn-outline px-4 py-2 rounded-md text-[12px] font-medium shrink-0 transition-colors disabled:opacity-50">
              {importing ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} className="rotate-180" />} Import CSV
            </button>
          </div>

          <div className="border-t border-red-500/20" />

          {/* Reset All Data */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[12px] font-semibold text-[var(--text-primary)]">Reset All Data</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                Permanently delete all records from SAM Data, Contracts, Contractors, Outreach, Compliance, Inquiries, RFQs, and Orders. Company settings and capabilities are preserved.
              </p>
            </div>
            <button onClick={() => setResetModalOpen(true)}
              className="flex items-center gap-2 matdash-btn matdash-btn-danger px-4 py-2 rounded-md text-[12px] font-medium shrink-0 transition-colors">
              <Trash2 size={14} /> Reset Data
            </button>
          </div>
        </div>
      </div>

      {/* Reset Data Modal */}
      <Modal open={resetModalOpen} onClose={closeResetModal} title={
        resetStep === 'done' ? 'Reset Complete' : 'Reset All Data'
      }>
        {/* Step: Warning */}
        {resetStep === 'warning' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[12px] font-semibold text-red-600">This action cannot be undone</p>
                <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                  All records will be permanently deleted from the following tables:
                </p>
                <ul className="text-[11px] text-[var(--text-secondary)] mt-2 space-y-0.5 list-disc list-inside">
                  <li>SAM Data</li>
                  <li>Contracts</li>
                  <li>Contractors</li>
                  <li>Outreach</li>
                  <li>Compliance</li>
                  <li>Inquiries</li>
                  <li>RFQs</li>
                  <li>Orders</li>
                </ul>
              </div>
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              A verification code will be sent to <strong>{displaySettings.email || 'your registered email'}</strong> to confirm this action.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={closeResetModal} className="matdash-btn matdash-btn-outline text-[12px]">Cancel</button>
              <button onClick={handleSendCode} className="flex items-center gap-2 matdash-btn matdash-btn-danger text-[12px]">
                <Mail size={14} /> Send Verification Code
              </button>
            </div>
          </div>
        )}

        {/* Step: Sending */}
        {resetStep === 'sending' && (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin text-[var(--primary)]" />
            <span className="ml-3 text-[12px] text-[var(--text-secondary)]">Sending verification code...</span>
          </div>
        )}

        {/* Step: Enter Code */}
        {resetStep === 'code' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <Mail size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[12px] font-semibold text-amber-600">Check your email</p>
                <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                  A 6-digit verification code was sent to <strong>{displaySettings.email}</strong>. Enter it below to confirm the reset.
                </p>
              </div>
            </div>
            {resetError && (
              <div className="bg-red-500/10 text-red-600 p-2 rounded-md text-[11px] border border-red-500/20">{resetError}</div>
            )}
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Verification Code</label>
              <input
                type="text"
                value={verificationCode}
                onChange={e => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit code"
                maxLength={6}
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[16px] font-mono text-center tracking-[4px] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-red-500/30"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={closeResetModal} className="matdash-btn matdash-btn-outline text-[12px]">Cancel</button>
              <button onClick={handleConfirmReset} disabled={verificationCode.length !== 6}
                className="flex items-center gap-2 matdash-btn matdash-btn-danger text-[12px] disabled:opacity-50">
                <Trash2 size={14} /> Verify & Reset
              </button>
            </div>
          </div>
        )}

        {/* Step: Resetting */}
        {resetStep === 'resetting' && (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin text-red-500" />
            <span className="ml-3 text-[12px] text-[var(--text-secondary)]">Resetting data...</span>
          </div>
        )}

        {/* Step: Done */}
        {resetStep === 'done' && (
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <Check size={24} className="text-green-500" />
              </div>
            </div>
            <p className="text-center text-[12px] text-[var(--text-primary)]">
              All data has been reset successfully.
            </p>
            {resetDetails.length > 0 && (
              <div className="bg-[var(--content-bg)] rounded-lg p-3 border border-[var(--border-color)]">
                <p className="text-[11px] font-semibold text-[var(--text-secondary)] mb-2">Deleted records:</p>
                <div className="space-y-1">
                  {resetDetails.map(r => (
                    <div key={r.table} className="flex justify-between text-[11px]">
                      <span className="text-[var(--text-muted)]">{r.table}</span>
                      <span className="text-[var(--text-primary)]">{r.deleted.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end pt-2">
              <button onClick={closeResetModal} className="matdash-btn matdash-btn-primary text-[12px]">Done</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
