# Dashboard Improvements & Systematic Debugging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance CMS dashboard with better stats, charts, filtering, and add comprehensive debugging utilities.

**Architecture:** Component-based approach with reusable debugging utilities and dashboard components. Follows existing patterns (CRUD factory, entity configs).

**Tech Stack:** Next.js 15.5.20, React 19, TypeScript, Tailwind CSS, Vitest

## Global Constraints

- Next.js 15.5.20 (no updates)
- Free DB only (Turso/Drizzle ORM + SQLite)
- No auth until final production round
- All code must be clear, concise, idiomatic, review-ready
- Parameterized queries for ALL SQL
- Follow existing patterns (CRUD factory, entity configs)

---

## File Structure

```
src/
├── lib/
│   └── debug/
│       ├── logger.ts          # Structured logging
│       ├── error-handler.ts   # Centralized error handling
│       ├── performance.ts     # Performance tracking
│       ├── api-wrapper.ts     # API call wrapping
│       ├── component-tracker.ts # Render time tracking
│       ├── index.ts           # Exports
│       └── __tests__/
│           ├── logger.test.ts
│           ├── error-handler.test.ts
│           └── performance.test.ts
├── components/
│   ├── dashboard/
│   │   ├── stat-card.tsx      # Enhanced stat cards
│   │   ├── chart-card.tsx     # Reusable chart wrapper
│   │   ├── filter-bar.tsx     # Date/agency/status filters
│   │   ├── data-table.tsx     # Sortable, filterable table
│   │   ├── index.ts           # Exports
│   │   └── __tests__/
│   │       ├── stat-card.test.tsx
│   │       └── chart-card.test.tsx
│   └── error-boundary.tsx     # React error boundary
└── app/
    └── api/
        └── dashboard/
            └── route.ts       # Enhanced with filtering
```

---

## Task 1: Create Logger Utility

**Files:**
- Create: `src/lib/debug/logger.ts`
- Create: `src/lib/debug/__tests__/logger.test.ts`

**Interfaces:**
- Produces: `logger.debug()`, `logger.info()`, `logger.warn()`, `logger.error()`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/debug/__tests__/logger.test.ts
import { logger } from '../logger'

describe('logger', () => {
  it('should have debug, info, warn, error methods', () => {
    expect(typeof logger.debug).toBe('function')
    expect(typeof logger.info).toBe('function')
    expect(typeof logger.warn).toBe('function')
    expect(typeof logger.error).toBe('function')
  })

  it('should accept message and context', () => {
    expect(() => logger.info('[Test] Message', { key: 'value' })).not.toThrow()
  })
})
```

- [ ] **Step 2: Run test to make sure it fails**

```bash
pnpm test src/lib/debug/__tests__/logger.test.ts
```

- [ ] **Step 3: Implement the minimal code to make the test pass**

```typescript
// src/lib/debug/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface Logger {
  debug(message: string, context?: Record<string, unknown>): void
  info(message: string, context?: Record<string, unknown>): void
  warn(message: string, context?: Record<string, unknown>): void
  error(message: string, context?: Record<string, unknown>): void
}

function createLogger(): Logger {
  const log = (level: LogLevel, message: string, context?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString()
    const entry = { timestamp, level, message, ...context }
    
    if (process.env.NODE_ENV === 'development') {
      const colors = { debug: '\x1b[36m', info: '\x1b[32m', warn: '\x1b[33m', error: '\x1b[31m' }
      console.log(`${colors[level]}[${timestamp}] [${level.toUpperCase()}]${'\x1b[0m'} ${message}`, context || '')
    } else {
      console.log(JSON.stringify(entry))
    }
  }

  return {
    debug: (msg, ctx) => log('debug', msg, ctx),
    info: (msg, ctx) => log('info', msg, ctx),
    warn: (msg, ctx) => log('warn', msg, ctx),
    error: (msg, ctx) => log('error', msg, ctx),
  }
}

export const logger = createLogger()
```

- [ ] **Step 4: Run tests and make sure they pass**

```bash
pnpm test src/lib/debug/__tests__/logger.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/debug/logger.ts src/lib/debug/__tests__/logger.test.ts
git commit -m "feat: add structured logger utility"
```

---

## Task 2: Create Error Handler Utility

**Files:**
- Create: `src/lib/debug/error-handler.ts`
- Create: `src/lib/debug/__tests__/error-handler.test.ts`

**Interfaces:**
- Consumes: `logger` from Task 1
- Produces: `handleError()`, `classifyError()`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/debug/__tests__/error-handler.test.ts
import { handleError, classifyError } from '../error-handler'

describe('error-handler', () => {
  it('should classify network errors', () => {
    const error = new TypeError('Failed to fetch')
    expect(classifyError(error)).toBe('network')
  })

  it('should classify auth errors', () => {
    const error = new Error('Unauthorized')
    expect(classifyError(error)).toBe('auth')
  })

  it('should classify validation errors', () => {
    const error = new Error('Validation failed')
    expect(classifyError(error)).toBe('validation')
  })

  it('should return user-friendly message', () => {
    const error = new Error('Network error')
    const message = handleError(error, 'Failed to load data')
    expect(message).toBe('Failed to load data')
  })
})
```

