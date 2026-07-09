'use client'

import { useState } from 'react'
import { EntityListPage } from '@/components/entity-list-page'
import { Badge, Modal } from '@/components/ui'
import { Mail, Phone, Database } from 'lucide-react'
import { api } from '@/lib/api-client'
import { useToast } from '@/components/toast'

function SAMImportButton({ onImportComplete }: { onImportComplete: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [samRecords, setSamRecords] = useState<Record<string, unknown>[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const { toast } = useToast()

  const fetchSAMRecords = async () => {
    setLoading(true)
    try {
      const result = await api.get<{ records: Record<string, unknown>[] }>('/api/sam-data?limit=100')
      setSamRecords(result.records || [])
      setIsOpen(true)
    } catch (err) {
      toast('error', 'Failed to fetch SAM records')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (selectedIds.size === 0) {
      toast('error', 'Please select at least one SAM record')
      return
    }

    setImporting(true)
    try {
      // Get the first contractor to use for the contacts
      const contractorsResult = await api.get<{ contractors: Record<string, unknown>[] }>('/api/contractors?limit=1')
      const contractorId = contractorsResult.contractors?.[0]?.id as string

      if (!contractorId) {
        toast('error', 'No contractors found. Please create a contractor first.')
        return
      }

      const selectedRecords = samRecords.filter(r => selectedIds.has(r.id as string))
      let importedCount = 0

      for (const record of selectedRecords) {
        // Create a contact from SAM record
        const contactData = {
          contractorId,
          firstName: (record.recipientName as string)?.split(' ')[0] || 'Unknown',
          lastName: (record.recipientName as string)?.split(' ').slice(1).join(' ') || '',
          title: `SAM Record: ${record.awardIdPiid}`,
          email: '',
          phone: '',
          source: 'SAM',
        }

        await api.post('/api/contacts', contactData)
        importedCount++
      }

      toast('success', `Imported ${importedCount} contacts from SAM`)
      setIsOpen(false)
      setSelectedIds(new Set())
      onImportComplete()
    } catch (err) {
      toast('error', 'Failed to import contacts from SAM')
    } finally {
      setImporting(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <>
      <button
        onClick={fetchSAMRecords}
        disabled={loading}
        className="flex items-center gap-2 matdash-btn matdash-btn-primary px-3 py-1.5 rounded-md text-[11px] disabled:opacity-50 transition-colors"
      >
        <Database size={16} /> {loading ? 'Loading...' : 'Import from SAM'}
      </button>

      <Modal open={isOpen} onClose={() => setIsOpen(false)} title="Import Contacts from SAM">
        <div className="space-y-4">
          <p className="text-[12px] text-[var(--text-secondary)]">
            Select SAM records to import as contacts. The recipient name will be used as the contact name.
          </p>

          {samRecords.length === 0 ? (
            <p className="text-center py-4 text-[var(--text-muted)]">No SAM records found</p>
          ) : (
            <div className="max-h-64 overflow-y-auto border border-[var(--border-color)] rounded-lg">
              {samRecords.map(record => (
                <label
                  key={record.id as string}
                  className="flex items-center gap-3 p-3 hover:bg-[var(--content-bg)] cursor-pointer border-b border-[var(--border-color)] last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(record.id as string)}
                    onChange={() => toggleSelect(record.id as string)}
                    className="rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-[var(--text-primary)] truncate">
                      {String(record.recipientName)}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] truncate">
                      {String(record.awardIdPiid)} • {String(record.awardingAgencyName || 'Unknown Agency')}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <span className="text-[11px] text-[var(--text-muted)]">
              {selectedIds.size} of {samRecords.length} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="matdash-btn matdash-btn-outline text-[12px]"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={importing || selectedIds.size === 0}
                className="matdash-btn matdash-btn-primary text-[12px] disabled:opacity-50"
              >
                {importing ? 'Importing...' : `Import ${selectedIds.size} Contact${selectedIds.size !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}

const contactsConfig = {
  entityName: 'Contacts',
  endpoint: '/api/contacts',
  responseKey: 'contacts',
  searchPlaceholder: 'Search contacts...',
  addHref: '/contacts/new',
  addLabel: 'Add Contact',
  csvHeaders: ['First Name', 'Last Name', 'Company', 'Title', 'Email', 'Phone', 'Primary', 'Source'],
  csvRowMapper: (row: Record<string, unknown>) => [
    row.firstName || '', row.lastName || '',
    (row.contractor as Record<string, unknown>)?.name || '',
    row.title || '', row.email || '', row.phone || '',
    row.isPrimary ? 'Yes' : 'No',
    row.source || '',
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
    { key: 'source', label: 'Source', render: (row: Record<string, unknown>) => (
      row.source ? (
        <Badge variant={row.source === 'SAM' ? 'info' : 'default'}>{String(row.source)}</Badge>
      ) : '-'
    )},
  ],
}

export default function ContactsPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div key={refreshKey}>
      <EntityListPage
        config={{
          ...contactsConfig,
          extraActions: <SAMImportButton onImportComplete={() => setRefreshKey(k => k + 1)} />,
        }}
      />
    </div>
  )
}
