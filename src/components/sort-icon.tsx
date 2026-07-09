import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

interface SortIconProps {
  sortBy: string
  sortOrder: string
  field: string
}

export function SortIcon({ sortBy, sortOrder, field }: SortIconProps) {
  if (sortBy !== field) return <ArrowUpDown size={12} className="text-[var(--text-muted)]" />
  return sortOrder === 'asc'
    ? <ArrowUp size={12} className="text-[var(--primary)]" />
    : <ArrowDown size={12} className="text-[var(--primary)]" />
}
