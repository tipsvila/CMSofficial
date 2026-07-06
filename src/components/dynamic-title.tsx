'use client'

import { useEffect } from 'react'
import { useSettings } from '@/lib/settings-context'

export function DynamicTitle() {
  const { settings } = useSettings()

  useEffect(() => {
    if (settings.companyName) {
      document.title = `${settings.companyName} — Aviation CMS`
    }
  }, [settings.companyName])

  return null
}
