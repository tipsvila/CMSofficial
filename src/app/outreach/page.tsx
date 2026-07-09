'use client'

import { EntityListPage, EntityListConfig } from '@/components/entity-list-page'
import { Badge } from '@/components/ui'

const STATUS_BADGE: Record<string, 'warning' | 'info' | 'success' | 'danger' | 'default'> = { Pending: 'warning', Contacted: 'info', 'In Progress': 'info', Completed: 'success', Cancelled: 'danger' }

const config: EntityListConfig = {
  entityName: 'Outreach',
  endpoint: '/api/outreach',
  responseKey: 'outreach',
  columns: [
    { key: 'subject', label: 'Subject', sortable: true, render: row => <div className="font-bold text-[var(--text-primary)] text-[12px]">{String(row.subject || '')}</div> },
    { key: 'contractor', label: 'Company', sortable: true, sortField: 'name', render: row => <span className="text-[12px]">{String((row.contractor as Record<string, unknown>)?.name || '-')}</span> },
    { key: 'status', label: 'Status', sortable: true, render: row => <Badge variant={STATUS_BADGE[row.status as string] || 'default'}>{String(row.status || '')}</Badge> },
    { key: 'priority', label: 'Priority', sortable: true, render: row => <Badge variant={row.priority === 'Urgent' ? 'danger' : row.priority === 'High' ? 'warning' : row.priority === 'Medium' ? 'info' : 'default'}>{String(row.priority || '')}</Badge> },
    { key: 'followUpDate', label: 'Follow-Up Date', sortable: true, render: row => <span className="text-[12px]">{row.followUpDate ? new Date(row.followUpDate as string).toLocaleDateString() : '-'}</span> },
  ],
  csvHeaders: ['Subject', 'Company', 'Status', 'Priority', 'Follow-Up Date', 'Created At'],
  csvRowMapper: row => [row.subject || '', (row.contractor as Record<string, unknown>)?.name || '', row.status || '', row.priority || '', row.followUpDate || '', row.createdAt || ''],
  addHref: '/outreach/new',
  filters: [
    { param: 'status', label: 'Statuses', options: ['All', 'Pending', 'Contacted', 'In Progress', 'Completed', 'Cancelled'] },
    { param: 'priority', label: 'Priorities', options: ['All', 'Low', 'Medium', 'High', 'Urgent'] },
  ],
}

export default function OutreachPage() {
  return <EntityListPage config={config} />
}
