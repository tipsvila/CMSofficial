'use client'
import { usePathname } from 'next/navigation'
import { Bell, Search, Moon, Sun } from 'lucide-react'
import { useState, useEffect } from 'react'

const pageNames: Record<string, string> = { '/': 'Dashboard' }

export function Topbar() {
  const pathname = usePathname()
  const [darkMode, setDarkMode] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [companyName, setCompanyName] = useState('INTAEROBASE')

  useEffect(() => {
    setDarkMode(document.documentElement.classList.contains('dark'))
    fetch('/api/settings').then(r => r.json()).then(d => {
      if (d.companyName) setCompanyName(d.companyName)
    }).catch(() => {})
  }, [])

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark')
    setDarkMode(!darkMode)
  }

  const pageName = pageNames[pathname] || 'Dashboard'

  return (
    <header className="sticky top-0 z-30 bg-[var(--card-bg)] border-b border-[var(--border-color)]">
      <div className="flex items-center justify-between px-6 lg:px-8 h-16">
        <div>
          <h1 className="text-lg font-bold text-[var(--text-primary)]">{pageName}</h1>
          <p className="text-[11px] text-[var(--text-muted)]">{companyName} / {pageName}</p>
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
