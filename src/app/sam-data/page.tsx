'use client'

import { Suspense, useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import { DataTable, ConfirmDialog } from '@/components/ui'
import { FilterPanel, type SAMFilters } from '@/components/sam-data/filter-panel'
import { BulkActions } from '@/components/sam-data/bulk-actions'
import { TransferModal } from '@/components/sam-data/transfer-modal'
import { EmailModal } from '@/components/sam-data/email-modal'
import { ComplianceModal } from '@/components/sam-data/compliance-modal'
import { Plus, Search, Eye, Upload, Trash2, CheckSquare, Square, FileSpreadsheet, Loader2, ArrowRightLeft } from 'lucide-react'
import { SortIcon } from '@/components/sort-icon'
import Link from 'next/link'
import { useDebounce } from '@/hooks/use-debounce'
import { useToast } from '@/components/toast'
import { TableSkeleton } from '@/components/skeleton'
import { api } from '@/lib/api-client'
import type { SAMRecord } from '@/lib/sam-email'

const CSV_HEADERS = ['Award ID/PIID', 'Recipient Name', 'Total Obligated Amount', 'End Date', 'NAICS Description', 'PSC Description', 'Awarding Agency']
const csvRowMapper = (row: Record<string, unknown>) => [
  row.awardIdPiid || '', row.recipientName || '',
  row.totalObligatedAmount != null ? String(row.totalObligatedAmount) : '',
  row.periodOfPerformanceCurrentEndDate || '', row.naicsDescription || '',
  row.productOrServiceCodeDescription || '', row.awardingAgencyName || '',
]

const COLUMNS = [
  { key: 'awardIdPiid', label: 'Award ID/PIID', sortable: true, render: (row: Record<string, unknown>) => <span className="font-mono text-[12px] font-bold">{String(row.awardIdPiid || '')}</span> },
  { key: 'recipientName', label: 'Recipient', sortable: true },
  { key: 'totalObligatedAmount', label: 'Amount', sortable: true, render: (row: Record<string, unknown>) => row.totalObligatedAmount != null ? <span className="text-[12px]">${Number(row.totalObligatedAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> : <span className="text-[12px] text-[var(--text-muted)]">-</span> },
  { key: 'awardingAgencyName', label: 'Agency', sortable: true, render: (row: Record<string, unknown>) => <span className="text-[12px]">{String(row.awardingAgencyName || '-')}</span> },
  { key: 'naicsDescription', label: 'NAICS', render: (row: Record<string, unknown>) => <span className="text-[12px] text-[var(--text-muted)] max-w-[200px] truncate block">{String(row.naicsDescription || '-')}</span> },
  { key: 'periodOfPerformanceCurrentEndDate', label: 'End Date', sortable: true, render: (row: Record<string, unknown>) => row.periodOfPerformanceCurrentEndDate ? <span className="text-[12px]">{new Date(row.periodOfPerformanceCurrentEndDate as string).toLocaleDateString()}</span> : '-' },
]

export default function SAMDataPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [data, setData] = useState<{ items: Record<string, unknown>[]; total: number }>({ items: [], total: 0 })
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false)
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filters, setFilters] = useState<SAMFilters>({ agency: '', amountMin: '', amountMax: '', dateStart: '', dateEnd: '', naicsSearch: '', status: '' })

  // Modal state
  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [complianceModalOpen, setComplianceModalOpen] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const debouncedSearch = useDebounce(search, 300)

  const buildParams = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), search: debouncedSearch, sortBy, sortOrder })
    if (filters.agency) params.set('agency', filters.agency)
    if (filters.amountMin) params.set('amountMin', filters.amountMin)
    if (filters.amountMax) params.set('amountMax', filters.amountMax)
    if (filters.dateStart) params.set('dateStart', filters.dateStart)
    if (filters.dateEnd) params.set('dateEnd', filters.dateEnd)
    if (filters.naicsSearch) params.set('naics', filters.naicsSearch)
    if (filters.status) params.set('status', filters.status)
    return params.toString()
  }, [page, debouncedSearch, sortBy, sortOrder, filters])

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const result = await api.get<Record<string, unknown>>(`/api/sam-data?${buildParams()}`)
      const items = (result.records || []) as Record<string, unknown>[]
      setData({ items, total: (result.total as number) || 0 })
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load SAM data') }
    finally { setLoading(false) }
  }, [buildParams])

  useEffect(() => { fetchData() }, [fetchData])

  const handleFiltersChange = useCallback((f: SAMFilters) => { setFilters(f); setPage(1) }, [])

  const selectedItems = data.items.filter(item => selectedIds.has(item.id as string))
  const selectedRecords = selectedItems as unknown as SAMRecord[]

  const handleExportCSV = async () => {
    setExporting(true)
    try {
      const result = await api.get<Record<string, unknown>>(`/api/sam-data/export?search=${encodeURIComponent(debouncedSearch)}&sortBy=${sortBy}&sortOrder=${sortOrder}`)
      const items = (result.records || []) as Record<string, unknown>[]
      const rows = items.map(csvRowMapper)
      const csv = [CSV_HEADERS, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `sam-data-${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(url)
      toast('success', `Exported ${items.length} SAM records to CSV`)
    } catch { toast('error', 'Failed to export CSV') }
    finally { setExporting(false) }
  }

  const handleExportSelected = async () => {
    setExporting(true)
    try {
      const rows = selectedItems.map(csvRowMapper)
      const csv = [CSV_HEADERS, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `sam-data-selected-${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(url)
      toast('success', `Exported ${selectedItems.length} selected records to CSV`)
    } catch { toast('error', 'Failed to export selected records') }
    finally { setExporting(false) }
  }

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; setImporting(true)
    try {
      const formData = new FormData(); formData.append('file', file)
      const res = await fetch('/api/sam-data/import', { method: 'POST', body: formData }); const result = await res.json()
      if (!res.ok) { toast('error', result.error || 'Import failed'); return }
      toast('success', `Imported ${result.imported} SAM records`); fetchData()
    } catch { toast('error', 'Import failed') }
    finally { setImporting(false); if (fileInputRef.current) fileInputRef.current.value = '' }
  }

  const handleBulkDelete = async () => {
    try {
      const res = await fetch('/api/sam-data/bulk-delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: Array.from(selectedIds) }) })
      const result = await res.json()
      if (!res.ok) { toast('error', result.error || 'Delete failed'); return }
      toast('success', `Deleted ${result.deleted} SAM records`); setSelectedIds(new Set()); setShowDeleteConfirm(false); fetchData()
    } catch { toast('error', 'Delete failed') }
  }

  const handleDeleteAll = async () => {
    try {
      const res = await fetch('/api/sam-data/bulk-delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deleteAll: true }) })
      const result = await res.json()
      if (!res.ok) { toast('error', result.error || 'Delete failed'); return }
      toast('success', `Deleted all ${result.deleted} SAM records`); setSelectedIds(new Set()); setShowDeleteAllConfirm(false); fetchData()
    } catch { toast('error', 'Delete failed') }
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === data.items.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(data.items.map(r => r.id as string)))
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const handleSort = (field: string) => {
    if (sortBy === field) setSortOrder(p => p === 'asc' ? 'desc' : 'asc')
    else { setSortBy(field); setSortOrder('asc') }
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(data.total / 20))

  const tableColumns = [
    {
      key: '_select', label: '',
      headerRender: () => (
        <button className="p-0.5" onClick={e => { e.stopPropagation(); toggleSelectAll() }}>
          {selectedIds.size === data.items.length && data.items.length > 0
            ? <CheckSquare size={16} className="text-[var(--primary)]" />
            : <Square size={16} className="text-[var(--text-muted)]" />}
        </button>
      ),
      render: (row: Record<string, unknown>) => (
        <button className="p-0.5" onClick={e => { e.stopPropagation(); toggleSelect(row.id as string) }}>
          {selectedIds.has(row.id as string)
            ? <CheckSquare size={16} className="text-[var(--primary)]" />
            : <Square size={16} className="text-[var(--text-muted)]" />}
        </button>
      ),
    },
    ...COLUMNS.map(col => ({
      key: col.key,
      label: col.label,
      headerRender: col.sortable ? () => (
        <button onClick={e => { e.stopPropagation(); handleSort(col.key) }} className="flex items-center gap-1 hover:text-[var(--primary)]">
          {col.label} <SortIcon sortBy={sortBy} sortOrder={sortOrder} field={col.key} />
        </button>
      ) : undefined,
      render: col.render || ((row: Record<string, unknown>) => <span className="text-[12px]">{String(row[col.key] ?? '-')}</span>),
    })),
    {
      key: 'actions', label: '',
      render: (row: Record<string, unknown>) => (
        <Link href={`/sam-data/${row.id}`} className="p-1 hover:bg-[var(--content-bg)] rounded" onClick={e => e.stopPropagation()}>
          <Eye size={16} className="text-[var(--text-muted)]" />
        </Link>
      )
    },
  ]

  return (
    <div>
      <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />

      <PageHeader title="SAM Data" subtitle={`${data.total} SAM records`} actions={
        <div className="flex gap-2">
          <button onClick={() => setTransferModalOpen(true)} disabled={data.total === 0}
            className="flex items-center gap-2 matdash-btn matdash-btn-outline px-3 py-1.5 rounded-md text-[11px] disabled:opacity-50 transition-colors">
            <ArrowRightLeft size={16} /> Transfer
          </button>
          <button onClick={handleExportCSV} disabled={exporting || data.total === 0}
            className="flex items-center gap-2 matdash-btn matdash-btn-outline px-3 py-1.5 rounded-md text-[11px] disabled:opacity-50 transition-colors">
            <FileSpreadsheet size={16} /> {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
          <Link href="/sam-data/new" className="flex items-center gap-2 matdash-btn matdash-btn-primary px-3 py-1.5 rounded-md text-[11px] transition-colors">
            <Plus size={16} /> Add SAM Record
          </Link>
        </div>
      } />

      <Suspense fallback={null}>
        <FilterPanel onFiltersChange={handleFiltersChange} />
      </Suspense>

      <BulkActions
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onExportSelected={handleExportSelected}
        onDeleteSelected={() => setShowDeleteConfirm(true)}
        onTransferSelected={() => setTransferModalOpen(true)}
        onEmailSelected={() => setEmailModalOpen(true)}
        entityName="SAM records"
      />

      <div className="mb-3">
        <div className="flex items-center gap-2">
          <div className="relative w-72 shrink-0">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input type="text" placeholder="Search SAM data..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-9 pr-3 py-2 border border-[var(--border-color)] rounded-md text-[12px] bg-[var(--content-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30" />
          </div>
          <button onClick={() => fileInputRef.current?.click()} disabled={importing}
            className="flex items-center gap-2 matdash-btn matdash-btn-success px-4 py-2 rounded-md text-[12px] font-medium disabled:opacity-50 transition-colors shadow-sm">
            {importing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Import CSV
          </button>
          <div className="ml-auto">
            <button onClick={() => selectedIds.size > 0 ? setShowDeleteConfirm(true) : setShowDeleteAllConfirm(true)} disabled={data.total === 0}
              className="flex items-center gap-2 matdash-btn matdash-btn-danger px-4 py-2 rounded-md text-[12px] font-medium disabled:opacity-50 transition-colors shadow-sm">
              <Trash2 size={16} /> {selectedIds.size > 0 ? `Delete Selected (${selectedIds.size})` : 'Delete All'}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="bg-red-500/10 text-[var(--danger)] p-2 rounded-md text-[11px] mb-3 border border-red-500/20">{error}</div>}

      {loading ? <TableSkeleton rows={5} cols={COLUMNS.length + 1} /> : (
        <>
          <DataTable columns={tableColumns} data={data.items} onRowClick={row => router.push(`/sam-data/${row.id}`)} />

          <div className="flex items-center justify-between mt-4 text-[11px] text-[var(--text-muted)]">
            <span className="font-medium">Showing {data.items.length} of {data.total} records</span>
            <div className="flex items-center gap-2">
              <span>Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 border border-[var(--border-color)] rounded disabled:opacity-50 hover:bg-[var(--content-bg)] transition-colors">Previous</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}
                className="px-3 py-1 border border-[var(--border-color)] rounded disabled:opacity-50 hover:bg-[var(--content-bg)] transition-colors">Next</button>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={handleBulkDelete}
        title="Delete Selected SAM Records" message={`Are you sure you want to delete ${selectedIds.size} selected SAM records? This action cannot be undone.`} />
      <ConfirmDialog open={showDeleteAllConfirm} onClose={() => setShowDeleteAllConfirm(false)} onConfirm={handleDeleteAll}
        title="Delete All SAM Records" message={`Are you sure you want to delete ALL ${data.total} SAM records? This action cannot be undone.`} />

      <TransferModal
        open={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        records={selectedRecords}
        onComplete={() => { setSelectedIds(new Set()); fetchData() }}
      />

      <EmailModal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        records={selectedRecords}
        mode={selectedIds.size > 1 ? 'bulk' : 'quick'}
        onComplete={() => fetchData()}
      />

      <ComplianceModal
        open={complianceModalOpen}
        onClose={() => setComplianceModalOpen(false)}
        records={selectedRecords}
        onComplete={() => { setSelectedIds(new Set()); fetchData() }}
      />
    </div>
  )
}
