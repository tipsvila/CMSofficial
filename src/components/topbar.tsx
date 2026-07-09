'use client'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { Bell, Search, Moon, Sun } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useSettings } from '@/lib/settings-context'

const pageNames: Record<string, string> = {
  '/': 'Dashboard',
  '/capabilities': 'Capabilities',
  '/contacts': 'Contacts',
  '/contacts/new': 'New Contact',
  '/database': 'Database',
  '/settings': 'Settings',
  '/contractors': 'Contractors',
  '/compliance': 'Compliance',
  '/outreach': 'Outreach',
  '/inquiries': 'Inquiries',
  '/contracts': 'Contracts',
  '/documents': 'Documents',
  '/orders': 'Orders',
  '/notifications': 'Notifications',
}

function resolvePageName(pathname: string): string {
  if (pageNames[pathname]) return pageNames[pathname]
  if (pathname.startsWith('/contacts/')) return 'Contact Details'
  if (pathname.startsWith('/contractors/')) return 'Contractor Details'
  if (pathname.startsWith('/compliance/')) return 'Compliance Details'
  if (pathname.startsWith('/outreach/')) return 'Outreach Details'
  if (pathname.startsWith('/inquiries/')) return 'Inquiry Details'
  if (pathname.startsWith('/contracts/')) return 'Contract Details'
  if (pathname.startsWith('/orders/')) return 'Order Details'
  return 'Dashboard'
}

export function Topbar() {
  const pathname = usePathname()
  const { settings } = useSettings()
  const [darkMode, setDarkMode] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    setDarkMode(document.documentElement.classList.contains('dark'))
    setMounted(true)
  }, [])

  const toggleDarkMode = () => {
    const next = !darkMode
    document.documentElement.classList.toggle('dark', next)
    setDarkMode(next)
    try { localStorage.setItem('darkMode', String(next)) } catch {}
  }

  const pageName = mounted ? resolvePageName(pathname) : 'Dashboard'

  return (
    <header className="sticky top-0 z-30 bg-[var(--card-bg)] border-b border-[var(--border-color)]">
      <div className="flex items-center justify-between px-6 lg:px-8 h-16">
        <div className="flex items-center gap-3">
          {settings.logoUrl && mounted && (
            <div className="rounded-lg overflow-hidden shrink-0" style={{ width: Math.min(settings.logoSize || 32, 32), height: Math.min(settings.logoSize || 32, 32) }}>
              <Image src={settings.logoUrl} alt={settings.companyName} width={Math.min(settings.logoSize || 32, 32)} height={Math.min(settings.logoSize || 32, 32)} className="w-full h-full" unoptimized />
            </div>
          )}
          <div>
            <h1 className="text-lg font-bold text-[var(--text-primary)]">{pageName}</h1>
            <p className="text-[11px] text-[var(--text-muted)]">{settings.companyName} / {pageName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 rounded-lg hover:bg-[var(--primary-light)] text-[var(--text-secondary)]">
            <Search size={18} />
          </button>
          <button onClick={toggleDarkMode} className="p-2 rounded-lg hover:bg-[var(--primary-light)] text-[var(--text-secondary)]">
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="p-2 rounded-lg hover:bg-[var(--primary-light)] text-[var(--text-secondary)] relative">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--danger)] rounded-full" />
          </button>
        </div>
      </div>
      {searchOpen && (
        <div className="px-6 lg:px-8 pb-3 animate-fade-in">
          <div className="relative max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input type="text" placeholder="Search parts, RFQs, contractors..." className="matdash-input pl-10" autoFocus onBlur={() => setSearchOpen(false)} />
          </div>
        </div>
      )}
    </header>
  )
}
