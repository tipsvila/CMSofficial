interface FilterBarProps {
  dateRange: string
  agency: string
  status: string
  onDateRangeChange: (value: string) => void
  onAgencyChange: (value: string) => void
  onStatusChange: (value: string) => void
  onClear: () => void
}

export function FilterBar({
  dateRange, agency, status,
  onDateRangeChange, onAgencyChange, onStatusChange, onClear
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-4 items-center">
      <select value={dateRange} onChange={(e) => onDateRangeChange(e.target.value)} className="matdash-input">
        <option value="7d">Last 7 days</option>
        <option value="30d">Last 30 days</option>
        <option value="90d">Last 90 days</option>
        <option value="1y">Last year</option>
      </select>

      <select value={agency} onChange={(e) => onAgencyChange(e.target.value)} className="matdash-input">
        <option value="">All Agencies</option>
        <option value="DoD">Department of Defense</option>
        <option value="DHS">Department of Homeland Security</option>
        <option value="DoT">Department of Transportation</option>
      </select>

      <select value={status} onChange={(e) => onStatusChange(e.target.value)} className="matdash-input">
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="pending">Pending</option>
        <option value="closed">Closed</option>
      </select>

      {(dateRange !== '30d' || agency || status) && (
        <button onClick={onClear} className="text-sm text-[var(--primary)] hover:underline">
          Clear filters
        </button>
      )}
    </div>
  )
}
