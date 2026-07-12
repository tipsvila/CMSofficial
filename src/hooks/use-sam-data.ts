'use client'
import { useState, useCallback } from 'react'
import { useDebounce } from '@/hooks/use-debounce'
import { api } from '@/lib/api-client'
import type { SAMFilters } from '@/components/sam-data/filter-panel'
import type { SAMRecord } from '@/lib/sam-email'

interface SAMDataState {
  items: SAMRecord[]
  total: number
}

interface UseSAMDataReturn {
  data: SAMDataState
  loading: boolean
  error: string | null
  page: number
  search: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
  filters: SAMFilters
  debouncedSearch: string
  setPage: (p: number | ((prev: number) => number)) => void
  setSearch: (s: string) => void
  handleSort: (field: string) => void
  handleFiltersChange: (f: SAMFilters) => void
  fetchData: () => Promise<void>
}

export function useSAMData(): UseSAMDataReturn {
  const [data, setData] = useState<SAMDataState>({ items: [], total: 0 })
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filters, setFilters] = useState<SAMFilters>({
    agency: '', amountMin: '', amountMax: '',
    dateStart: '', dateEnd: '', naicsSearch: '', status: '',
  })

  const debouncedSearch = useDebounce(search, 300)

  const buildParams = useCallback(() => {
    const params = new URLSearchParams({
      page: String(page),
      search: debouncedSearch,
      sortBy,
      sortOrder,
    })
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
      const result = await api.get<{ records: SAMRecord[]; total: number }>(`/api/sam-data?${buildParams()}`)
      const items = result.records || []
      setData({ items, total: result.total || 0 })
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load SAM data') }
    finally { setLoading(false) }
  }, [buildParams])

  const handleFiltersChange = useCallback((f: SAMFilters) => {
    setFilters(f); setPage(1)
  }, [])

  const handleSort = useCallback((field: string) => {
    if (sortBy === field) setSortOrder(p => p === 'asc' ? 'desc' : 'asc')
    else { setSortBy(field); setSortOrder('asc') }
    setPage(1)
  }, [sortBy])

  return {
    data, loading, error, page, search, sortBy, sortOrder, filters, debouncedSearch,
    setPage, setSearch, handleSort, handleFiltersChange, fetchData,
  }
}
