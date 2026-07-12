'use client'

import { EntityListPage, EntityListConfig } from '@/components/entity-list-page'
import Link from 'next/link'

const rfqConfig: EntityListConfig = {
  entityName: 'RFQ',
  endpoint: '/api/rfqs',
  responseKey: 'rfqs',
  searchPlaceholder: 'Search RFQs...',
  addHref: '/rfqs/new',
  addLabel: 'New RFQ',
  csvHeaders: ['RFQ Number', 'Title', 'Part Number', 'Quantity', 'Status', 'Created'],
  csvRowMapper: (row) => [
    row.rfqNumber || '', row.title || '', row.partNumber || '',
    row.quantity ?? '', row.status || '', row.createdAt || '',
  ],
  columns: [
    { key: 'rfqNumber', label: 'RFQ Number', sortable: true },
    { key: 'title', label: 'Title', sortable: true },
    { key: 'partNumber', label: 'Part Number', sortable: true },
    { key: 'quantity', label: 'Qty', sortable: true },
    { key: 'status', label: 'Status', sortable: true, render: (row) => {
      const s = String(row.status || 'Draft')
      const colors: Record<string, string> = {
        Draft: 'bg-gray-100 text-gray-700', Published: 'bg-blue-100 text-blue-700',
        Awarded: 'bg-green-100 text-green-700', Cancelled: 'bg-red-100 text-red-700',
      }
      return <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${colors[s] || 'bg-gray-100 text-gray-700'}`}>{s}</span>
    }},
    { key: 'contractor', label: 'Contractor', render: (row) => {
      const c = row.contractor as Record<string, unknown> | null
      return <span className="text-[12px]">{c?.name ? String(c.name) : '-'}</span>
    }},
    { key: 'createdAt', label: 'Created', sortable: true, render: (row) => (
      <span className="text-[11px] text-[var(--text-muted)]">{row.createdAt ? new Date(String(row.createdAt)).toLocaleDateString() : '-'}</span>
    )},
    { key: '_actions', label: '', render: (row) => (
      <Link href={`/rfqs/${row.id}`} className="text-[var(--primary)] hover:underline text-[11px]">View</Link>
    )},
  ],
}

export default function RFQsPage() {
  return <EntityListPage config={rfqConfig} />
}