- [ ] **Step 2: Run test to make sure it fails**

```bash
pnpm test src/lib/debug/__tests__/error-handler.test.ts
```

- [ ] **Step 3: Implement the minimal code to make the test pass**

```typescript
// src/lib/debug/error-handler.ts
import { logger } from './logger'

type ErrorType = 'network' | 'auth' | 'validation' | 'unknown'

export function classifyError(error: Error): ErrorType {
  const message = error.message.toLowerCase()
  if (message.includes('fetch') || message.includes('network')) return 'network'
  if (message.includes('unauthorized') || message.includes('forbidden')) return 'auth'
  if (message.includes('validation') || message.includes('invalid')) return 'validation'
  return 'unknown'
}

export function handleError(error: Error, fallbackMessage: string): string {
  const type = classifyError(error)
  logger.error(`[${type}] ${error.message}`, { error: error.message, type })
  return fallbackMessage
}
```

- [ ] **Step 4: Run tests and make sure they pass**

```bash
pnpm test src/lib/debug/__tests__/error-handler.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/debug/error-handler.ts src/lib/debug/__tests__/error-handler.test.ts
git commit -m "feat: add error handler utility"
```

---

## Task 3: Create Performance Tracker Utility

**Files:**
- Create: `src/lib/debug/performance.ts`
- Create: `src/lib/debug/__tests__/performance.test.ts`

**Interfaces:**
- Consumes: `logger` from Task 1
- Produces: `measure()`, `trackApiCall()`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/debug/__tests__/performance.test.ts
import { measure, trackApiCall } from '../performance'

