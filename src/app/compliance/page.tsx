'use client'

import { EntityListPage, EntityListConfig } from '@/components/entity-list-page'
import { Badge } from '@/components/ui'

const statusVariant = (s: string) => {
  switch (s) { case 'Pending': return 'warning'; case 'Active': return 'success'; case 'Expired': case 'Non-Compliant': return 'danger'; default: return 'default' }
}
const riskVariant = (r: string) => {
  switch (r) { case 'Medium': return 'warning'; case 'High': case 'Critical': return 'danger'; default: return 'default' }
}

const config: EntityListConfig = {
  entityName: 'Compliance',
  endpoint: '/api/compliance',
  responseKey: 'records',
  columns: [
    { key: 'type', label: 'Type', sortable: true, render: row => <span className="text-[12px] font-medium">{String(row.type || '')}</span> },
    { key: 'requirement', label: 'Requirement', sortable: true },
    { key: 'contractor', label: 'Company', render: row => <span className="text-[12px]">{String((row.contractor as Record<string, unknown>)?.name || '-')}</span> },
    { key: 'status', label: 'Status', sortable: true, render: row => <Badge variant={statusVariant(row.status as string)}>{String(row.status || '')}</Badge> },
    { key: 'riskLevel', label: 'Risk Level', sortable: true, render: row => <Badge variant={riskVariant(row.riskLevel as string)}>{String(row.riskLevel || '-')}</Badge> },
    { key: 'expiryDate', label: 'Expiry', sortable: true, render: row => row.expiryDate ? <span className="text-[12px]">{new Date(row.expiryDate as string).toLocaleDateString()}</span> : '-' },
  ],
  csvHeaders: ['Type', 'Requirement', 'Company', 'Status', 'Risk Level', 'Expiry Date', 'Created At'],
  csvRowMapper: row => [row.type || '', row.requirement || '', (row.contractor as Record<string, unknown>)?.name || '', row.status || '', row.riskLevel || '', row.expiryDate ? new Date(row.expiryDate as string).toLocaleDateString() : '', row.createdAt ? new Date(row.createdAt as string).toLocaleDateString() : ''],
  addHref: '/compliance/new',
  filters: [
    { param: 'status', label: 'Statuses', options: ['All', 'Pending', 'Active', 'Expired', 'Non-Compliant'] },
    { param: 'riskLevel', label: 'Risk Levels', options: ['All', 'Low', 'Medium', 'High', 'Critical'] },
  ],
}

export default function CompliancePage() {
  return <EntityListPage config={config} />
}
