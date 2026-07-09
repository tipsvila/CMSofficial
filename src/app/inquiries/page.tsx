'use client'

import { EntityListPage, EntityListConfig } from '@/components/entity-list-page'
import { Badge } from '@/components/ui'

const statusBadgeVariant = (s: string) => {
  switch (s) { case 'Open': return 'info'; case 'Quoted': return 'warning'; case 'Awarded': return 'success'; case 'Closed': return 'danger'; default: return 'default' }
}

const config: EntityListConfig = {
  entityName: 'Inquiries',
  endpoint: '/api/inquiries',
  responseKey: 'inquiries',
  columns: [
    { key: 'inquiryId', label: 'Inquiry ID', sortable: true, render: row => <span className="font-mono text-[12px] font-bold">{String(row.inquiryId)}</span> },
    { key: 'partNumber', label: 'Part Number', sortable: true },
    { key: 'partDescription', label: 'Description', render: row => <span className="text-[12px] text-[var(--text-muted)] max-w-[200px] truncate block">{String(row.partDescription || '-')}</span> },
    { key: 'contractor', label: 'Contractor', render: row => <span className="text-[12px]">{String((row.contractor as Record<string, unknown>)?.name || '-')}</span> },
    { key: 'status', label: 'Status', sortable: true, render: row => <Badge variant={statusBadgeVariant(String(row.status))}>{String(row.status)}</Badge> },
  ],
  csvHeaders: ['Inquiry ID', 'Part Number', 'Description', 'Contractor', 'Status', 'Notes', 'Created At'],
  csvRowMapper: row => [row.inquiryId || '', row.partNumber || '', row.partDescription || '', (row.contractor as Record<string, unknown>)?.name || '', row.status || '', row.notes || '', row.createdAt ? new Date(row.createdAt as string).toLocaleDateString() : ''],
  addHref: '/inquiries/new',
  filters: [{ param: 'status', label: 'Statuses', options: ['All', 'Draft', 'Open', 'Quoted', 'Awarded', 'Closed'] }],
}

export default function InquiriesPage() {
  return <EntityListPage config={config} />
}
