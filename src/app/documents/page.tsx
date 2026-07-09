'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import { DataTable, Badge, ConfirmDialog } from '@/components/ui'
import { Plus, Search, Eye, Upload, Trash2, CheckSquare, Square, FileSpreadsheet, Loader2, FileText } from 'lucide-react'
import { SortIcon } from '@/components/sort-icon'
import { useDebounce } from '@/hooks/use-debounce'
import { useToast } from '@/components/toast'
import { TableSkeleton } from '@/components/skeleton'
import { api } from '@/lib/api-client'
import type { Document } from '@/lib/types'

interface DocumentsResponse {
  documents: (Document & { contractor?: { id: string; name: string } })[]
  total?: number
  page?: number
  limit?: number
}

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

function getFileTypeBadge(type: string | null | undefined): { variant: 'default' | 'success' | 'warning' | 'danger' | 'info'; label: string } {
  if (!type) return { variant: 'default', label: 'Unknown' }
  const t = type.toLowerCase()
  if (t.includes('pdf')) return { variant: 'danger', label: 'PDF' }
  if (t.includes('csv')) return { variant: 'success', label: 'CSV' }
  if (t.includes('xls') || t.includes('excel')) return { variant: 'success', label: 'Excel' }
  if (t.includes('doc') || t.includes('word')) return { variant: 'info', label: 'Word' }
  if (t.includes('image') || t.includes('png') || t.includes('jpg') || t.includes('jpeg')) return { variant: 'warning', label: 'Image' }
  return { variant: 'default', label: type }
}

