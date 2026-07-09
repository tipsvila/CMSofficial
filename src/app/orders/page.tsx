'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import { DataTable, Badge, ConfirmDialog } from '@/components/ui'
import { Search, Eye, Upload, Trash2, CheckSquare, Square, FileSpreadsheet, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { SortIcon } from '@/components/sort-icon'
import { useDebounce } from '@/hooks/use-debounce'
import { useToast } from '@/components/toast'
import { TableSkeleton } from '@/components/skeleton'
import { api } from '@/lib/api-client'

interface Order {
  id: string; orderNumber: string; rfqId: string; quoteId: string; contractorId: string;
  status: string; totalAmount: number; paymentStatus: string; createdAt: string;
  contractor?: { id: string; name: string }
}

interface OrdersResponse { orders: Order[]; total: number; page: number; limit: number }

const STATUS_BADGE: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  Pending: 'warning', Processing: 'info', Shipped: 'info', Delivered: 'success', Completed: 'success', Cancelled: 'danger',
}

export default function OrdersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [data, setData] = useState<{ orders: Order[]; total: number }>({ orders: [], total: 0 })
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false)
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const debouncedSearch = useDebounce(search, 300)

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const result = await api.get<OrdersResponse>(`/api/orders?page=${page}&search=${encodeURIComponent(debouncedSearch)}&sortBy=${sortBy}&sortOrder=${sortOrder}`)
      setData({ orders: result.orders || [], total: result.total || 0 })
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load orders') }
    finally { setLoading(false) }
  }, [page, debouncedSearch, sortBy, sortOrder])

  useEffect(() => { fetchData() }, [fetchData])

  const handleExportCSV = async () => {
    setExporting(true)
    try {
      const result = await api.get<OrdersResponse>(`/api/orders/export?search=${encodeURIComponent(debouncedSearch)}&sortBy=${sortBy}&sortOrder=${sortOrder}`)
      const orders = result.orders as unknown as Record<string, unknown>[]
      const headers = ['Order #', 'Status', 'Amount', 'Payment', 'Company', 'Created']
      const rows = orders.map(o => [o.orderNumber || '', o.status || '', o.totalAmount || 0, o.paymentStatus || '', (o.contractor as Record<string, unknown>)?.name || '', o.createdAt || ''])
      const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(url)
      toast('success', `Exported ${orders.length} orders`)
    } catch { toast('error', 'Failed to export') }
    finally { setExporting(false) }
  }

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; setImporting(true)
    try {
      const formData = new FormData(); formData.append('file', file)
      const res = await fetch('/api/orders/import', { method: 'POST', body: formData }); const result = await res.json()
      if (!res.ok) { toast('error', result.error || 'Import failed'); return }
      toast('success', `Imported ${result.imported} orders`); fetchData()
    } catch { toast('error', 'Import failed') }
    finally { setImporting(false); if (fileInputRef.current) fileInputRef.current.value = '' }
  }

  const handleBulkDelete = async () => {
    try {
      const res = await fetch('/api/orders/bulk-delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: Array.from(selectedIds) }) })
      const result = await res.json()
      if (!res.ok) { toast('error', result.error || 'Delete failed'); return }
      toast('success', `Deleted ${result.deleted} orders`); setSelectedIds(new Set()); setShowDeleteConfirm(false); fetchData()
    } catch { toast('error', 'Delete failed') }
  }

  const handleDeleteAll = async () => {
    try {
      const res = await fetch('/api/orders/bulk-delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deleteAll: true }) })
      const result = await res.json()
      if (!res.ok) { toast('error', result.error || 'Delete failed'); return }
      toast('success', `Deleted all ${result.deleted} orders`); setSelectedIds(new Set()); setShowDeleteAllConfirm(false); fetchData()
    } catch { toast('error', 'Delete failed') }
  }

  const toggleSelectAll = () => { if (selectedIds.size === data.orders.length) setSelectedIds(new Set()); else setSelectedIds(new Set(data.orders.map(r => r.id))) }
  const toggleSelect = (id: string) => { setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next }) }
  const handleSort = (field: string) => { if (sortBy === field) setSortOrder(p => p === 'asc' ? 'desc' : 'asc'); else { setSortBy(field); setSortOrder('asc') }; setPage(1) }

  const totalPages = Math.max(1, Math.ceil(data.total / 20))

  return (
    <div>
      <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
      <PageHeader title="Orders" subtitle={`${data.total} orders`} actions={
        <div className="flex gap-2">
          <button onClick={handleExportCSV} disabled={exporting || data.total === 0}
            className="flex items-center gap-2 matdash-btn matdash-btn-outline px-3 py-1.5 rounded-md text-[11px] disabled:opacity-50 transition-colors">
            <FileSpreadsheet size={16} /> {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
          <button onClick={() => fileInputRef.current?.click()} disabled={importing}
            className="flex items-center gap-2 matdash-btn matdash-btn-success px-4 py-2 rounded-md text-[12px] font-medium disabled:opacity-50 transition-colors shadow-sm">
            {importing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Import CSV
          </button>
        </div>
      } />

      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="relative w-72 shrink-0">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input type="text" placeholder="Search orders..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
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

      {loading ? <TableSkeleton rows={5} cols={6} /> : (
        <>
          <DataTable columns={[
            { key: '_select', label: '', headerRender: () => <button className="p-0.5" onClick={e => { e.stopPropagation(); toggleSelectAll() }}>{selectedIds.size === data.orders.length && data.orders.length > 0 ? <CheckSquare size={16} className="text-[var(--primary)]" /> : <Square size={16} className="text-[var(--text-muted)]" />}</button>, render: row => <button className="p-0.5" onClick={e => { e.stopPropagation(); toggleSelect(row.id as string) }}>{selectedIds.has(row.id as string) ? <CheckSquare size={16} className="text-[var(--primary)]" /> : <Square size={16} className="text-[var(--text-muted)]" />}</button> },
            { key: 'orderNumber', label: 'Order #', headerRender: () => <button onClick={e => { e.stopPropagation(); handleSort('orderNumber') }} className="flex items-center gap-1 hover:text-[var(--primary)]">Order # <SortIcon sortBy={sortBy} sortOrder={sortOrder} field="orderNumber" /></button>, render: row => <span className="font-bold text-[var(--text-primary)] text-[12px]">{String(row.orderNumber || '')}</span> },
            { key: 'company', label: 'Company', render: row => <span className="text-[12px]">{String((row.contractor as Record<string, unknown>)?.name || '-')}</span> },
            { key: 'status', label: 'Status', headerRender: () => <button onClick={e => { e.stopPropagation(); handleSort('status') }} className="flex items-center gap-1 hover:text-[var(--primary)]">Status <SortIcon sortBy={sortBy} sortOrder={sortOrder} field="status" /></button>, render: row => <Badge variant={STATUS_BADGE[row.status as string] || 'default'}>{String(row.status || '')}</Badge> },
            { key: 'totalAmount', label: 'Amount', headerRender: () => <button onClick={e => { e.stopPropagation(); handleSort('totalAmount') }} className="flex items-center gap-1 hover:text-[var(--primary)]">Amount <SortIcon sortBy={sortBy} sortOrder={sortOrder} field="totalAmount" /></button>, render: row => <span className="text-[12px] font-medium">${Number(row.totalAmount || 0).toLocaleString()}</span> },
            { key: 'paymentStatus', label: 'Payment', render: row => <Badge variant={row.paymentStatus === 'Paid' ? 'success' : row.paymentStatus === 'Unpaid' ? 'warning' : 'default'}>{String(row.paymentStatus || '')}</Badge> },
            { key: 'actions', label: '', render: row => <Link href={`/orders/${row.id}`} className="p-1 hover:bg-[var(--content-bg)] rounded" onClick={e => e.stopPropagation()}><Eye size={16} className="text-[var(--text-muted)]" /></Link> },
          ]} data={data.orders as unknown as Record<string, unknown>[]} onRowClick={row => router.push(`/orders/${row.id}`)} />

          <div className="flex items-center justify-between mt-4 text-[11px] text-[var(--text-muted)]">
            <span className="font-medium">Showing {data.orders.length} of {data.total} records</span>
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
        title="Delete Selected Orders" message={`Are you sure you want to delete ${selectedIds.size} selected order(s)? This action cannot be undone.`} />
      <ConfirmDialog open={showDeleteAllConfirm} onClose={() => setShowDeleteAllConfirm(false)} onConfirm={handleDeleteAll}
        title="Delete All Orders" message={`Are you sure you want to delete ALL ${data.total} orders? This action cannot be undone.`} />
    </div>
  )
}
