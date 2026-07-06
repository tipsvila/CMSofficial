'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { PageHeader } from '@/components/page-header'
import { useToast } from '@/components/toast'
import { Save, Loader2, Building2, MapPin, Phone, Shield, FileText, User, CreditCard, CheckCircle, Globe, Award, Download } from 'lucide-react'
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
              { label: 'Role', value: 'Administrator — Entity Registration & Reporting' },
              { label: 'Entity Type', value: 'Sole Proprietorship' },
              { label: 'Employees', value: '1' },
              { label: 'CAGE Established', value: 'May 7, 2026' },
              { label: 'CAGE Last Updated', value: 'May 21, 2026' },
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
              { label: 'SAM.gov Status', value: 'Submitted Registration' },
              { label: 'Purpose', value: 'All Awards' },
              { label: 'FSD Case', value: 'CS2439900' },
              { label: 'Incident', value: 'INC-GSAFSD21112377' },
              { label: 'FSD Support', value: '866-606-8220' },
              { label: 'DLA Contact', value: 'dlacontactcenter@dla.mil' },
              { label: 'W-8BEN-E', value: 'Required for Non-US Tax Exemption' },
            ].map(r => (
              <div key={r.label}>
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">{r.label}</label>
                <div className={roClass}>{r.value}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Banking */}
        <Section icon={CreditCard} title="Banking">
          <div className="space-y-2.5">
            {[
              { label: 'Primary Bank', value: 'Meezan Bank — #0112-0114967852' },
              { label: 'Account Type', value: 'Sahulat (Retail)' },
              { label: 'Secondary Bank', value: 'Askari Bank' },
              { label: 'SCB Reference', value: 'Standard Chartered — Account Maintenance Certificate' },
              { label: 'EFT Status', value: 'Not yet configured in SAM.gov' },
              { label: 'Payment Method', value: 'International Wire Transfer' },
            ].map(r => (
              <div key={r.label}>
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">{r.label}</label>
                <div className={roClass}>{r.value}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* PSEB */}
        <Section icon={Globe} title="PSEB Registration">
          <div className="space-y-2.5">
            {[
              { label: 'Board', value: 'Pakistan Software Export Board' },
              { label: 'Type', value: 'Freelancer Certificate' },
              { label: 'Status', value: 'Certificate Issued' },
              { label: 'Fiscal Year', value: 'Jun 2026 — May 2027' },
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

        {/* Certificates */}
        <Section icon={Award} title="Certificates & Documents">
          <div className="space-y-2">
            {[
              { name: 'PSEB Freelancer Certificate (Jun 2026 — May 2027)', file: 'PSEB_Certificate_2026-2027.pdf' },
              { name: 'Intaerobase Capability Statement 2026', file: 'Intaerobase_Capabilities_2026.pdf' },
            ].map(cert => (
              <div key={cert.file} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-[var(--content-bg)] hover:bg-[var(--primary-light)] transition-colors">
                <span className="text-[13px] text-[var(--text-primary)] truncate">{cert.name}</span>
                <a href={`/api/certificates/${encodeURIComponent(cert.file)}`} download className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-[var(--primary)] rounded-lg hover:bg-[var(--primary)] hover:text-white transition-colors shrink-0">
                  <Download size={12} /> Download
                </a>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}
