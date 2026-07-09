interface ChartDataPoint {
  label: string
  value: number
}

interface ChartCardProps {
  title: string
  subtitle?: string
  type: 'bar' | 'line' | 'pie'
  data: ChartDataPoint[]
  loading?: boolean
}

export function ChartCard({ title, subtitle, type, data, loading }: ChartCardProps) {
  if (loading) {
    return (
      <div className="matdash-card">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-[var(--text-secondary)]">Loading...</p>
      </div>
    )
  }

  return (
    <div className="matdash-card">
      <h3 className="font-semibold">{title}</h3>
      {subtitle && <p className="text-sm text-[var(--text-secondary)]">{subtitle}</p>}
      <div className="mt-4">
        {data.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">No data available</p>
        ) : (
          <div className="space-y-2">
            {data.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm">{item.label}</span>
                <span className="text-sm font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
