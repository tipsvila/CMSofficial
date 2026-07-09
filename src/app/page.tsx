'use client'

import { useEffect, useState } from 'react'
import { StatCard, ChartCard, FilterBar } from '@/components/dashboard'
import { ErrorBoundary } from '@/components/error-boundary'
import { PageHeader } from '@/components/page-header'
import { DataTable, Badge } from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/utils'
import { trackApiCall } from '@/lib/debug'
import {
  FileText, Building2, Mail, TrendingUp, ClipboardCheck,
  Package, DollarSign, ShoppingCart, Database, Target, Activity,
} from 'lucide-react'
import { DashboardSkeleton } from '@/components/skeleton'
import { api } from '@/lib/api-client'
import type { DashboardStats } from '@/lib/types'

export default function DashboardPage() {
  const [data, setData] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [dateRange, setDateRange] = useState('30d')
  const [agency, setAgency] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    trackApiCall('/api/dashboard', () =>
      api.get<DashboardStats>('/api/dashboard')
    )
      .then(setData)
      .catch((err) => setError(err.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [dateRange, agency, status])

  if (loading) return <DashboardSkeleton />
  if (error) return <div className="matdash-card text-center py-12 text-[var(--danger)]">{error}</div>
  if (!data) return <div className="matdash-card text-center py-12 text-[var(--danger)]">Failed to load dashboard</div>

  const stats = data.stats
  const compliance = stats.compliance || {}
  const totalCompliance = Object.values(compliance).reduce((a, b) => a + Number(b), 0)
  const compliantCount = Number(compliance['Compliant'] || 0)
  const compliancePct = totalCompliance > 0 ? Math.round((compliantCount / totalCompliance) * 100) : 0

  const complianceChartData = Object.entries(compliance).map(([label, value]) => ({
    label,
    value: Number(value),
  }))

  const agencyChartData = (data.agencySummary || []).map((a) => ({
    label: a.agency,
    value: a.total,
  }))

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          subtitle="Government Contract Tracking & Business Development Overview"
        />

        <FilterBar
          dateRange={dateRange}
          agency={agency}
          status={status}
          onDateRangeChange={setDateRange}
          onAgencyChange={setAgency}
          onStatusChange={setStatus}
          onClear={() => { setDateRange('30d'); setAgency(''); setStatus('') }}
        />

        {/* Row 1: Core Business Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard title="Total Contracts" value={stats.totalContracts || 0} trend={{ value: 12, isPositive: true }} comparison={`${stats.activeContracts || 0} active`} icon={<FileText size={22} />} color="primary" />
          <StatCard title="Contract Value" value={formatCurrency(stats.totalContractValue || 0)} trend={{ value: 8, isPositive: true }} icon={<DollarSign size={22} />} color="success" />
          <StatCard title="Contractors" value={stats.totalContractors || 0} icon={<Building2 size={22} />} color="primary" />
          <StatCard title="Revenue" value={formatCurrency(stats.totalRevenue || 0)} trend={{ value: 5, isPositive: true }} comparison={`${stats.totalOrders || 0} orders`} icon={<TrendingUp size={22} />} color="success" />
        </div>

        {/* Row 2: SAM Data Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard title="SAM Records" value={data.samData?.totalRecords || 0} trend={{ value: 15, isPositive: true }} comparison={`${data.samData?.activeContracts || 0} active`} icon={<Database size={22} />} color="primary" />
          <StatCard title="Pipeline Value" value={formatCurrency(data.samData?.pipelineValue || 0)} trend={{ value: 10, isPositive: true }} icon={<Target size={22} />} color="success" />
          <StatCard title="Top Agencies" value={data.samData?.topAgencies?.length || 0} comparison={`${data.samData?.topAgencies?.reduce((sum, a) => sum + a.count, 0) || 0} contracts`} icon={<Building2 size={22} />} color="primary" />
          <StatCard title="Active Tracking" value={data.samData?.activeContracts || 0} trend={{ value: 8, isPositive: true }} comparison={`${data.samData?.totalRecords || 0} total`} icon={<Activity size={22} />} color="warning" />
        </div>

        {/* Row 3: Procurement & RFQ Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard title="Open RFQs" value={stats.openRfqs || 0} comparison={`${stats.totalRfqs || 0} total`} icon={<Package size={22} />} color="primary" />
          <StatCard title="Inquiries" value={stats.totalInquiries || 0} comparison={`${stats.wonInquiries || 0} won`} icon={<ClipboardCheck size={22} />} color="primary" />
          <StatCard title="Outreach" value={stats.totalOutreach || 0} comparison={`${stats.pendingOutreach || 0} pending`} icon={<Mail size={22} />} color="warning" />
          <StatCard title="Pending Orders" value={stats.pendingOrders || 0} icon={<ShoppingCart size={22} />} color="danger" />
        </div>

        {/* Row 4: Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Compliance Overview" subtitle={`${compliancePct}% compliant`} type="bar" data={complianceChartData} />
          <ChartCard title="Top SAM Agencies" subtitle="By contract value" type="bar" data={agencyChartData} />
        </div>

        {/* Row 5: SAM Data Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="SAM Contracts Trend"
            subtitle="Monthly new contracts"
            type="bar"
            data={(data.trends?.contracts || []).map(t => ({ label: t.month, value: t.count }))}
          />
          <ChartCard
            title="SAM Pipeline Value Trend"
            subtitle="Monthly obligated amounts"
            type="bar"
            data={(data.trends?.contracts || []).map(t => ({ label: t.month, value: t.total }))}
          />
        </div>

        {/* Row 6: Compliance + Agencies Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="matdash-card">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="matdash-card-title">Compliance Breakdown</h3>
                <p className="matdash-card-subtitle">{totalCompliance} total records</p>
              </div>
            </div>
            <div className="w-full h-2 bg-[var(--content-bg)] rounded-full mb-5 overflow-hidden">
              <div className="h-full bg-[var(--success)] rounded-full transition-all duration-500" style={{ width: `${compliancePct}%` }} />
            </div>
            <div className="space-y-2">
              {Object.entries(compliance).map(([label, value]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm">{label}</span>
                  <span className="text-sm font-medium">{value}</span>
                </div>
              ))}
              {Object.keys(compliance).length === 0 && (
                <p className="text-[var(--text-muted)] text-[13px] py-4 text-center">No compliance records yet</p>
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

        {/* Row 7: Recent Outreach */}
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

        {/* Row 8: Top SAM Agencies Detail */}
        <div className="matdash-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="matdash-card-title">Top SAM Agencies</h3>
              <p className="matdash-card-subtitle">By contract value and record count</p>
            </div>
          </div>
          <div className="space-y-4">
            {(data.samData?.topAgencies || []).map((agency) => {
              const maxValue = Math.max(...(data.samData?.topAgencies || []).map(a => a.total))
              const pct = maxValue > 0 ? (agency.total / maxValue) * 100 : 0
              return (
                <div key={agency.agency} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--primary)] bg-opacity-10 flex items-center justify-center">
                        <Building2 size={16} className="text-[var(--primary)]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{agency.agency}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{agency.count} contracts</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-[var(--primary)]">{formatCurrency(agency.total)}</span>
                  </div>
                  <div className="w-full h-2 bg-[var(--content-bg)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary)] opacity-60 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {(!data.samData?.topAgencies || data.samData.topAgencies.length === 0) && (
              <p className="text-[var(--text-muted)] text-[13px] py-6 text-center">No SAM agency data available</p>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
