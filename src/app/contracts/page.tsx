'use client'

import { EntityListPage, EntityListConfig } from '@/components/entity-list-page'
import { Badge } from '@/components/ui'

const statusBadgeVariant: Record<string, 'default' | 'warning' | 'success' | 'info' | 'danger'> = {
  Draft: 'default', Pending: 'warning', Active: 'success', Completed: 'info', Cancelled: 'danger', Suspended: 'danger',
}

const config: EntityListConfig = {
  entityName: 'Contracts',
  endpoint: '/api/contracts',
  responseKey: 'contracts',
  columns: [
    { key: 'contractNumber', label: 'Contract #', sortable: true, render: row => <span className="font-bold text-[var(--text-primary)]">{String(row.contractNumber || '')}</span> },
    { key: 'title', label: 'Title', sortable: true },
    { key: 'contractor', label: 'Company', render: row => <span className="text-[12px]">{String((row.contractor as Record<string, unknown>)?.name || '-')}</span> },
    { key: 'status', label: 'Status', sortable: true, render: row => <Badge variant={statusBadgeVariant[row.status as string] || 'default'}>{String(row.status || '')}</Badge> },
    { key: 'totalAmount', label: 'Amount', sortable: true, render: row => row.totalAmount != null ? <span className="text-[12px]">${Number(row.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> : <span className="text-[12px] text-[var(--text-muted)]">-</span> },
    { key: 'createdAt', label: 'Created', sortable: true, render: row => <span className="text-[12px]">{row.createdAt ? new Date(String(row.createdAt)).toLocaleDateString() : '-'}</span> },
  ],
  csvHeaders: ['Contract #', 'Title', 'Company', 'Status', 'Amount', 'Start Date', 'End Date', 'Created'],
  csvRowMapper: row => [row.contractNumber || '', row.title || '', (row.contractor as Record<string, unknown>)?.name || '', row.status || '', row.totalAmount != null ? String(row.totalAmount) : '', row.startDate || '', row.endDate || '', row.createdAt || ''],
  addHref: '/contracts/new',
  filters: [{ param: 'status', label: 'Statuses', options: ['All', 'Draft', 'Pending', 'Active', 'Completed', 'Cancelled', 'Suspended'] }],
}

export default function ContractsPage() {
  return <EntityListPage config={config} />
}
