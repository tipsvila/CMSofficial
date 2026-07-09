import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  trend?: { value: number; isPositive: boolean }
  comparison?: string
  icon?: React.ReactNode
  color?: 'primary' | 'success' | 'warning' | 'danger'
}

export function StatCard({ title, value, trend, comparison, icon, color = 'primary' }: StatCardProps) {
  return (
    <div className="matdash-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[var(--text-secondary)]">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{trend.value}%</span>
            </div>
          )}
          {comparison && <p className="text-xs text-[var(--text-secondary)]">{comparison}</p>}
        </div>
        {icon && <div className="text-[var(--text-secondary)]">{icon}</div>}
      </div>
    </div>
  )
}
