'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { PageHeader } from '@/components/page-header'
import { Download, Loader2, Building2, Shield, FileText, Globe, Award, CheckCircle } from 'lucide-react'
import { useSettings } from '@/lib/settings-context'

const DEFAULT_SERVICES = [
  { title: 'Aviation Parts Sourcing & Procurement', desc: 'Global supply chain facilitation for OEM, PMA, and surplus aviation parts with full traceability.' },
  { title: 'IT-Enabled Services (ITeS)', desc: 'Data processing, systems design, and digital infrastructure for government contractors.' },
  { title: 'Defense Logistics Support', desc: 'DLA-certified supply chain management with NATO CAGE compliance.' },
  { title: 'Federal Contract Management', desc: 'End-to-end CMS architecture for compliance tracking, RFQ workflows, and order management.' },
  { title: 'Compliance & Audit Support', desc: 'FAR/DFARS alignment, CMMC readiness, and ITAR compliance documentation.' },
  { title: 'Supply Chain Traceability', desc: 'Complete chain-of-custody documentation, CoC verification, and serial number tracking.' },
]

const DEFAULT_CERTS = ['FAA Form 8130-3', 'AS9120 Quality Management', 'AS9110 Maintenance Standards']
const DEFAULT_FRAMEWORKS = ['FAR', 'DFARS', 'CMMC', 'ITAR']

function safeJsonParse<T>(str: string, fallback: T): T {
  if (!str || str.trim() === '') return fallback
  try { return JSON.parse(str) as T } catch { return fallback }
}

