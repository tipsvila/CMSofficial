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
