'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Database, Table, Search, ChevronLeft, ChevronRight, RefreshCw, Columns3, Key, Hash, ArrowUpDown, FileText, Play, Clock, Trash2, Copy } from 'lucide-react'

interface ColumnInfo {
  name: string
  type: string
  notnull: number
  pk: number
  dflt_value: string | null
}

interface TableInfo {
  name: string
  columns: ColumnInfo[]
  rowCount: number
}

interface QueryResult {
  columns: string[]
  rows: Record<string, unknown>[]
  total: number
}

interface IndexInfo {
  name: string
  unique: boolean
  columns: string[]
}

export default function DatabasePage() {
  const [tables, setTables] = useState<TableInfo[]>([])
  const [selectedTable, setSelectedTable] = useState<string>('')
  const [data, setData] = useState<QueryResult | null>(null)
  const [schema, setSchema] = useState<{ columns: ColumnInfo[]; indexes: IndexInfo[]; foreignKeys: unknown[] } | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'data' | 'schema' | 'query' | 'crud'>('data')
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM contractors LIMIT 10')
  const [queryResult, setQueryResult] = useState<{ columns: string[]; rows: Record<string, unknown>[]; rowCount: number; duration: string } | null>(null)
  const [queryError, setQueryError] = useState('')
  const [queryLoading, setQueryLoading] = useState(false)
  const [queryHistory, setQueryHistory] = useState<{ query: string; time: string; rowCount: number; duration: string }[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // CRUD state
  const [crudAction, setCrudAction] = useState<'create' | 'edit' | 'delete' | null>(null)
  const [crudFormData, setCrudFormData] = useState<Record<string, string>>({})
  const [crudEditRow, setCrudEditRow] = useState<Record<string, unknown> | null>(null)
  const [crudDeleteRow, setCrudDeleteRow] = useState<Record<string, unknown> | null>(null)

  const handleCrudCreate = async () => {
    try {
      const res = await fetch(`/api/${selectedTable}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(crudFormData) })
      const result = await res.json()
      if (!res.ok) { alert(result.error || 'Create failed'); return }
      setCrudAction(null); setCrudFormData({}); fetchData(selectedTable, 1, search)
    } catch { alert('Create failed') }
  }

  const handleCrudUpdate = async () => {
    if (!crudEditRow) return
    try {
      const res = await fetch(`/api/${selectedTable}/${crudEditRow.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(crudFormData) })
      const result = await res.json()
      if (!res.ok) { alert(result.error || 'Update failed'); return }
      setCrudAction(null); setCrudFormData({}); setCrudEditRow(null); fetchData(selectedTable, page, search)
    } catch { alert('Update failed') }
  }

  const handleCrudDelete = async () => {
    if (!crudDeleteRow) return
    try {
      const res = await fetch(`/api/${selectedTable}/${crudDeleteRow.id}`, { method: 'DELETE' })
      const result = await res.json()
      if (!res.ok) { alert(result.error || 'Delete failed'); return }
      setCrudAction(null); setCrudDeleteRow(null); fetchData(selectedTable, page, search)
    } catch { alert('Delete failed') }
  }

  const fetchTables = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/database?action=tables')
      const json = await res.json()
      if (json.success) setTables(json.data)
    } catch {}
    setLoading(false)
  }, [])

  const fetchData = useCallback(async (tableName: string, p: number, s: string) => {
    if (!tableName) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ table: tableName, page: String(p), pageSize: '50', action: 'query', search: s })
      const res = await fetch(`/api/database?${params}`)
      const json = await res.json()
      if (json.success) setData(json.data)
    } catch {}
    setLoading(false)
  }, [])

  const fetchSchema = useCallback(async (tableName: string) => {
    if (!tableName) return
    try {
      const res = await fetch(`/api/database?action=schema&table=${tableName}`)
      const json = await res.json()
      if (json.success) setSchema(json.data)
    } catch {}
  }, [])

  useEffect(() => { fetchTables() }, [fetchTables])

  useEffect(() => {
    if (selectedTable) {
      setPage(1)
      setSearch('')
      fetchData(selectedTable, 1, '')
      fetchSchema(selectedTable)
    }
  }, [selectedTable, fetchData, fetchSchema])

  useEffect(() => {
    if (selectedTable) fetchData(selectedTable, page, search)
    // search is intentionally excluded — triggered via handleSearch, not this effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedTable, fetchData])

  const handleSearch = () => {
    setPage(1)
    fetchData(selectedTable, 1, search)
  }

  const runQuery = async () => {
    if (!sqlQuery.trim()) return
    setQueryLoading(true)
    setQueryError('')
    setQueryResult(null)
    try {
      const res = await fetch('/api/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sqlQuery.trim() }),
      })
      const json = await res.json()
      if (json.success) {
        setQueryResult(json.data)
        setQueryHistory(prev => [
          { query: sqlQuery.trim(), time: new Date().toLocaleTimeString(), rowCount: json.data.rowCount, duration: json.data.duration },
          ...prev.slice(0, 49),
        ])
      } else {
        setQueryError(json.error || 'Query failed')
      }
    } catch {
      setQueryError('Network error — could not reach server')
    }
    setQueryLoading(false)
  }

  const presets = [
    { label: 'All Tables', query: "SELECT type, name FROM sqlite_master WHERE type='table' ORDER BY name" },
    { label: 'Table Counts', query: "SELECT name, (SELECT COUNT(*) FROM t) as cnt FROM (SELECT name FROM sqlite_master WHERE type='table') t" },
    { label: 'Contractors', query: 'SELECT id, name, contracting_tier, city, state FROM contractors WHERE is_active = 1 LIMIT 20' },
    { label: 'SAM Contracts', query: 'SELECT award_id_piid, recipient_name, total_obligated_amount, awarding_agency_name FROM SAM_Data LIMIT 20' },
    { label: 'Schema Info', query: "SELECT t.name as table_name, c.name as column_name, c.type, c.\"notnull\", c.pk FROM sqlite_master t JOIN pragma_table_info(t.name) c WHERE t.type='table' ORDER BY t.name, c.cid" },
  ]

  const insertPreset = (query: string) => {
    setSqlQuery(query)
    textareaRef.current?.focus()
  }

  const copyQuery = () => {
    navigator.clipboard.writeText(sqlQuery)
  }

  const totalPages = data ? Math.ceil(data.total / 50) : 0
  const totalRows = tables.reduce((sum, t) => sum + t.rowCount, 0)

  return (
    <div className="min-h-screen bg-[var(--content-bg)] p-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="stat-icon-box"><Database size={22} className="text-[var(--primary)]" /></div>
            <div>
              <h1 className="text-xl font-bold text-[var(--text-primary)]">Database Viewer</h1>
              <p className="text-xs text-[var(--text-muted)]">local.db — {tables.length} tables, {totalRows.toLocaleString()} total rows</p>
            </div>
          </div>
          <button onClick={fetchTables}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--primary-light)] text-[var(--primary)] text-sm font-medium hover:bg-[var(--primary)] hover:text-white transition-colors">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="flex gap-4 min-h-[calc(100vh-120px)]">
          {/* Table list sidebar */}
          <div className="w-64 shrink-0">
            <div className="matdash-card p-0 overflow-hidden">
              <div className="p-3 border-b border-[var(--border-color)]">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Tables</h3>
              </div>
              <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
                {tables.map((t) => (
                  <button key={t.name}
                    onClick={() => setSelectedTable(t.name)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors border-l-2 ${
                      selectedTable === t.name
                        ? 'bg-[var(--primary-light)] text-[var(--primary)] border-[var(--primary)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--content-bg)] border-transparent'
                    }`}>
                    <Table size={14} className="shrink-0" />
                    <span className="flex-1 truncate font-medium">{t.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--content-bg)] text-[var(--text-muted)] font-mono">
                      {t.rowCount}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {!selectedTable ? (
              <div className="matdash-card flex flex-col items-center justify-center h-96 text-center">
                <Database size={48} className="text-[var(--text-muted)] mb-4 opacity-40" />
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Select a Table</h3>
                <p className="text-sm text-[var(--text-muted)]">Choose a table from the sidebar to view its data</p>
              </div>
            ) : (
              <div className="matdash-card p-0 overflow-hidden">
                {/* Toolbar */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-[var(--text-primary)]">{selectedTable}</h2>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)] font-mono">
                      {data?.total || 0} rows
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--content-bg)] text-[var(--text-muted)] font-mono">
                      {schema?.columns.length || 0} cols
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setView('data')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === 'data' ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--content-bg)]'}`}>
                      <FileText size={12} className="inline mr-1" />Data
                    </button>
                    <button onClick={() => setView('schema')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === 'schema' ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--content-bg)]'}`}>
                      <Columns3 size={12} className="inline mr-1" />Schema
                    </button>
                    <button onClick={() => setView('query')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === 'query' ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--content-bg)]'}`}>
                      <Play size={12} className="inline mr-1" />Query
                    </button>
                    <button onClick={() => setView('crud')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === 'crud' ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--content-bg)]'}`}>
                      <Edit size={12} className="inline mr-1" />CRUD
                    </button>
                  </div>
                </div>

                {view === 'data' && (
                  <>
                    {/* Search */}
                    <div className="px-4 py-2 border-b border-[var(--border-color)] flex items-center gap-2">
                      <div className="relative flex-1 max-w-sm">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                        <input type="text" value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                          placeholder="Search across text columns..."
                          className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--content-bg)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                        />
                      </div>
                      <button onClick={handleSearch}
                        className="px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-medium hover:opacity-90 transition-opacity">
                        Search
                      </button>
                    </div>

                    {/* Table */}
                    <div className="overflow-auto max-h-[calc(100vh-280px)]">
                      {loading ? (
                        <div className="flex items-center justify-center h-40 text-[var(--text-muted)] text-sm">
                          <RefreshCw size={16} className="animate-spin mr-2" />Loading...
                        </div>
                      ) : data && data.rows.length > 0 ? (
                        <table className="w-full text-sm">
                          <thead className="sticky top-0 bg-[var(--card-bg)] border-b border-[var(--border-color)]">
                            <tr>
                              {data.columns.map((col) => (
                                <th key={col} className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] whitespace-nowrap">
                                  <span className="flex items-center gap-1">
                                    {schema?.columns.find(c => c.name === col)?.pk ? <Key size={10} className="text-yellow-500" /> : null}
                                    {col}
                                  </span>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--border-color)]">
                            {data.rows.map((row, i) => (
                              <tr key={i} className="hover:bg-[var(--content-bg)] transition-colors">
                                {data.columns.map((col) => (
                                  <td key={col} className="px-3 py-2 text-[var(--text-primary)] whitespace-nowrap max-w-[300px] truncate">
                                    <CellValue value={row[col]} />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-[var(--text-muted)]">
                          <Table size={24} className="mb-2 opacity-40" />
                          <p className="text-sm">No rows found</p>
                        </div>
                      )}
                    </div>

                    {/* Pagination */}
                    {data && data.total > 50 && (
                      <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--border-color)]">
                        <span className="text-xs text-[var(--text-muted)]">
                          Page {page} of {totalPages} ({data.total.toLocaleString()} rows)
                        </span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                            className="p-1.5 rounded-lg hover:bg-[var(--content-bg)] disabled:opacity-30 text-[var(--text-secondary)]">
                            <ChevronLeft size={16} />
                          </button>
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const p = page <= 3 ? i + 1 : page + i - 2
                            if (p < 1 || p > totalPages) return null
                            return (
                              <button key={p} onClick={() => setPage(p)}
                                className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${p === page ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--content-bg)]'}`}>
                                {p}
                              </button>
                            )
                          })}
                          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                            className="p-1.5 rounded-lg hover:bg-[var(--content-bg)] disabled:opacity-30 text-[var(--text-secondary)]">
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {view === 'query' && (
                  <div className="flex flex-col h-[calc(100vh-180px)]">
                    {/* SQL Editor */}
                    <div className="border-b border-[var(--border-color)]">
                      <div className="flex items-center justify-between px-4 py-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">SQL Query</span>
                        <div className="flex items-center gap-1">
                          <button onClick={copyQuery}
                            className="p-1.5 rounded hover:bg-[var(--content-bg)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                            title="Copy query">
                            <Copy size={13} />
                          </button>
                          <button onClick={() => { setSqlQuery(''); setQueryResult(null); setQueryError('') }}
                            className="p-1.5 rounded hover:bg-[var(--content-bg)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                            title="Clear">
                            <Trash2 size={13} />
                          </button>
                          <button onClick={runQuery} disabled={queryLoading || !sqlQuery.trim()}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-medium hover:opacity-90 disabled:opacity-40 transition-opacity">
                            <Play size={12} />
                            {queryLoading ? 'Running...' : 'Run'}
                          </button>
                        </div>
                      </div>
                      <div className="px-4 pb-3">
                        <textarea
                          ref={textareaRef}
                          value={sqlQuery}
                          onChange={(e) => setSqlQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                              e.preventDefault()
                              runQuery()
                            }
                          }}
                          placeholder="Enter SQL query... (Ctrl+Enter to run)"
                          spellCheck={false}
                          className="w-full h-32 px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--content-bg)] text-[var(--text-primary)] text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 placeholder:text-[var(--text-muted)]"
                        />
                      </div>
                      {/* Preset queries */}
                      <div className="px-4 pb-2 flex flex-wrap gap-1">
                        <span className="text-[10px] text-[var(--text-muted)] self-center mr-1">Presets:</span>
                        {presets.map((p) => (
                          <button key={p.label} onClick={() => insertPreset(p.query)}
                            className="px-2 py-0.5 rounded text-[10px] bg-[var(--content-bg)] text-[var(--text-secondary)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)] transition-colors">
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Results */}
                    <div className="flex-1 overflow-auto">
                      {queryError && (
                        <div className="m-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-mono">
                          {queryError}
                        </div>
                      )}
                      {queryResult && (
                        <div>
                          <div className="px-4 py-2 flex items-center gap-3 text-xs text-[var(--text-muted)] border-b border-[var(--border-color)]">
                            <span>{queryResult.rowCount} rows</span>
                            <span>{queryResult.duration}</span>
                            <span>{queryResult.columns.length} columns</span>
                          </div>
                          {queryResult.rows.length > 0 ? (
                            <table className="w-full text-sm">
                              <thead className="sticky top-0 bg-[var(--card-bg)] border-b border-[var(--border-color)]">
                                <tr>
                                  {queryResult.columns.map((col) => (
                                    <th key={col} className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] whitespace-nowrap">
                                      {col}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[var(--border-color)]">
                                {queryResult.rows.map((row, i) => (
                                  <tr key={i} className="hover:bg-[var(--content-bg)] transition-colors">
                                    {queryResult.columns.map((col) => (
                                      <td key={col} className="px-3 py-2 text-[var(--text-primary)] whitespace-nowrap max-w-[300px] truncate">
                                        <CellValue value={row[col]} />
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-32 text-[var(--text-muted)]">
                              <p className="text-sm">Query executed successfully — no rows returned</p>
                            </div>
                          )}
                        </div>
                      )}
                      {!queryResult && !queryError && !queryLoading && (
                        <div className="flex flex-col items-center justify-center h-40 text-[var(--text-muted)]">
                          <Play size={32} className="mb-3 opacity-30" />
                          <p className="text-sm">Write a query and press Run or Ctrl+Enter</p>
                          <p className="text-xs mt-1">Only SELECT, PRAGMA, and EXPLAIN queries are allowed</p>
                        </div>
                      )}
                    </div>

                    {/* Query History */}
                    {queryHistory.length > 0 && (
                      <div className="border-t border-[var(--border-color)]">
                        <div className="px-4 py-2 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                          <Clock size={12} />
                          <span className="font-semibold uppercase tracking-wider">History</span>
                          <span>({queryHistory.length})</span>
                        </div>
                        <div className="max-h-32 overflow-y-auto px-4 pb-2">
                          {queryHistory.map((h, i) => (
                            <button key={i} onClick={() => setSqlQuery(h.query)}
                              className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-[var(--content-bg)] transition-colors group">
                              <span className="text-[var(--text-muted)]">{h.time}</span>
                              <span className="flex-1 font-mono text-[var(--text-secondary)] truncate">{h.query}</span>
                              <span className="text-[var(--text-muted)]">{h.rowCount} rows</span>
                              <span className="text-[var(--text-muted)]">{h.duration}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {view === 'schema' && schema && (
                  <div className="p-4 space-y-6">
                    {/* Columns */}
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                        <Columns3 size={14} /> Columns ({schema.columns.length})
                      </h3>
                      <div className="overflow-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-[var(--border-color)]">
                              <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Name</th>
                              <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Type</th>
                              <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Nullable</th>
                              <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Primary Key</th>
                              <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Default</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--border-color)]">
                            {schema.columns.map((col) => (
                              <tr key={col.name} className="hover:bg-[var(--content-bg)]">
                                <td className="px-3 py-2 font-mono text-xs text-[var(--primary)]">
                                  <span className="flex items-center gap-1.5">
                                    {col.pk ? <Key size={10} className="text-yellow-500" /> : null}
                                    {col.name}
                                  </span>
                                </td>
                                <td className="px-3 py-2 font-mono text-xs text-[var(--text-secondary)]">{col.type}</td>
                                <td className="px-3 py-2 text-xs">{col.notnull ? 'NO' : 'YES'}</td>
                                <td className="px-3 py-2 text-xs">{col.pk ? 'YES' : ''}</td>
                                <td className="px-3 py-2 font-mono text-xs text-[var(--text-muted)]">{col.dflt_value || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Indexes */}
                    {schema.indexes.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                          <ArrowUpDown size={14} /> Indexes ({schema.indexes.length})
                        </h3>
                        <div className="space-y-1">
                          {schema.indexes.map((idx) => (
                            <div key={idx.name} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--content-bg)] text-xs">
                              <Hash size={12} className="text-[var(--text-muted)]" />
                              <span className="font-mono text-[var(--primary)]">{idx.name}</span>
                              {idx.unique && <span className="px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-600 text-[10px] font-medium">UNIQUE</span>}
                              <span className="text-[var(--text-muted)]">({idx.columns.join(', ')})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Foreign Keys */}
                    {schema.foreignKeys.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                          <Key size={14} /> Foreign Keys ({schema.foreignKeys.length})
                        </h3>
                        <div className="overflow-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-[var(--border-color)]">
                                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">From</th>
                                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">To Table</th>
                                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">To Column</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)]">
                              {(schema.foreignKeys as { from: string; table: string; to: string }[]).map((fk, i) => (
                                <tr key={i} className="hover:bg-[var(--content-bg)]">
                                  <td className="px-3 py-2 font-mono text-xs text-[var(--primary)]">{fk.from}</td>
                                  <td className="px-3 py-2 font-mono text-xs text-[var(--text-secondary)]">{fk.table}</td>
                                  <td className="px-3 py-2 font-mono text-xs text-[var(--text-secondary)]">{fk.to}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {view === 'crud' && (
                      <div className="p-4 space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <button onClick={() => setCrudAction('create')}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-medium hover:opacity-90 transition-opacity">
                            <Plus size={14} /> Add New Record
                          </button>
                        </div>

                        {crudAction === 'create' && (
                          <div className="matdash-card p-4">
                            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">Create New Record</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {schema?.columns.filter(c => !c.pk && c.name !== 'is_active' && c.name !== 'created_at' && c.name !== 'updated_at').map(col => (
                                <div key={col.name}>
                                  <label className="block text-[10px] font-semibold text-[var(--text-muted)] mb-1">{col.name} {col.notnull ? '*' : ''}</label>
                                  <input type="text" value={crudFormData[col.name] || ''}
                                    onChange={e => setCrudFormData(prev => ({ ...prev, [col.name]: e.target.value }))}
                                    placeholder={col.type}
                                    className="w-full px-2 py-1.5 text-xs border border-[var(--border-color)] rounded bg-[var(--content-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/30" />
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center gap-2 mt-4">
                              <button onClick={handleCrudCreate}
                                className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-medium hover:opacity-90">
                                Save Record
                              </button>
                              <button onClick={() => { setCrudAction(null); setCrudFormData({}); }}
                                className="px-4 py-2 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--content-bg)]">
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {crudAction === 'edit' && crudEditRow && (
                          <div className="matdash-card p-4">
                            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">Edit Record</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {schema?.columns.filter(c => !c.pk && c.name !== 'created_at' && c.name !== 'updated_at').map(col => (
                                <div key={col.name}>
                                  <label className="block text-[10px] font-semibold text-[var(--text-muted)] mb-1">{col.name}</label>
                                  <input type="text" value={crudFormData[col.name] || ''}
                                    onChange={e => setCrudFormData(prev => ({ ...prev, [col.name]: e.target.value }))}
                                    placeholder={col.type}
                                    className="w-full px-2 py-1.5 text-xs border border-[var(--border-color)] rounded bg-[var(--content-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/30" />
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center gap-2 mt-4">
                              <button onClick={handleCrudUpdate}
                                className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-medium hover:opacity-90">
                                Update Record
                              </button>
                              <button onClick={() => { setCrudAction(null); setCrudFormData({}); setCrudEditRow(null); }}
                                className="px-4 py-2 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--content-bg)]">
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {crudAction === 'delete' && crudDeleteRow && (
                          <div className="matdash-card p-4 border border-red-500/20">
                            <h3 className="text-sm font-bold text-red-500 mb-2">Delete Record</h3>
                            <p className="text-xs text-[var(--text-secondary)] mb-3">
                              Are you sure you want to delete this record? This action cannot be undone.
                            </p>
                            <div className="flex items-center gap-2">
                              <button onClick={handleCrudDelete}
                                className="px-4 py-2 rounded-lg bg-red-500 text-white text-xs font-medium hover:opacity-90">
                                Delete
                              </button>
                              <button onClick={() => { setCrudAction(null); setCrudDeleteRow(null); }}
                                className="px-4 py-2 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--content-bg)]">
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Row Actions */}
                        <div className="overflow-auto max-h-[calc(100vh-400px)]">
                          {data && data.rows.length > 0 ? (
                            <table className="w-full text-sm">
                              <thead className="sticky top-0 bg-[var(--card-bg)] border-b border-[var(--border-color)]">
                                <tr>
                                  {data.columns.slice(0, 5).map(col => (
                                    <th key={col} className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                      {col}
                                    </th>
                                  ))}
                                  <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[var(--border-color)]">
                                {data.rows.map((row, i) => (
                                  <tr key={i} className="hover:bg-[var(--content-bg)] transition-colors">
                                    {data.columns.slice(0, 5).map(col => (
                                      <td key={col} className="px-3 py-2 text-[var(--text-primary)] whitespace-nowrap max-w-[200px] truncate text-xs">
                                        <CellValue value={row[col]} />
                                      </td>
                                    ))}
                                    <td className="px-3 py-2">
                                      <div className="flex items-center gap-1">
                                        <button onClick={() => { setCrudAction('edit'); setCrudEditRow(row); setCrudFormData(row); }}
                                          className="px-2 py-1 rounded text-[10px] bg-[var(--primary-light)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-colors">
                                          Edit
                                        </button>
                                        <button onClick={() => { setCrudAction('delete'); setCrudDeleteRow(row); }}
                                          className="px-2 py-1 rounded text-[10px] bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors">
                                          Delete
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-40 text-[var(--text-muted)]">
                              <Table size={24} className="mb-2 opacity-40" />
                              <p className="text-sm">No records found</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function CellValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <span className="text-[var(--text-muted)] italic">NULL</span>
  if (typeof value === 'boolean') return <span className={value ? 'text-green-500' : 'text-red-500'}>{value ? 'true' : 'false'}</span>
  if (typeof value === 'number') return <span className="text-blue-500 font-mono">{value.toLocaleString()}</span>
  const str = String(value)
  if (str.length > 80) return <span className="text-[var(--text-secondary)]" title={str}>{str.slice(0, 80)}...</span>
  return <span className="text-[var(--text-primary)]">{str}</span>
}