export default function CapabilitiesPage() {
  const { settings, loading } = useSettings()
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const naicsList = [...new Set((settings.naicsCodes || '').split(',').map((n) => n.trim()).filter(Boolean))]
  const naicsDescs = useMemo(() => safeJsonParse<Record<string, string>>(settings.naicsDescriptions, {}), [settings.naicsDescriptions])
  const services = useMemo(() => {
    const parsed = safeJsonParse<Array<{title: string; desc: string}>>(settings.coreCapabilities, DEFAULT_SERVICES)
    const seen = new Set<string>()
    return parsed.filter(s => { if (seen.has(s.title)) return false; seen.add(s.title); return true })
  }, [settings.coreCapabilities])
  const certs = useMemo(() => {
    const list = settings.certifications ? settings.certifications.split(',').map((c: string) => c.trim()).filter(Boolean) : DEFAULT_CERTS
    return [...new Set(list)]
  }, [settings.certifications])
  const frameworks = useMemo(() => {
    const list = settings.complianceFrameworks ? settings.complianceFrameworks.split(',').map((f: string) => f.trim()).filter(Boolean) : DEFAULT_FRAMEWORKS
    return [...new Set(list)]
  }, [settings.complianceFrameworks])

  const handleDownload = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/capabilities/pdf')
      if (!res.ok) throw new Error('Failed to generate PDF')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Capability_Statement.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      setError('Failed to generate PDF')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={24} className="animate-spin text-[var(--primary)]" />
      </div>
    )
  }

  if (error) {
    return <div className="matdash-card text-center py-12 text-[var(--danger)]">{error}</div>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Capability Statement"
        subtitle={`${settings.companyName} — Official Company Capabilities & Credentials`}
        actions={
          <button
            onClick={handleDownload}
            disabled={generating}
            className="matdash-btn matdash-btn-primary flex items-center gap-2"
          >
            {generating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {generating ? 'Generating...' : 'Download PDF'}
          </button>
        }
      />

      {/* Header Card */}
      <div className="matdash-card" style={{ background: 'linear-gradient(135deg, #1a365d 0%, #2563eb 100%)', color: 'white' }}>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <Image src={settings.logoUrl || '/logo.svg'} alt={settings.companyName} width={64} height={64} className="w-16 h-16 rounded-2xl bg-white/20 object-contain p-2" unoptimized />
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-1">{settings.companyName}</h1>
            <p className="text-blue-100 text-sm">{settings.tagline}</p>
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-blue-200">
              <span>{settings.city}, {settings.country}</span>
              <span>{settings.website}</span>
              <span>{settings.email}</span>
            </div>
          </div>
          <div className="text-right text-xs text-blue-200">
            <p>UEI: <span className="text-white font-mono font-bold">{settings.uei}</span></p>
            <p>CAGE: <span className="text-white font-mono font-bold">{settings.cageCode}</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Government IDs */}
        <div className="matdash-card">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={18} className="text-[var(--primary)]" />
            <h2 className="text-lg font-bold">Government Registrations</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Unique Entity ID (UEI)', value: settings.uei, color: 'text-[var(--primary)]' },
              { label: 'CAGE/NCAGE Code', value: settings.cageCode, color: 'text-[var(--success)]' },
              { label: 'FBR/NTN Tax ID', value: settings.taxId, color: 'text-[var(--secondary)]' },
              { label: 'Entity Type', value: 'Sole Proprietorship', color: '' },
              { label: 'SAM.gov Status', value: 'Submitted Registration', color: 'text-[var(--warning)]' },
              { label: 'Registration Purpose', value: 'All Awards', color: '' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-[var(--border-color)] last:border-0">
                <span className="text-[13px] text-[var(--text-secondary)]">{item.label}</span>
                <span className={`text-[13px] font-bold font-mono ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* NAICS Codes */}
        <div className="matdash-card">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={18} className="text-[var(--primary)]" />
            <h2 className="text-lg font-bold">NAICS Classifications</h2>
          </div>
          <div className="space-y-3">
            {naicsList.map((code) => (
              <div key={code} className="p-3 bg-[var(--content-bg)] rounded-lg">
                <span className="text-[14px] font-bold font-mono text-[var(--primary)]">{code}</span>
                <p className="text-[12px] text-[var(--text-secondary)] mt-1">
                  {naicsDescs[code] || 'Classification'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Services */}
        <div className="matdash-card lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={18} className="text-[var(--primary)]" />
            <h2 className="text-lg font-bold">Core Capabilities</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <div key={service.title} className="p-4 bg-[var(--content-bg)] rounded-lg border border-[var(--border-color)]">
                <h3 className="text-[14px] font-bold text-[var(--text-primary)] mb-2">{service.title}</h3>
                <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div className="matdash-card">
          <div className="flex items-center gap-2 mb-4">
            <Award size={18} className="text-[var(--primary)]" />
            <h2 className="text-lg font-bold">Certifications & Standards</h2>
          </div>
          <div className="space-y-2">
            {certs.map((cert) => (
              <div key={cert} className="flex items-center gap-3 py-2 border-b border-[var(--border-color)] last:border-0">
                <CheckCircle size={16} className="text-[var(--success)] shrink-0" />
                <span className="text-[13px] font-medium text-[var(--text-primary)]">{cert}</span>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <h4 className="text-[12px] font-bold text-[var(--text-secondary)] mb-2">Compliance Frameworks</h4>
            <div className="flex flex-wrap gap-2">
              {frameworks.map((c) => (
                <span key={c} className="matdash-badge light-primary">{c}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="matdash-card">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={18} className="text-[var(--primary)]" />
            <h2 className="text-lg font-bold">Contact Information</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Owner', value: settings.ownerName || 'Hafiz Faisal Farooq' },
              { label: 'Role', value: 'Administrator — Entity Registration & Reporting' },
              { label: 'Phone', value: settings.phone },
              { label: 'Email', value: settings.email },
              { label: 'Website', value: settings.website },
              { label: 'Address', value: [settings.address, settings.city, settings.state, settings.zipCode].filter(Boolean).join(', ') },
            ].map((item) => (
              <div key={item.label} className="flex items-start justify-between py-2 border-b border-[var(--border-color)] last:border-0">
                <span className="text-[13px] text-[var(--text-secondary)] shrink-0">{item.label}</span>
                <span className="text-[13px] font-medium text-[var(--text-primary)] text-right ml-4">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
