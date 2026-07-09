'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import { DataTable, ConfirmDialog, Modal } from '@/components/ui'
import { BulkActions } from './bulk-actions'
import { Plus, Search, Eye, Upload, Trash2, CheckSquare, Square, FileSpreadsheet, Loader2, ArrowRightLeft } from 'lucide-react'
import { SortIcon } from '@/components/sort-icon'
import Link from 'next/link'
import { useDebounce } from '@/hooks/use-debounce'
import { useToast } from '@/components/toast'
import { TableSkeleton } from '@/components/skeleton'
import { api } from '@/lib/api-client'
import { EntityColumn, EntityFilter, EntityListConfig } from '@/components/entity-list-page'
import { EmailModal } from './email-modal'
import type { SAMRecord } from '@/lib/sam-email'

export type { EntityColumn, EntityFilter, EntityListConfig }

interface SAMDataListProps {
  config: EntityListConfig
}

export function SAMDataList({ config }: SAMDataListProps) {
  const { entityName, endpoint, responseKey, columns, csvHeaders, csvRowMapper, searchPlaceholder, addHref, addLabel, cols, filters } = config
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
  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [transferTarget, setTransferTarget] = useState('')
  const [transferEntity, setTransferEntity] = useState<'contract' | 'outreach' | 'compliance'>('contract')
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterValues, setFilterValues] = useState<Record<string, string>>(() =>
    Object.fromEntries((filters || []).map(f => [f.param, 'All']))
  )
  const fileInputRef = useRef<HTMLInputElement>(null)
  const debouncedSearch = useDebounce(search, 300)

  const buildParams = useCallback((overrides?: Record<string, string>) => {
    const params = new URLSearchParams({ page: String(page), search: debouncedSearch, sortBy, sortOrder })
    for (const f of filters || []) {
      const val = overrides?.[f.param] ?? filterValues[f.param]
      if (val && val !== 'All') params.set(f.param, val)
    }
    return params.toString()
  }, [page, debouncedSearch, sortBy, sortOrder, filters, filterValues])

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const result = await api.get<Record<string, unknown>>(`${endpoint}?${buildParams()}`)
      const items = (result[responseKey] || []) as Record<string, unknown>[]
      setData({ items, total: (result.total as number) || 0 })
    } catch (err) { setError(err instanceof Error ? err.message : `Failed to load ${entityName.toLowerCase()}`) }
    finally { setLoading(false) }
  }, [endpoint, responseKey, entityName, buildParams])

  useEffect(() => { fetchData() }, [fetchData])

  const handleExportCSV = async () => {
    setExporting(true)
    try {
      const result = await api.get<Record<string, unknown>>(`${endpoint}/export?search=${encodeURIComponent(debouncedSearch)}&sortBy=${sortBy}&sortOrder=${sortOrder}${(filters || []).map(f => { const v = filterValues[f.param]; return v && v !== 'All' ? `&${f.param}=${encodeURIComponent(v)}` : '' }).join('')}`)
      const items = (result[responseKey] || []) as Record<string, unknown>[]
      const rows = items.map(csvRowMapper)
      const csv = [csvHeaders, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${entityName.toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(url)
      toast('success', `Exported ${items.length} ${entityName.toLowerCase()} to CSV`)
    } catch { toast('error', 'Failed to export CSV') }
    finally { setExporting(false) }
  }

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; setImporting(true)
    try {
      const formData = new FormData(); formData.append('file', file)
      const res = await fetch(`${endpoint}/import`, { method: 'POST', body: formData }); const result = await res.json()
      if (!res.ok) { toast('error', result.error || 'Import failed'); return }
      toast('success', `Imported ${result.imported} ${entityName.toLowerCase()}`); fetchData()
    } catch { toast('error', 'Import failed') }
    finally { setImporting(false); if (fileInputRef.current) fileInputRef.current.value = '' }
  }

  const handleBulkDelete = async () => {
    try {
      const res = await fetch(`${endpoint}/bulk-delete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: Array.from(selectedIds) }) })
      const result = await res.json()
      if (!res.ok) { toast('error', result.error || 'Delete failed'); return }
      toast('success', `Deleted ${result.deleted} ${entityName.toLowerCase()}`); setSelectedIds(new Set()); setShowDeleteConfirm(false); fetchData()
    } catch { toast('error', 'Delete failed') }
  }

  const handleDeleteAll = async () => {
    try {
      const res = await fetch(`${endpoint}/bulk-delete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deleteAll: true }) })
      const result = await res.json()
      if (!res.ok) { toast('error', result.error || 'Delete failed'); return }
      toast('success', `Deleted all ${result.deleted} ${entityName.toLowerCase()}`); setSelectedIds(new Set()); setShowDeleteAllConfirm(false); fetchData()
    } catch { toast('error', 'Delete failed') }
  }

  const handleExportSelected = async () => {
    setExporting(true)
    try {
      const selectedItems = data.items.filter(item => selectedIds.has(item.id as string))
      const rows = selectedItems.map(csvRowMapper)
      const csv = [csvHeaders, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${entityName.toLowerCase()}-selected-${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(url)
      toast('success', `Exported ${selectedItems.length} selected ${entityName.toLowerCase()} to CSV`)
    } catch { toast('error', 'Failed to export selected records') }
    finally { setExporting(false) }
  }

  const handleTransfer = async () => {
    if (!transferTarget.trim()) {
      toast('error', 'Please select or enter a target')
      return
    }
    try {
      const endpoints: Record<string, string> = {
        contract: '/api/contracts',
        outreach: '/api/outreach',
        compliance: '/api/compliance',
      }
      const selectedItems = data.items.filter(item => selectedIds.has(item.id as string))
      for (const item of selectedItems) {
        const body: Record<string, unknown> = {
          notes: `Linked from SAM Record: ${item.awardIdPiid} - ${item.recipientName}`,
          samDataId: item.id,
        }
        if (transferEntity === 'contract') {
          body.title = `Contract from ${item.awardIdPiid}`
          body.contractorId = transferTarget
        } else if (transferEntity === 'outreach') {
          body.contractorId = transferTarget
          body.subject = `Outreach for ${item.awardIdPiid}`
        } else {
          body.contractorId = transferTarget
          body.type = 'SAM Record Transfer'
          body.requirement = `Compliance from ${item.awardIdPiid}`
        }
        await api.post(endpoints[transferEntity], body)
      }
      toast('success', `Transferred ${selectedItems.length} records to ${transferEntity}`)
      setTransferModalOpen(false)
      setTransferTarget('')
      setSelectedIds(new Set())
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Transfer failed')
    }
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

  const clearSelection = () => setSelectedIds(new Set())

  const handleSort = (field: string) => {
    if (sortBy === field) setSortOrder(p => p === 'asc' ? 'desc' : 'asc')
    else { setSortBy(field); setSortOrder('asc') }
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(data.total / 20))
  const colCount = cols || columns.length + 1

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
    ...columns.map(col => ({
      key: col.key,
      label: col.label,
      headerRender: col.sortable ? () => (
        <button onClick={e => { e.stopPropagation(); handleSort(col.sortField || col.key) }} className="flex items-center gap-1 hover:text-[var(--primary)]">
          {col.label} <SortIcon sortBy={sortBy} sortOrder={sortOrder} field={col.sortField || col.key} />
        </button>
      ) : undefined,
      render: col.render || ((row: Record<string, unknown>) => <span className="text-[12px]">{String(row[col.key] ?? '-')}</span>),
    })),
    {
      key: 'actions', label: '',
      render: (row: Record<string, unknown>) => (
        <Link href={`${endpoint.replace('/api', '')}/${row.id}`} className="p-1 hover:bg-[var(--content-bg)] rounded" onClick={e => e.stopPropagation()}>
          <Eye size={16} className="text-[var(--text-muted)]" />
        </Link>
      )
    },
  ]

  return (
    <div>
      <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />

      <PageHeader title={entityName} subtitle={`${data.total} ${entityName.toLowerCase()}`} actions={
        <div className="flex gap-2">
          <button onClick={handleExportCSV} disabled={exporting || data.total === 0}
            className="flex items-center gap-2 matdash-btn matdash-btn-outline px-3 py-1.5 rounded-md text-[11px] disabled:opacity-50 transition-colors">
            <FileSpreadsheet size={16} /> {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
          {addHref && (
            <Link href={addHref} className="flex items-center gap-2 matdash-btn matdash-btn-primary px-3 py-1.5 rounded-md text-[11px] transition-colors">
              <Plus size={16} /> {addLabel || `Add ${entityName}`}
            </Link>
          )}
        </div>
      } />

      {/* Bulk Action Toolbar */}
      <BulkActions
        selectedCount={selectedIds.size}
        onClearSelection={clearSelection}
        onExportSelected={handleExportSelected}
        onDeleteSelected={() => setShowDeleteConfirm(true)}
        onTransferSelected={() => setTransferModalOpen(true)}
        onEmailSelected={() => setEmailModalOpen(true)}
        entityName={entityName.toLowerCase()}
      />

      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="relative w-72 shrink-0">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input type="text" placeholder={searchPlaceholder || `Search ${entityName.toLowerCase()}...`} value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-9 pr-3 py-2 border border-[var(--border-color)] rounded-md text-[12px] bg-[var(--content-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30" />
          </div>
          {(filters || []).map(f => (
            <select key={f.param} value={filterValues[f.param] || 'All'}
              onChange={e => { setFilterValues(prev => ({ ...prev, [f.param]: e.target.value })); setPage(1) }}
              className="px-3 py-2 border border-[var(--border-color)] rounded-md text-[12px] bg-[var(--content-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30">
              {f.options.map(o => <option key={o} value={o}>{o === 'All' ? `All ${f.label}` : o}</option>)}
            </select>
          ))}
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

      {loading ? <TableSkeleton rows={5} cols={colCount} /> : (
        <>
          <DataTable columns={tableColumns} data={data.items} onRowClick={row => router.push(`${endpoint.replace('/api', '')}/${row.id}`)} />

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
        title={`Delete Selected ${entityName}`} message={`Are you sure you want to delete ${selectedIds.size} selected ${entityName.toLowerCase()}? This action cannot be undone.`} />
      <ConfirmDialog open={showDeleteAllConfirm} onClose={() => setShowDeleteAllConfirm(false)} onConfirm={handleDeleteAll}
        title={`Delete All ${entityName}`} message={`Are you sure you want to delete ALL ${data.total} ${entityName.toLowerCase()}? This action cannot be undone.`} />

      <Modal open={transferModalOpen} onClose={() => setTransferModalOpen(false)} title="Transfer SAM Records">
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Transfer to entity type</label>
            <select value={transferEntity} onChange={e => setTransferEntity(e.target.value as typeof transferEntity)}
              className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[13px] bg-[var(--card-bg)] text-[var(--text-primary)]">
              <option value="contract">Contract</option>
              <option value="outreach">Outreach</option>
              <option value="compliance">Compliance</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Contractor ID</label>
            <input type="text" value={transferTarget} onChange={e => setTransferTarget(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[13px] bg-[var(--card-bg)] text-[var(--text-primary)]"
              placeholder="Enter contractor ID" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setTransferModalOpen(false)} className="matdash-btn matdash-btn-outline text-[12px]">Cancel</button>
            <button onClick={handleTransfer} className="matdash-btn matdash-btn-primary text-[12px]">
              <ArrowRightLeft size={14} className="inline mr-1" /> Transfer
            </button>
          </div>
        </div>
      </Modal>

      <EmailModal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        records={data.items.filter(item => selectedIds.has(item.id as string)) as unknown as SAMRecord[]}
        mode={selectedIds.size > 1 ? 'bulk' : 'quick'}
        onComplete={() => { fetchData() }}
      />
    </div>
  )
}
