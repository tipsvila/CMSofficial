'use client'

import { EntityListPage, EntityListConfig } from '@/components/entity-list-page'

const config: EntityListConfig = {
  entityName: 'SAM Data',
  endpoint: '/api/sam-data',
  responseKey: 'records',
  columns: [
    { key: 'awardIdPiid', label: 'Award ID/PIID', sortable: true, render: row => <span className="font-mono text-[12px] font-bold">{String(row.awardIdPiid || '')}</span> },
    { key: 'recipientName', label: 'Recipient', sortable: true },
    { key: 'totalObligatedAmount', label: 'Amount', sortable: true, render: row => row.totalObligatedAmount != null ? <span className="text-[12px]">${Number(row.totalObligatedAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> : <span className="text-[12px] text-[var(--text-muted)]">-</span> },
    { key: 'awardingAgencyName', label: 'Agency', sortable: true, render: row => <span className="text-[12px]">{String(row.awardingAgencyName || '-')}</span> },
    { key: 'naicsDescription', label: 'NAICS', render: row => <span className="text-[12px] text-[var(--text-muted)] max-w-[200px] truncate block">{String(row.naicsDescription || '-')}</span> },
    { key: 'periodOfPerformanceCurrentEndDate', label: 'End Date', sortable: true, render: row => row.periodOfPerformanceCurrentEndDate ? <span className="text-[12px]">{new Date(row.periodOfPerformanceCurrentEndDate as string).toLocaleDateString()}</span> : '-' },
  ],
  csvHeaders: ['Award ID/PIID', 'Recipient Name', 'Total Obligated Amount', 'End Date', 'NAICS Description', 'PSC Description', 'Awarding Agency'],
  csvRowMapper: row => [row.awardIdPiid || '', row.recipientName || '', row.totalObligatedAmount != null ? String(row.totalObligatedAmount) : '', row.periodOfPerformanceCurrentEndDate || '', row.naicsDescription || '', row.productOrServiceCodeDescription || '', row.awardingAgencyName || ''],
}

export default function SAMDataPage() {
  return <EntityListPage config={config} />
}
