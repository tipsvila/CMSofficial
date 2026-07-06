'use client'

import { ReactNode } from 'react'
import { SettingsProvider } from '@/lib/settings-context'
import { Sidebar } from '@/components/sidebar'
import { Topbar } from '@/components/topbar'
import { ToastContainer } from '@/components/toast'
import { DynamicFavicon } from '@/components/dynamic-favicon'
import { DynamicTitle } from '@/components/dynamic-title'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <DynamicFavicon />
      <DynamicTitle />
      <Sidebar />
      <div className="page-content min-h-screen flex flex-col transition-[padding] duration-300">
        <Topbar />
        <div className="flex-1 bg-[var(--content-bg)] rounded-bb">
          <div className="container py-6 lg:py-8 px-4 lg:px-6">{children}</div>
        </div>
      </div>
      <ToastContainer />
    </SettingsProvider>
  )
}
