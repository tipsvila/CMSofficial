'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { LayoutDashboard, Menu, X, ChevronLeft, ChevronRight, Award, Settings, Database, Users, Shield, Send, ShoppingCart, Bell, FileText, ClipboardList, FileSearch, Globe } from 'lucide-react'
import { useSettings } from '@/lib/settings-context'

interface NavItem { name: string; href: string; icon: React.ComponentType<{ size?: number; className?: string }> }
interface NavGroup { title: string; items: NavItem[] }

const navigation: NavGroup[] = [
  { title: 'Dashboards', items: [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  ]},
  { title: 'CRM', items: [
    { name: 'SAM Data', href: '/sam-data', icon: Globe },
    { name: 'Contracts', href: '/contracts', icon: FileText },
    { name: 'Contractors', href: '/contractors', icon: Users },
    { name: 'Contacts', href: '/contacts', icon: Users },
    { name: 'Outreach', href: '/outreach', icon: Send },
    { name: 'Compliance', href: '/compliance', icon: Shield },
    { name: 'Inquiries', href: '/inquiries', icon: ClipboardList },
  ]},
  { title: 'Operations', items: [
    { name: 'Capabilities', href: '/capabilities', icon: Award },
    { name: 'Documents', href: '/documents', icon: FileSearch },
    { name: 'Orders', href: '/orders', icon: ShoppingCart },
    { name: 'Notifications', href: '/notifications', icon: Bell },
  ]},
  { title: 'System', items: [
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'Database', href: '/database', icon: Database },
  ]},
]

export function Sidebar() {
  const pathname = usePathname()
  const { settings } = useSettings()
  const [expanded, setExpanded] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem('sidebarExpanded')
      if (saved !== null) setExpanded(saved === 'true')
    } catch {}
  }, [])

  useEffect(() => {
    if (!mounted) return
    document.documentElement.style.setProperty('--sidebar-width', expanded ? '260px' : '4.5rem')
    try { localStorage.setItem('sidebarExpanded', String(expanded)) } catch {}
  }, [expanded, mounted])

  useEffect(() => { setMobileOpen(false) }, [pathname])

  const isActive = (href: string) => mounted && (pathname === href || (href !== '/' && pathname.startsWith(href)))

  if (!mounted) return null

  return (
    <>
      <button onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[var(--card-bg)] rounded-lg border border-[var(--border-color)] shadow-md">
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      {mobileOpen && <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setMobileOpen(false)} />}

      <aside className={`sidebar lg:hidden ${mobileOpen ? 'mobile-open' : ''}`}>
        <SidebarContent companyName={settings.companyName} tagline={settings.tagline} logoUrl={settings.logoUrl} logoSize={settings.logoSize} isActive={isActive} />
      </aside>

      {!expanded && (
        <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 flex-col items-center bg-[var(--sidebar-bg)] border-r border-[var(--border-color)]" style={{ width: '4.5rem' }}>
          <Link href="/" className="flex items-center justify-center w-full h-14 shrink-0" title={settings.companyName}>
          <div className="rounded-lg flex items-center justify-center overflow-hidden shrink-0" style={{ width: settings.logoSize || 36, height: settings.logoSize || 36 }}>
            {settings.logoUrl ? <Image src={settings.logoUrl} alt={settings.companyName} width={settings.logoSize || 36} height={settings.logoSize || 36} className="w-full h-full" unoptimized /> : <div className="w-full h-full rounded-lg bg-[var(--primary)] flex items-center justify-center text-white font-bold text-sm">IA</div>}
          </div>
          </Link>
          <nav className="flex-1 overflow-y-auto w-full px-2 py-2 space-y-1">
            {navigation.map((g) => g.items.map((item) => (
              <Link key={item.name} href={item.href} title={item.name}
                className={`flex items-center justify-center w-full h-10 rounded-xl text-sm transition-all duration-200 ${
                  isActive(item.href) ? 'bg-[var(--primary)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)]'
                }`}>
                <item.icon size={18} />
              </Link>
            )))}
          </nav>
          <button onClick={() => setExpanded(true)} className="w-full flex items-center justify-center h-10 text-[var(--text-muted)] hover:text-[var(--primary)] mb-2">
            <ChevronRight size={16} />
          </button>
        </aside>
      )}

      {expanded && (
        <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 bg-[var(--sidebar-bg)] border-r border-[var(--border-color)] flex-col" style={{ width: '260px' }}>
          <SidebarContent companyName={settings.companyName} tagline={settings.tagline} logoUrl={settings.logoUrl} logoSize={settings.logoSize} isActive={isActive} onCollapse={() => setExpanded(false)} />
        </aside>
      )}
    </>
  )
}

function SidebarContent({ companyName, tagline, logoUrl, logoSize, isActive, onCollapse }: {
  companyName: string; tagline?: string; logoUrl?: string; logoSize?: number; isActive: (href: string) => boolean; onCollapse?: () => void
}) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between px-5 py-4 shrink-0 border-b border-[var(--border-color)]">
        <Link href="/" className="flex items-center gap-3">
          <div className="rounded-lg flex items-center justify-center overflow-hidden shrink-0" style={{ width: logoSize || 36, height: logoSize || 36 }}>
            {logoUrl ? <Image src={logoUrl} alt={companyName} width={logoSize || 36} height={logoSize || 36} className="w-full h-full" unoptimized /> : <div className="w-full h-full rounded-lg bg-[var(--primary)] flex items-center justify-center text-white font-bold text-sm">IA</div>}
          </div>
          <div>
            <span className="font-bold text-[15px] text-[var(--text-primary)]">{companyName}</span>
            <p className="text-[10px] text-[var(--text-muted)] leading-tight truncate max-w-[140px]">{tagline || 'Aviation CMS'}</p>
          </div>
        </Link>
        {onCollapse && (
          <button onClick={onCollapse} className="p-1.5 rounded-lg hover:bg-[var(--primary-light)] text-[var(--text-muted)]"><ChevronLeft size={16} /></button>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto px-4 py-3">
        {navigation.map((group) => (
          <div key={group.title} className="mb-3">
            <h5 className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-2 px-1">{group.title}</h5>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.name}>
                  <Link href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 hover:translate-x-1 ${
                      isActive(item.href) ? 'bg-[var(--primary)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)]'
                    }`}>
                    <item.icon size={18} />
                    <span className="flex-1 truncate">{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  )
}
