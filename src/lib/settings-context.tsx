'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

export interface SettingsData {
  id?: string
  companyName: string
  tagline: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  phone: string
  phoneAlt: string
  email: string
  website: string
  logoUrl: string
  logoSize: number
  faviconUrl: string
  uei: string
  cageCode: string
  naicsCodes: string
  taxId: string
  duns: string
  samRegistration: boolean
  capabilities: string
  coreCapabilities: string
  certifications: string
  complianceFrameworks: string
  naicsDescriptions: string
  serviceHighlights: string
  whyChooseUs: string
  samGovStatus: string
  registrationPurpose: string
  ownerName: string
  defaultCurrency: string
  smtpFromName: string
  smtpFromEmail: string
}

const DEFAULT_SETTINGS: SettingsData = {
  companyName: 'INTAEROBASE',
  tagline: 'Aviation Federal Contract Management',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'US',
  phone: '',
  phoneAlt: '',
  email: '',
  website: '',
  logoUrl: '/logo.svg',
  logoSize: 36,
  faviconUrl: '',
  uei: '',
  cageCode: '',
  naicsCodes: '',
  taxId: '',
  duns: '',
  samRegistration: false,
  capabilities: '',
  coreCapabilities: '',
  certifications: '',
  complianceFrameworks: '',
  naicsDescriptions: '',
  serviceHighlights: '',
  whyChooseUs: '',
  samGovStatus: 'Submitted Registration',
  registrationPurpose: 'All Awards',
  ownerName: 'Hafiz Faisal Farooq',
  defaultCurrency: 'USD',
  smtpFromName: '',
  smtpFromEmail: '',
}

interface SettingsContextType {
  settings: SettingsData
  loading: boolean
  refresh: () => Promise<void>
}

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  loading: true,
  refresh: async () => {},
})

export function useSettings() {
  return useContext(SettingsContext)
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/settings')
      .then(r => r.json())
      .then(json => {
        if (!cancelled && json.success && json.data) {
          const d = json.data
          setSettings({
            id: d.id ?? undefined,
            companyName: d.companyName ?? '',
            tagline: d.tagline ?? '',
            address: d.address ?? '',
            city: d.city ?? '',
            state: d.state ?? '',
            zipCode: d.zipCode ?? '',
            country: d.country ?? 'US',
            phone: d.phone ?? '',
            phoneAlt: d.phoneAlt ?? '',
            email: d.email ?? '',
            website: d.website ?? '',
            logoUrl: d.logoUrl ?? '/logo.svg',
            logoSize: d.logoSize ?? 36,
            faviconUrl: d.faviconUrl ?? '',
            uei: d.uei ?? '',
            cageCode: d.cageCode ?? '',
            naicsCodes: d.naicsCodes ?? '',
            taxId: d.taxId ?? '',
            duns: d.duns ?? '',
            samRegistration: d.samRegistration ?? false,
            capabilities: d.capabilities ?? '',
            coreCapabilities: d.coreCapabilities ?? '',
            certifications: d.certifications ?? '',
            complianceFrameworks: d.complianceFrameworks ?? '',
            naicsDescriptions: d.naicsDescriptions ?? '',
            serviceHighlights: d.serviceHighlights ?? '',
            whyChooseUs: d.whyChooseUs ?? '',
            samGovStatus: d.samGovStatus ?? 'Submitted Registration',
            registrationPurpose: d.registrationPurpose ?? 'All Awards',
            ownerName: d.ownerName ?? 'Hafiz Faisal Farooq',
            defaultCurrency: d.defaultCurrency ?? 'USD',
            smtpFromName: d.smtpFromName ?? '',
            smtpFromEmail: d.smtpFromEmail ?? '',
          })
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) { setLoading(false); setMounted(true) } })
    return () => { cancelled = true }
  }, [])

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/settings')
      const json = await res.json()
      if (json.success && json.data) {
        const d = json.data
        setSettings({
          id: d.id ?? undefined,
          companyName: d.companyName ?? '',
          tagline: d.tagline ?? '',
          address: d.address ?? '',
            city: d.city ?? '',
            state: d.state ?? '',
            zipCode: d.zipCode ?? '',
            country: d.country ?? 'US',
            phone: d.phone ?? '',
            phoneAlt: d.phoneAlt ?? '',
            email: d.email ?? '',
            website: d.website ?? '',
            logoUrl: d.logoUrl ?? '/logo.svg',
            logoSize: d.logoSize ?? 36,
            faviconUrl: d.faviconUrl ?? '',
            uei: d.uei ?? '',
            cageCode: d.cageCode ?? '',
            naicsCodes: d.naicsCodes ?? '',
            taxId: d.taxId ?? '',
            duns: d.duns ?? '',
            samRegistration: d.samRegistration ?? false,
            capabilities: d.capabilities ?? '',
            coreCapabilities: d.coreCapabilities ?? '',
            certifications: d.certifications ?? '',
            complianceFrameworks: d.complianceFrameworks ?? '',
            naicsDescriptions: d.naicsDescriptions ?? '',
            serviceHighlights: d.serviceHighlights ?? '',
            whyChooseUs: d.whyChooseUs ?? '',
            samGovStatus: d.samGovStatus ?? 'Submitted Registration',
            registrationPurpose: d.registrationPurpose ?? 'All Awards',
            ownerName: d.ownerName ?? 'Hafiz Faisal Farooq',
            defaultCurrency: d.defaultCurrency ?? 'USD',
            smtpFromName: d.smtpFromName ?? '',
            smtpFromEmail: d.smtpFromEmail ?? '',
          })
        }
    } catch {}
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, loading: loading && !mounted, refresh }}>
      {children}
    </SettingsContext.Provider>
  )
}
