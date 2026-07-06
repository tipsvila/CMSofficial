'use client'

import { useEffect, useState } from 'react'
import { StatCard } from '@/components/page-header'
import { PageHeader } from '@/components/page-header'
import { DataTable, Badge } from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  FileText, Building2, Mail, TrendingUp, ClipboardCheck,
  Package, DollarSign, ShoppingCart, CheckCircle, AlertTriangle, ShieldCheck,
} from 'lucide-react'
import { DashboardSkeleton } from '@/components/skeleton'
import { api } from '@/lib/api-client'
import type { DashboardStats } from '@/lib/types'

export default function DashboardPage() {
  const [data, setData] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get<DashboardStats>('/api/dashboard')
      .then(setData)
      .catch((err) => setError(err.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardSkeleton />
  if (error) return <div className="matdash-card text-center py-12 text-[var(--danger)]">{error}</div>
  if (!data) return <div className="matdash-card text-center py-12 text-[var(--danger)]">Failed to load dashboard</div>

  const stats = data.stats
  const compliance = stats.compliance || {}
  const totalCompliance = Object.values(compliance).reduce((a, b) => a + Number(b), 0)
  const compliantCount = Number(compliance['Compliant'] || 0)
  const compliancePct = totalCompliance > 0 ? Math.round((compliantCount / totalCompliance) * 100) : 0

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Government Contract Tracking & Business Development Overview" />

      {/* Row 1: Core Business Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard title="Total Contracts" value={stats.totalContracts || 0} subtitle={`${stats.activeContracts || 0} active`} icon={<FileText size={22} />} color="primary" />
        <StatCard title="Contract Value" value={formatCurrency(stats.totalContractValue || 0)} icon={<DollarSign size={22} />} color="success" />
        <StatCard title="Contractors" value={stats.totalContractors || 0} icon={<Building2 size={22} />} color="secondary" />
        <StatCard title="Revenue" value={formatCurrency(stats.totalRevenue || 0)} subtitle={`${stats.totalOrders || 0} orders`} icon={<TrendingUp size={22} />} color="info" />
      </div>

      {/* Row 2: Procurement & RFQ Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard title="Open RFQs" value={stats.openRfqs || 0} subtitle={`${stats.totalRfqs || 0} total`} icon={<Package size={22} />} color="primary" />
        <StatCard title="Inquiries" value={stats.totalInquiries || 0} subtitle={`${stats.wonInquiries || 0} won`} icon={<ClipboardCheck size={22} />} color="info" />
        <StatCard title="Outreach" value={stats.totalOutreach || 0} subtitle={`${stats.pendingOutreach || 0} pending`} icon={<Mail size={22} />} color="warning" />
        <StatCard title="Pending Orders" value={stats.pendingOrders || 0} icon={<ShoppingCart size={22} />} color="danger" />
      </div>

      {/* Row 3: Compliance + Agencies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="matdash-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="matdash-card-title">Compliance Overview</h3>
              <p className="matdash-card-subtitle">{totalCompliance} total records</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-[var(--text-primary)]">{compliancePct}%</span>
              <span className="text-[11px] text-[var(--text-muted)]">compliant</span>
            </div>
          </div>
          <div className="w-full h-2 bg-[var(--content-bg)] rounded-full mb-5 overflow-hidden">
            <div className="h-full bg-[var(--success)] rounded-full transition-all duration-500" style={{ width: `${compliancePct}%` }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(compliance).map(([status, count]) => (
              <div key={status} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-[var(--content-bg)]">
                {status === 'Compliant' ? (
                  <CheckCircle size={16} className="text-[var(--success)] shrink-0" />
                ) : status === 'Non-Compliant' ? (
                  <AlertTriangle size={16} className="text-[var(--danger)] shrink-0" />
                ) : (
                  <ShieldCheck size={16} className="text-[var(--info)] shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-[var(--text-secondary)] truncate">{status}</p>
                </div>
                <span className="text-[15px] font-bold text-[var(--text-primary)]">{count}</span>
              </div>
            ))}
            {Object.keys(compliance).length === 0 && (
              <p className="col-span-2 text-[var(--text-muted)] text-[13px] py-4 text-center">No compliance records yet</p>
            )}
          </div>
        </div>

        <div className="matdash-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="matdash-card-title">Top Agencies</h3>
              <p className="matdash-card-subtitle">By contract value</p>
            </div>
          </div>
          <div className="space-y-3">
            {(() => {
              const agencies = data.agencySummary || []
              const maxTotal = agencies.length > 0 ? Math.max(...agencies.map(a => a.total)) : 0
              return agencies.map((agency) => {
                const pct = maxTotal > 0 ? (agency.total / maxTotal) * 100 : 0
                return (
                <div key={agency.agency}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] text-[var(--text-primary)] truncate max-w-[220px]">{agency.agency}</span>
                    <span className="text-[13px] font-bold text-[var(--primary)]">{formatCurrency(agency.total)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-[var(--content-bg)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--primary)] rounded-full opacity-60" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })
            })()}
            {(!data.agencySummary || data.agencySummary.length === 0) && (
              <p className="text-[var(--text-muted)] text-[13px] py-4 text-center">No agency data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Row 4: Recent Outreach */}
      <div className="matdash-card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="matdash-card-title">Recent Outreach</h3>
            <p className="matdash-card-subtitle">Latest outreach activities</p>
          </div>
        </div>
        <DataTable
          columns={[
            { key: 'contractor', label: 'Company', render: (row) => {
              const c = row.contractor as Record<string, unknown> | undefined
              return (c?.name as string) || '-'
            }},
            { key: 'status', label: 'Status', render: (row) => (
              <Badge variant={row.status === 'Sent' ? 'success' : row.status === 'Pending' ? 'warning' : row.status === 'Follow-Up' ? 'info' : 'default'}>
                {String(row.status)}
              </Badge>
            )},
            { key: 'priority', label: 'Priority' },
            { key: 'createdAt', label: 'Date', render: (row) => formatDate(String(row.createdAt)) },
          ]}
          data={(data.recentOutreach as unknown as Record<string, unknown>[]) || []}
        />
      </div>
    </div>
  )
}
