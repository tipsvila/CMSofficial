'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown, ChevronUp, X } from 'lucide-react'

const AGENCIES = [
  'Department of Defense',
  'Department of Homeland Security',
  'Department of Agriculture',
  'Department of Energy',
  'Department of Health and Human Services',
  'Department of Transportation',
  'Department of Justice',
  'Department of the Treasury',
  'Department of State',
  'Department of the Interior',
  'Department of Education',
  'Environmental Protection Agency',
  'General Services Administration',
  'National Aeronautics and Space Administration',
  'Small Business Administration',
]

export interface SAMFilters {
  agency: string
  amountMin: string
  amountMax: string
  dateStart: string
  dateEnd: string
  naicsSearch: string
  status: string
}

interface FilterPanelProps {
  onFiltersChange: (filters: SAMFilters) => void
}

function readFiltersFromURL(searchParams: URLSearchParams): SAMFilters {
  return {
    agency: searchParams.get('agency') || '',
    amountMin: searchParams.get('amountMin') || '',
    amountMax: searchParams.get('amountMax') || '',
    dateStart: searchParams.get('dateStart') || '',
    dateEnd: searchParams.get('dateEnd') || '',
    naicsSearch: searchParams.get('naics') || '',
    status: searchParams.get('status') || '',
  }
}

function writeFiltersToURL(filters: SAMFilters): string {
  const params = new URLSearchParams()
  if (filters.agency) params.set('agency', filters.agency)
  if (filters.amountMin) params.set('amountMin', filters.amountMin)
  if (filters.amountMax) params.set('amountMax', filters.amountMax)
  if (filters.dateStart) params.set('dateStart', filters.dateStart)
  if (filters.dateEnd) params.set('dateEnd', filters.dateEnd)
  if (filters.naicsSearch) params.set('naics', filters.naicsSearch)
  if (filters.status) params.set('status', filters.status)
  return params.toString()
}

function getActiveFilterCount(filters: SAMFilters): number {
  let count = 0
  if (filters.agency) count++
  if (filters.amountMin || filters.amountMax) count++
  if (filters.dateStart || filters.dateEnd) count++
  if (filters.naicsSearch) count++
  if (filters.status) count++
  return count
}

function FilterBadge({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--primary-light)] text-[var(--primary)] rounded-full text-[11px] font-medium">
      {label}
      <button onClick={onRemove} className="hover:text-[var(--danger)] transition-colors">
        <X size={12} />
      </button>
    </span>
  )
}

export function FilterPanel({ onFiltersChange }: FilterPanelProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [collapsed, setCollapsed] = useState(false)
  const [filters, setFilters] = useState<SAMFilters>(() => readFiltersFromURL(searchParams))

  useEffect(() => {
    onFiltersChange(filters)
    const qs = writeFiltersToURL(filters)
    const path = window.location.pathname
    router.replace(qs ? `${path}?${qs}` : path, { scroll: false })
  }, [filters, onFiltersChange, router])

  const update = useCallback((patch: Partial<SAMFilters>) => {
    setFilters(prev => ({ ...prev, ...patch }))
  }, [])

  const clearAll = useCallback(() => {
    setFilters({ agency: '', amountMin: '', amountMax: '', dateStart: '', dateEnd: '', naicsSearch: '', status: '' })
  }, [])

  const removeFilter = useCallback((key: keyof SAMFilters) => {
    setFilters(prev => ({ ...prev, [key]: '' }))
  }, [])

  const activeCount = getActiveFilterCount(filters)

  const activeBadges: { key: keyof SAMFilters; label: string }[] = []
  if (filters.agency) activeBadges.push({ key: 'agency', label: filters.agency })
  if (filters.amountMin || filters.amountMax) {
    const label = filters.amountMin && filters.amountMax
      ? `$${Number(filters.amountMin).toLocaleString()} – $${Number(filters.amountMax).toLocaleString()}`
      : filters.amountMin ? `Min $${Number(filters.amountMin).toLocaleString()}`
        : `Max $${Number(filters.amountMax).toLocaleString()}`
    activeBadges.push({ key: 'amountMin', label })
  }
  if (filters.dateStart || filters.dateEnd) {
    const label = filters.dateStart && filters.dateEnd
      ? `${filters.dateStart} – ${filters.dateEnd}`
      : filters.dateStart ? `From ${filters.dateStart}` : `Until ${filters.dateEnd}`
    activeBadges.push({ key: 'dateStart', label })
  }
  if (filters.naicsSearch) activeBadges.push({ key: 'naicsSearch', label: `NAICS: ${filters.naicsSearch}` })
  if (filters.status) activeBadges.push({ key: 'status', label: filters.status })

  return (
    <div className="matdash-card mb-4">
      {/* Header */}
      <button
        onClick={() => setCollapsed(prev => !prev)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold text-[var(--text-primary)]">Filters</span>
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--primary)] text-white text-[10px] font-bold">
              {activeCount}
            </span>
          )}
        </div>
        {collapsed ? <ChevronDown size={16} className="text-[var(--text-muted)]" /> : <ChevronUp size={16} className="text-[var(--text-muted)]" />}
      </button>

      {/* Active filter badges */}
      {!collapsed && activeBadges.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 mb-4">
          {activeBadges.map(b => (
            <FilterBadge key={b.key} label={b.label} onRemove={() => removeFilter(b.key)} />
          ))}
          <button onClick={clearAll} className="text-[11px] text-[var(--danger)] hover:underline font-medium ml-1">
            Clear all
          </button>
        </div>
      )}

      {/* Filter controls */}
      {!collapsed && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
          {/* Agency */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">Agency</label>
            <select
              value={filters.agency}
              onChange={e => update({ agency: e.target.value })}
              className="matdash-input text-[12px]"
            >
              <option value="">All Agencies</option>
              {AGENCIES.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {/* Amount Range */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">Amount Range</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.amountMin}
                onChange={e => update({ amountMin: e.target.value })}
                className="matdash-input text-[12px] w-full"
                min="0"
              />
              <span className="text-[var(--text-muted)] text-[12px]">–</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.amountMax}
                onChange={e => update({ amountMax: e.target.value })}
                className="matdash-input text-[12px] w-full"
                min="0"
              />
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">Date Range</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filters.dateStart}
                onChange={e => update({ dateStart: e.target.value })}
                className="matdash-input text-[12px] w-full"
              />
              <span className="text-[var(--text-muted)] text-[12px]">–</span>
              <input
                type="date"
                value={filters.dateEnd}
                onChange={e => update({ dateEnd: e.target.value })}
                className="matdash-input text-[12px] w-full"
              />
            </div>
          </div>

          {/* NAICS Search */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">NAICS Code</label>
            <input
              type="text"
              placeholder="Search NAICS code..."
              value={filters.naicsSearch}
              onChange={e => update({ naicsSearch: e.target.value })}
              className="matdash-input text-[12px]"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">Status</label>
            <select
              value={filters.status}
              onChange={e => update({ status: e.target.value })}
              className="matdash-input text-[12px]"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