export default function DocumentsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [data, setData] = useState<{ documents: (Document & { contractor?: { id: string; name: string } })[]; total: number }>({ documents: [], total: 0 })
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const debouncedSearch = useDebounce(search, 300)

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const result = await api.get<DocumentsResponse>(`/api/documents?page=${page}&search=${encodeURIComponent(debouncedSearch)}&sortBy=${sortBy}&sortOrder=${sortOrder}`)
      setData({ documents: result.documents || [], total: result.total || 0 })
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load documents') }
    finally { setLoading(false) }
  }, [page, debouncedSearch, sortBy, sortOrder])

  useEffect(() => { fetchData() }, [fetchData])

  const handleExportCSV = async () => {
    setExporting(true)
    try {
      const result = await api.get<DocumentsResponse>(`/api/documents/export?search=${encodeURIComponent(debouncedSearch)}&sortBy=${sortBy}&sortOrder=${sortOrder}`)
      const documents = result.documents as unknown as Record<string, unknown>[]
      const headers = ['File Name', 'Contractor', 'Type', 'Size', 'Uploaded']
      const rows = documents.map((d) => [d.fileName || '', (d.contractor as Record<string, unknown>)?.name || '', d.fileType || '', d.fileSize || '', d.createdAt || ''])
      const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `documents-${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(url)
      toast('success', `Exported ${documents.length} documents to CSV`)
    } catch { toast('error', 'Failed to export CSV') }
    finally { setExporting(false) }
  }

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; setImporting(true)
    try {
      const formData = new FormData(); formData.append('file', file)
      const res = await fetch('/api/documents/import', { method: 'POST', body: formData }); const result = await res.json()
      if (!res.ok) { toast('error', result.error || 'Import failed'); return }
      toast('success', `Imported ${result.imported} documents`); fetchData()
    } catch { toast('error', 'Import failed') }
    finally { setImporting(false); if (fileInputRef.current) fileInputRef.current.value = '' }
  }

  const handleBulkDelete = async () => {
    try {
      const res = await fetch('/api/documents/bulk-delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: Array.from(selectedIds) }) })
      const result = await res.json()
      if (!res.ok) { toast('error', result.error || 'Delete failed'); return }
      toast('success', `Deleted ${result.deleted} documents`); setSelectedIds(new Set()); setShowDeleteConfirm(false); fetchData()
    } catch { toast('error', 'Delete failed') }
  }

  const handleDeleteAll = async () => {
    try {
      const res = await fetch('/api/documents/bulk-delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deleteAll: true }) })
      const result = await res.json()
      if (!res.ok) { toast('error', result.error || 'Delete failed'); return }
      toast('success', `Deleted all ${result.deleted} documents`); setSelectedIds(new Set()); setShowDeleteAllConfirm(false); fetchData()
    } catch { toast('error', 'Delete failed') }
  }

  const toggleSelectAll = () => { if (selectedIds.size === data.documents.length) setSelectedIds(new Set()); else setSelectedIds(new Set(data.documents.map((r) => r.id as string))) }
  const toggleSelect = (id: string) => { setSelectedIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next }) }
  const handleSort = (field: string) => { if (sortBy === field) setSortOrder((p) => p === 'asc' ? 'desc' : 'asc'); else { setSortBy(field); setSortOrder('asc') }; setPage(1) }

  const totalPages = Math.max(1, Math.ceil(data.total / 20))

  const isEmpty = !loading && data.documents.length === 0 && !error

  return (
    <div>
      <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
      <PageHeader title="Documents" subtitle={`${data.total} documents`} actions={
        <div className="flex gap-2">
          <button onClick={handleExportCSV} disabled={exporting || data.total === 0}
            className="flex items-center gap-2 matdash-btn matdash-btn-outline px-3 py-1.5 rounded-md text-[11px] disabled:opacity-50 transition-colors">
            <FileSpreadsheet size={16} /> {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
          <button onClick={() => fileInputRef.current?.click()} disabled={importing}
            className="flex items-center gap-2 matdash-btn matdash-btn-primary px-3 py-1.5 rounded-md text-[11px] transition-colors">
            <Plus size={16} /> {importing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Import CSV
          </button>
        </div>
      } />

      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="relative w-72 shrink-0">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input type="text" placeholder="Search documents..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-9 pr-3 py-2 border border-[var(--border-color)] rounded-md text-[12px] bg-[var(--content-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30" />
          </div>
          <div className="ml-auto">
            <button onClick={() => selectedIds.size > 0 ? setShowDeleteConfirm(true) : setShowDeleteAllConfirm(true)} disabled={data.total === 0}
              className="flex items-center gap-2 matdash-btn matdash-btn-danger px-4 py-2 rounded-md text-[12px] font-medium disabled:opacity-50 transition-colors shadow-sm">
              <Trash2 size={16} /> {selectedIds.size > 0 ? `Delete Selected (${selectedIds.size})` : 'Delete All'}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="bg-red-500/10 text-[var(--danger)] p-2 rounded-md text-[11px] mb-3 border border-red-500/20">{error}</div>}

      {isEmpty ? (
        <div className="matdash-card p-12 text-center animate-fade-in">
          <FileText size={48} className="mx-auto text-[var(--text-muted)] mb-4" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">No documents found</h3>
          <p className="text-[13px] text-[var(--text-secondary)] mb-6">No documents have been uploaded yet. Import documents via CSV to get started.</p>
          <button onClick={() => fileInputRef.current?.click()} disabled={importing}
            className="inline-flex items-center gap-2 matdash-btn matdash-btn-primary px-4 py-2 rounded-md text-[12px] font-medium transition-colors">
            {importing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Import CSV
          </button>
        </div>
      ) : loading ? <TableSkeleton rows={5} cols={7} /> : (
        <>
          <DataTable columns={[
            { key: '_select', label: '', headerRender: () => <button className="p-0.5" onClick={(e) => { e.stopPropagation(); toggleSelectAll() }}>{selectedIds.size === data.documents.length && data.documents.length > 0 ? <CheckSquare size={16} className="text-[var(--primary)]" /> : <Square size={16} className="text-[var(--text-muted)]" />}</button>, render: (row) => <button className="p-0.5" onClick={(e) => { e.stopPropagation(); toggleSelect(row.id as string) }}>{selectedIds.has(row.id as string) ? <CheckSquare size={16} className="text-[var(--primary)]" /> : <Square size={16} className="text-[var(--text-muted)]" />}</button> },
            { key: 'fileName', label: 'File Name', headerRender: () => <button onClick={(e) => { e.stopPropagation(); handleSort('fileName') }} className="flex items-center gap-1 hover:text-[var(--primary)]">File Name <SortIcon sortBy={sortBy} sortOrder={sortOrder} field="fileName" /></button>, render: (row) => <div className="flex items-center gap-2"><FileText size={14} className="text-[var(--text-muted)] shrink-0" /><span className="font-medium text-[var(--text-primary)] text-[12px] truncate max-w-[200px]">{String(row.fileName || '-')}</span></div> },
            { key: 'contractor', label: 'Contractor', headerRender: () => <button onClick={(e) => { e.stopPropagation(); handleSort('name') }} className="flex items-center gap-1 hover:text-[var(--primary)]">Contractor <SortIcon sortBy={sortBy} sortOrder={sortOrder} field="name" /></button>, render: (row) => <span className="text-[12px]">{String((row.contractor as Record<string, unknown>)?.name || '-')}</span> },
            { key: 'fileType', label: 'Type', headerRender: () => <button onClick={(e) => { e.stopPropagation(); handleSort('fileType') }} className="flex items-center gap-1 hover:text-[var(--primary)]">Type <SortIcon sortBy={sortBy} sortOrder={sortOrder} field="fileType" /></button>, render: (row) => { const badge = getFileTypeBadge(row.fileType as string); return <Badge variant={badge.variant}>{badge.label}</Badge> } },
            { key: 'fileSize', label: 'Size', render: (row) => <span className="text-[11px] text-[var(--text-muted)]">{formatFileSize(row.fileSize as number)}</span> },
            { key: 'createdAt', label: 'Uploaded', headerRender: () => <button onClick={(e) => { e.stopPropagation(); handleSort('createdAt') }} className="flex items-center gap-1 hover:text-[var(--primary)]">Uploaded <SortIcon sortBy={sortBy} sortOrder={sortOrder} field="createdAt" /></button>, render: (row) => <span className="text-[11px] text-[var(--text-muted)]">{row.createdAt ? new Date(String(row.createdAt)).toLocaleDateString() : '-'}</span> },
            { key: 'actions', label: '', render: (row) => <button className="p-1 hover:bg-[var(--content-bg)] rounded" onClick={(e) => { e.stopPropagation(); router.push(`/documents/${row.id}`) }}><Eye size={16} className="text-[var(--text-muted)]" /></button> },
          ]} data={data.documents as unknown as Record<string, unknown>[]} onRowClick={(row) => router.push(`/documents/${row.id}`)} />

          <div className="flex items-center justify-between mt-4 text-[11px] text-[var(--text-muted)]">
            <span className="font-medium">Showing {data.documents.length} of {data.total} records</span>
            <div className="flex items-center gap-2">
              <span>Page {page} of {totalPages}</span>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 border border-[var(--border-color)] rounded disabled:opacity-50 hover:bg-[var(--content-bg)] transition-colors">Previous</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}
                className="px-3 py-1 border border-[var(--border-color)] rounded disabled:opacity-50 hover:bg-[var(--content-bg)] transition-colors">Next</button>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={handleBulkDelete}
        title="Delete Selected Documents" message={`Are you sure you want to delete ${selectedIds.size} selected document(s)? This action cannot be undone.`} />
      <ConfirmDialog open={showDeleteAllConfirm} onClose={() => setShowDeleteAllConfirm(false)} onConfirm={handleDeleteAll}
        title="Delete All Documents" message={`Are you sure you want to delete ALL ${data.total} documents? This action cannot be undone.`} />
    </div>
  )
}
