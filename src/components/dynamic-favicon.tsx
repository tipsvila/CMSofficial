'use client'

import { useEffect } from 'react'
import { useSettings } from '@/lib/settings-context'

export function DynamicFavicon() {
  const { settings } = useSettings()

  useEffect(() => {
    const url = settings.faviconUrl || settings.logoUrl
    if (!url) return

    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    if (!link) return
    link.href = url
  }, [settings.faviconUrl, settings.logoUrl])

  return null
}
