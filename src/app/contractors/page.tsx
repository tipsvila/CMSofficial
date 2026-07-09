'use client'

import { EntityListPage, EntityListConfig } from '@/components/entity-list-page'

const config: EntityListConfig = {
  entityName: 'Contractors',
  endpoint: '/api/contractors',
  responseKey: 'contractors',
  columns: [
    { key: 'name', label: 'Name', sortable: true, render: row => <span className="font-bold text-[var(--text-primary)]">{String(row.name || '')}</span> },
    { key: 'city', label: 'City', sortable: true },
    { key: 'state', label: 'State', sortable: true },
    { key: 'contractingTier', label: 'Tier' },
    { key: 'email1', label: 'Email' },
  ],
  csvHeaders: ['Name', 'UEI', 'DUNS', 'Address', 'City', 'State', 'Zip Code', 'Phone', 'Email', 'Website', 'Tier', 'Notes'],
  csvRowMapper: row => [row.name || '', row.uei || '', row.duns || '', row.address || '', row.city || '', row.state || '', row.zipCode || '', row.phone || '', row.email1 || '', row.website || '', row.contractingTier || '', row.notes || ''],
  addHref: '/contractors/new',
}

export default function ContractorsPage() {
  return <EntityListPage config={config} />
}
