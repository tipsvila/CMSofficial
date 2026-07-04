'use client'
import { ReactNode } from 'react'

interface PageHeaderProps { title: string; subtitle?: string; actions?: ReactNode }
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="matdash-card mb-6" style={{ background: 'linear-gradient(135deg, #1a365d 0%, #2563eb 100%)', borderRadius: '12px' }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">{title}</h1>
          {subtitle && <p className="text-[13px] text-blue-200 mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string; value: string | number; subtitle?: string; icon?: ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'secondary' | 'info'; className?: string;
}
export function StatCard({ title, value, subtitle, icon, color = 'primary', className = '' }: StatCardProps) {
  return (
    <div className={`matdash-card flex items-center gap-4 ${className}`}>
      {icon && <div className={`stat-icon-box ${color}`}>{icon}</div>}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-[var(--text-secondary)]">{title}</p>
        <p className="text-2xl font-bold text-[var(--text-primary)] mt-0.5">{value}</p>
        {subtitle && <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}
