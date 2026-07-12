'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import { DataTable, ConfirmDialog } from '@/components/ui'
import { FilterPanel } from '@/components/sam-data/filter-panel'
import { BulkActions } from '@/components/sam-data/bulk-actions'
import { TransferModal } from '@/components/sam-data/transfer-modal'
import { EmailModal } from '@/components/sam-data/email-modal'
import { ComplianceModal } from '@/components/sam-data/compliance-modal'
import { Plus, Search, Eye, Upload, Trash2, CheckSquare, Square, FileSpreadsheet, Loader2, ArrowRightLeft } from 'lucide-react'
import { SortIcon } from '@/components/sort-icon'
import Link from 'next/link'
import { useToast } from '@/components/toast'
import { TableSkeleton } from '@/components/skeleton'
import { useSAMData } from '@/hooks/use-sam-data'
import { useSAMExport } from '@/hooks/use-sam-export'
import { useSAMSelection } from '@/hooks/use-sam-selection'
import { useCSVImport } from '@/hooks/use-csv-import'
import { ImportProgress } from '@/components/sam-data/import-progress'
import type { SAMRecord } from '@/lib/sam-email'

const COLUMNS = [
  { key: 'awardIdPiid', label: 'Award ID/PIID', sortable: true, render: (row: SAMRecord) => <span className="font-mono text-[12px] font-bold">{String(row.awardIdPiid || '')}</span> },
  { key: 'recipientName', label: 'Recipient', sortable: true },
  { key: 'totalObligatedAmount', label: 'Amount', sortable: true, render: (row: SAMRecord) => row.totalObligatedAmount != null ? <span className="text-[12px]">${Number(row.totalObligatedAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> : <span className="text-[12px] text-[var(--text-muted)]">-</span> },
  { key: 'awardingAgencyName', label: 'Agency', sortable: true, render: (row: SAMRecord) => <span className="text-[12px]">{String(row.awardingAgencyName || '-')}</span> },
  { key: 'naicsDescription', label: 'NAICS', render: (row: SAMRecord) => <span className="text-[12px] text-[var(--text-muted)] max-w-[200px] truncate block">{String(row.naicsDescription || '-')}</span> },
  { key: 'periodOfPerformanceCurrentEndDate', label: 'End Date', sortable: true, render: (row: SAMRecord) => row.periodOfPerformanceCurrentEndDate ? <span className="text-[12px]">{new Date(row.periodOfPerformanceCurrentEndDate).toLocaleDateString()}</span> : '-' },
]

export default function SAMDataPage() {
  const router = useRouter()
  const { toast } = useToast()

  const {
    data, loading, error, page, search, sortBy, sortOrder, debouncedSearch,
    setPage, setSearch, handleSort, handleFiltersChange, fetchData,
  } = useSAMData()

  const {
    exporting, handleExportCSV, handleExportSelected,
  } = useSAMExport()

  const {
    selectedIds, toggleSelect, toggleSelectAll, clearSelection,
    selectedItems, selectedRecords,
  } = useSAMSelection(data.items)

  const { progress, importCSV, cancel: cancelImport, reset: resetImport } = useCSVImport()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false)

  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [complianceModalOpen, setComplianceModalOpen] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchData() }, [fetchData])

  const totalPages = useMemo(() => Math.max(1, Math.ceil(data.total / 20)), [data.total])

  const handleImportCSV = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    if (fileInputRef.current) fileInputRef.current.value = ''
    const result = await importCSV('/api/sam-data/import', file)
    if ('done' in result && result.done) {
      toast('success', `Imported ${result.imported.toLocaleString()} SAM records`)
      fetchData()
    } else if ('error' in result && result.error !== 'cancelled') {
      toast('error', result.error)
    }
  }, [importCSV, fetchData, toast])

  const handleBulkDelete = useCallback(async () => {
    try {
      const res = await fetch('/api/sam-data/bulk-delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: Array.from(selectedIds) }) })
      const result = await res.json()
      if (!res.ok) { toast('error', result.error || 'Delete failed'); return }
      toast('success', `Deleted ${result.deleted} SAM records`); clearSelection(); setShowDeleteConfirm(false); fetchData()
    } catch { toast('error', 'Delete failed') }
  }, [selectedIds, clearSelection, fetchData, toast])

  const handleDeleteAll = useCallback(async () => {
    try {
      const res = await fetch('/api/sam-data/bulk-delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deleteAll: true }) })
      const result = await res.json()
      if (!res.ok) { toast('error', result.error || 'Delete failed'); return }
      toast('success', `Deleted all ${result.deleted} SAM records`); clearSelection(); setShowDeleteAllConfirm(false); fetchData()
    } catch { toast('error', 'Delete failed') }
  }, [clearSelection, fetchData, toast])

  const tableColumns = useMemo(() => [
    {
      key: '_select', label: '',
      headerRender: () => (
        <button className="p-0.5" onClick={e => { e.stopPropagation(); toggleSelectAll(data.items.map(r => r.id)) }}>
          {selectedIds.size === data.items.length && data.items.length > 0
            ? <CheckSquare size={16} className="text-[var(--primary)]" />
            : <Square size={16} className="text-[var(--text-muted)]" />}
        </button>
      ),
      render: (row: SAMRecord) => (
        <button className="p-0.5" onClick={e => { e.stopPropagation(); toggleSelect(row.id) }}>
          {selectedIds.has(row.id)
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
      render: col.render || ((row: SAMRecord) => <span className="text-[12px]">{String((row as unknown as Record<string, unknown>)[col.key] ?? '-')}</span>),
    })),
    {
      key: 'actions', label: '',
      render: (row: SAMRecord) => (
        <Link href={`/sam-data/${row.id}`} className="p-1 hover:bg-[var(--content-bg)] rounded" onClick={e => e.stopPropagation()}>
          <Eye size={16} className="text-[var(--text-muted)]" />
        </Link>
      )
    },
  ], [toggleSelectAll, toggleSelect, handleSort, selectedIds, data.items, sortBy, sortOrder])

  const handleRowClick = useCallback((row: unknown) => {
    router.push(`/sam-data/${(row as SAMRecord).id}`)
  }, [router])

  return (
    <div>
      <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />

      <PageHeader title="SAM Data" subtitle={`${data.total} SAM records`} actions={
        <div className="flex gap-2">
          <button onClick={() => setTransferModalOpen(true)} disabled={data.total === 0}
            className="flex items-center gap-2 matdash-btn matdash-btn-outline px-3 py-1.5 rounded-md text-[11px] disabled:opacity-50 transition-colors">
            <ArrowRightLeft size={16} /> Transfer {selectedIds.size > 0 ? `(${selectedIds.size})` : 'All'}
          </button>
          <button onClick={() => handleExportCSV(debouncedSearch, sortBy, sortOrder)} disabled={exporting || data.total === 0}
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
        onClearSelection={clearSelection}
        onExportSelected={() => handleExportSelected(selectedItems)}
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
          <button onClick={() => fileInputRef.current?.click()} disabled={progress.status === 'importing'}
            className="flex items-center gap-2 matdash-btn matdash-btn-success px-4 py-2 rounded-md text-[12px] font-medium disabled:opacity-50 transition-colors shadow-sm">
            {progress.status === 'importing' ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Import CSV
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

      <ImportProgress
        status={progress.status}
        imported={progress.imported}
        total={progress.total}
        percent={progress.percent}
        skipped={progress.skipped}
        error={progress.error}
        onCancel={cancelImport}
        onDismiss={resetImport}
      />

      {loading ? <TableSkeleton rows={5} cols={COLUMNS.length + 1} /> : (
        <>
          <DataTable columns={tableColumns as unknown as { key: string; label: string; headerRender?: () => React.ReactNode; render?: (row: unknown) => React.ReactNode }[]} data={data.items as unknown as Record<string, unknown>[]} onRowClick={handleRowClick} />

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
        records={selectedRecords.length > 0 ? selectedRecords : data.items}
        onComplete={() => { clearSelection(); fetchData() }}
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
        onComplete={() => { clearSelection(); fetchData() }}
      />
    </div>
  )
}
