import Link from 'next/link'
import { FileQuestion, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[600px] flex items-center justify-center">
      <div className="text-center max-w-md">
        <FileQuestion className="mx-auto h-16 w-16 text-[var(--text-muted)] mb-6" />
        <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">404</h1>
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Page Not Found</h2>
        <p className="text-[var(--text-secondary)] mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 matdash-btn matdash-btn-primary rounded-lg transition-colors font-medium"
        >
          <ArrowLeft size={18} />
          Return to Dashboard
        </Link>
      </div>
    </div>
  )
}
