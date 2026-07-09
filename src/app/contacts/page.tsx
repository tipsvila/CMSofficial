'use client'

import { EntityListPage } from '@/components/entity-list-page'
import { Badge } from '@/components/ui'
import { Mail, Phone } from 'lucide-react'

const contactsConfig = {
  entityName: 'Contacts',
  endpoint: '/api/contacts',
  responseKey: 'contacts',
  searchPlaceholder: 'Search contacts...',
  addHref: '/contacts/new',
  addLabel: 'Add Contact',
  csvHeaders: ['First Name', 'Last Name', 'Company', 'Title', 'Email', 'Phone', 'Primary'],
  csvRowMapper: (row: Record<string, unknown>) => [
    row.firstName || '', row.lastName || '',
    (row.contractor as Record<string, unknown>)?.name || '',
    row.title || '', row.email || '', row.phone || '',
    row.isPrimary ? 'Yes' : 'No',
  ],
  columns: [
    { key: 'name', label: 'Name', sortable: true, sortField: 'firstName', render: (row: Record<string, unknown>) => (
      <div>
        <div className="font-bold text-[var(--text-primary)]">{String(row.firstName || '')} {String(row.lastName || '')}</div>
        {row.title ? <div className="text-[10px] text-[var(--text-muted)]">{String(row.title)}</div> : null}
      </div>
    )},
    { key: 'company', label: 'Company', render: (row: Record<string, unknown>) => (
      <span className="text-[12px]">{String((row.contractor as Record<string, unknown>)?.name || '-')}</span>
    )},
    { key: 'email', label: 'Email', sortable: true, render: (row: Record<string, unknown>) => (
      row.email ? <span className="flex items-center gap-1"><Mail size={12} /> {row.email as string}</span> : '-'
    )},
    { key: 'phone', label: 'Phone', render: (row: Record<string, unknown>) => (
      row.phone ? <span className="flex items-center gap-1"><Phone size={12} /> {row.phone as string}</span> : '-'
    )},
    { key: 'isPrimary', label: 'Primary', sortable: true, render: (row: Record<string, unknown>) => (
      <Badge variant={row.isPrimary ? 'success' : 'default'}>{row.isPrimary ? 'Primary' : 'Secondary'}</Badge>
    )},
  ],
}

export default function ContactsPage() {
  return <EntityListPage config={contactsConfig} />
}
