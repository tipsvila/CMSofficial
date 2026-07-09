export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-shimmer rounded-lg ${className}`} />
}

export function CardSkeleton() {
  return (
    <div className="matdash-card space-y-3">
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-7 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-7 w-40" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="matdash-card p-0 overflow-hidden">
      <table className="matdash-table">
        <thead>
          <tr>{Array.from({ length: cols }).map((_, i) => <th key={i}><Skeleton className="h-3 w-16" /></th>)}</tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>{Array.from({ length: cols }).map((_, j) => <td key={j}><Skeleton className="h-3 w-full" /></td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