describe('performance', () => {
  it('should measure function execution time', async () => {
    const result = await measure('test', async () => 42)
    expect(result).toBe(42)
  })

  it('should track API calls', async () => {
    const mockFetch = async () => ({ ok: true })
    const result = await trackApiCall('/api/test', mockFetch)
    expect(result.ok).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to make sure it fails**

```bash
pnpm test src/lib/debug/__tests__/performance.test.ts
```

- [ ] **Step 3: Implement the minimal code to make the test pass**

```typescript
// src/lib/debug/performance.ts
import { logger } from './logger'

export async function measure<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now()
  const result = await fn()
  const duration = Math.round(performance.now() - start)
  
  if (duration > 500) {
    logger.warn(`[Performance] Slow operation: ${label} - ${duration}ms`)
  } else {
    logger.debug(`[Performance] ${label} - ${duration}ms`)
  }
  
  return result
}

export async function trackApiCall<T>(endpoint: string, fetchFn: () => Promise<T>): Promise<T> {
  const start = performance.now()
  const result = await fetchFn()
  const duration = Math.round(performance.now() - start)
  
  logger.info(`[API] ${endpoint} - ${duration}ms`)
  
  return result
}
```

- [ ] **Step 4: Run tests and make sure they pass**

```bash
pnpm test src/lib/debug/__tests__/performance.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/debug/performance.ts src/lib/debug/__tests__/performance.test.ts
git commit -m "feat: add performance tracker utility"
```

---

## Task 4: Create Debug Index & API Wrapper

**Files:**
- Create: `src/lib/debug/index.ts`
- Create: `src/lib/debug/api-wrapper.ts`

**Interfaces:**
- Consumes: `logger`, `handleError`, `measure` from Tasks 1-3
- Produces: `withDebug()`, all debug utilities exported

- [ ] **Step 1: Create index.ts**

```typescript
// src/lib/debug/index.ts
export { logger } from './logger'
export { handleError, classifyError } from './error-handler'
export { measure, trackApiCall } from './performance'
```

- [ ] **Step 2: Create api-wrapper.ts**

```typescript
// src/lib/debug/api-wrapper.ts
import { logger } from './logger'
import { handleError } from './error-handler'
import { measure } from './performance'

export async function withDebug<T>(
  label: string,
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await measure(label, fn)
  } catch (error) {
    const message = handleError(error as Error, `Failed: ${label}`)
    logger.error(`[Debug] ${label} failed`, { error: message })
    return fallback
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/debug/index.ts src/lib/debug/api-wrapper.ts
git commit -m "feat: add debug index and API wrapper"
```

---

## Task 5: Create Stat Card Component

**Files:**
- Create: `src/components/dashboard/stat-card.tsx`
- Create: `src/components/dashboard/__tests__/stat-card.test.tsx`

**Interfaces:**
- Produces: `<StatCard />` component

- [ ] **Step 1: Write the failing test**

```typescript
// src/components/dashboard/__tests__/stat-card.test.tsx
import { render, screen } from '@testing-library/react'
import { StatCard } from '../stat-card'

describe('StatCard', () => {
  it('should render title and value', () => {
    render(<StatCard title="Total Contracts" value={42} />)
    expect(screen.getByText('Total Contracts')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('should render trend indicator', () => {
    render(<StatCard title="Revenue" value="$100k" trend={{ value: 12, isPositive: true }} />)
    expect(screen.getByText('12%')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to make sure it fails**

```bash
pnpm test src/components/dashboard/__tests__/stat-card.test.tsx
```

- [ ] **Step 3: Implement the minimal code to make the test pass**

```typescript
// src/components/dashboard/stat-card.tsx
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
```

- [ ] **Step 4: Run tests and make sure they pass**

```bash
pnpm test src/components/dashboard/__tests__/stat-card.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/stat-card.tsx src/components/dashboard/__tests__/stat-card.test.tsx
git commit -m "feat: add enhanced stat card component"
```

---

## Task 6: Create Chart Card Component

**Files:**
- Create: `src/components/dashboard/chart-card.tsx`
- Create: `src/components/dashboard/__tests__/chart-card.test.tsx`

**Interfaces:**
- Produces: `<ChartCard />` component

- [ ] **Step 1: Write the failing test**

```typescript
// src/components/dashboard/__tests__/chart-card.test.tsx
import { render, screen } from '@testing-library/react'
import { ChartCard } from '../chart-card'

describe('ChartCard', () => {
  it('should render title', () => {
    render(<ChartCard title="Contract Value" type="bar" data={[]} />)
    expect(screen.getByText('Contract Value')).toBeInTheDocument()
  })

  it('should render loading state', () => {
    render(<ChartCard title="Chart" type="bar" data={[]} loading={true} />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to make sure it fails**

```bash
pnpm test src/components/dashboard/__tests__/chart-card.test.tsx
```

- [ ] **Step 3: Implement the minimal code to make the test pass**

```typescript
// src/components/dashboard/chart-card.tsx
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
```

- [ ] **Step 4: Run tests and make sure they pass**

```bash
pnpm test src/components/dashboard/__tests__/chart-card.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/chart-card.tsx src/components/dashboard/__tests__/chart-card.test.tsx
git commit -m "feat: add chart card component"
```

---

## Task 7: Create Filter Bar Component

**Files:**
- Create: `src/components/dashboard/filter-bar.tsx`

**Interfaces:**
- Produces: `<FilterBar />` component

- [ ] **Step 1: Create filter-bar.tsx**

```typescript
// src/components/dashboard/filter-bar.tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/filter-bar.tsx
git commit -m "feat: add filter bar component"
```

---

## Task 8: Create Error Boundary Component

**Files:**
- Create: `src/components/error-boundary.tsx`

**Interfaces:**
- Consumes: `logger` from Task 1
- Produces: `<ErrorBoundary />` component

- [ ] **Step 1: Create error-boundary.tsx**

```typescript
// src/components/error-boundary.tsx
import React from 'react'
import { logger } from '@/lib/debug'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('[ErrorBoundary] Component error', { error: error.message, componentStack: errorInfo.componentStack })
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="matdash-card text-center py-8">
          <p className="text-[var(--danger)] font-semibold">Something went wrong</p>
          <p className="text-sm text-[var(--text-secondary)] mt-2">{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })} className="mt-4 text-sm text-[var(--primary)] hover:underline">
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/error-boundary.tsx
git commit -m "feat: add error boundary component"
```

---

## Task 9: Create Dashboard Index & Enhance API

**Files:**
- Create: `src/components/dashboard/index.ts`
- Modify: `src/app/api/dashboard/route.ts`

**Interfaces:**
- Consumes: All dashboard components
- Produces: Enhanced dashboard API with filtering

- [ ] **Step 1: Create index.ts**

```typescript
// src/components/dashboard/index.ts
export { StatCard } from './stat-card'
export { ChartCard } from './chart-card'
export { FilterBar } from './filter-bar'
```

- [ ] **Step 2: Enhance dashboard API**

Add filtering support to `/api/dashboard`:
- Query params: `dateRange`, `agency`, `status`
- Return filtered data
- Add trends data for charts

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/index.ts src/app/api/dashboard/route.ts
git commit -m "feat: enhance dashboard API with filtering"
```

---

## Task 10: Update Dashboard Page

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: All dashboard components, debug utilities

- [ ] **Step 1: Update dashboard page**

- Import new components
- Add filter state
- Use enhanced stat cards with trends
- Add chart cards
- Integrate error boundary
- Add performance tracking

- [ ] **Step 2: Run all tests**

```bash
pnpm test
```

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: update dashboard with new components and filtering"
```

---

## Task 11: Final Testing & Documentation

**Files:**
- Verify all tests pass
- Update README if needed

- [ ] **Step 1: Run full test suite**

```bash
pnpm test
```

- [ ] **Step 2: Run build**

```bash
pnpm build
```

- [ ] **Step 3: Final commit**

```bash
git add .
git commit -m "feat: complete dashboard improvements and debugging utilities"
```

---

## Success Criteria

- [ ] All tests pass with target coverage
- [ ] Dashboard shows enhanced stats with trends
- [ ] Charts display contract data visually
- [ ] Filters work for date range, agency, status
- [ ] Debug utilities log structured information
- [ ] Error boundaries catch and display errors gracefully
- [ ] Performance tracking identifies slow operations
- [ ] Build passes clean
