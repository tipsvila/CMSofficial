# Dashboard Improvements & Systematic Debugging Design

**Date:** 2026-07-09
**Author:** MiMo Code Agent
**Status:** Approved

## Overview

Enhance the CMS dashboard with better stats, charts, filtering, and add comprehensive debugging utilities for a government contracting workflow.

## Goals

1. Improve dashboard with more metrics, charts, and filtering
2. Add reusable debugging utilities (logger, error handler, performance tracking)
3. Keep implementation simple and realistic for government contracting
4. Create reusable components for future features

## Architecture

### Component-Based Approach

Create reusable utilities and components that can be extended across the application.

```
src/
├── lib/
│   └── debug/
│       ├── logger.ts          # Structured logging
│       ├── error-handler.ts   # Centralized error handling
│       ├── performance.ts     # Performance tracking
│       ├── api-wrapper.ts     # API call wrapping
│       ├── component-tracker.ts # Render time tracking
│       └── index.ts           # Exports
├── components/
│   └── dashboard/
│       ├── stat-card.tsx      # Enhanced stat cards
│       ├── chart-card.tsx     # Reusable chart wrapper
│       ├── filter-bar.tsx     # Date/agency/status filters
│       ├── data-table.tsx     # Sortable, filterable table
│       └── index.ts           # Exports
└── app/
    └── api/
        └── dashboard/
            └── route.ts       # Enhanced with filtering
```

## Section 1: Debugging Utilities

### Logger (`src/lib/debug/logger.ts`)

**Purpose:** Structured console logging with levels and context tagging.

**Features:**
- Log levels: `debug`, `info`, `warn`, `error`
- Context tagging: `[Dashboard]`, `[API]`, `[Auth]`
- Structured JSON logs for production
- Dev mode: colored console output
- Production: JSON logs for log aggregation

**API:**
```typescript
import { logger } from '@/lib/debug'

logger.debug('[Dashboard] Component rendered', { props })
logger.info('[API] Request completed', { endpoint, duration })
logger.warn('[API] Slow query detected', { query, duration })
logger.error('[Auth] Unauthorized access', { path, userId })
```

### Error Handler (`src/lib/debug/error-handler.ts`)

**Purpose:** Centralized error handling with user-friendly messages.

**Features:**
- Catch and format errors
- User-friendly error messages
- Error classification (network, auth, validation, unknown)
- Error reporting to console/log

**API:**
```typescript
import { handleError } from '@/lib/debug'

try {
  await api.get('/api/data')
} catch (error) {
  const userMessage = handleError(error, 'Failed to load data')
  setError(userMessage)
}
```

### Performance Tracker (`src/lib/debug/performance.ts`)

**Purpose:** Track render times, API response times, slow queries.

**Features:**
- Measure function execution time
- Track API response times
- Flag slow operations (>500ms)
- Component render time tracking (dev mode)

**API:**
```typescript
import { measure, trackApiCall } from '@/lib/debug'

// Measure any async function
const data = await measure('fetch-dashboard', () => api.get('/api/dashboard'))

// Track API calls automatically
const response = await trackApiCall('/api/dashboard', () => fetch(url))
```

### API Wrapper (`src/lib/debug/api-wrapper.ts`)

**Purpose:** Wrap API calls with logging and performance tracking.

**Features:**
- Automatic logging of request/response
- Performance tracking
- Error handling
- Retry logic for failed requests

### Component Tracker (`src/lib/debug/component-tracker.ts`)

**Purpose:** Track component render times in development.

**Features:**
- Track render count
- Measure render duration
- Flag slow renders (>16ms)
- Dev mode only (no production impact)

## Section 2: Dashboard Components

### Stat Card (`src/components/dashboard/stat-card.tsx`)

**Purpose:** Enhanced stat card with trends and comparison.

**Features:**
- Current value display
- Trend indicator (↑↓ with percentage)
- Comparison to previous period
- Color coding (primary, success, warning, danger)
- Icon support

**Props:**
```typescript
interface StatCardProps {
  title: string
  value: string | number
  trend?: { value: number; isPositive: boolean }
  comparison?: string
  icon?: React.ReactNode
  color?: 'primary' | 'success' | 'warning' | 'danger'
}
```

### Chart Card (`src/components/dashboard/chart-card.tsx`)

**Purpose:** Reusable chart wrapper for bar, line, pie charts.

**Features:**
- Multiple chart types (bar, line, pie)
- Responsive design
- Loading state
- Empty state
- Title and subtitle

**Props:**
```typescript
interface ChartCardProps {
  title: string
  subtitle?: string
  type: 'bar' | 'line' | 'pie'
  data: ChartData
  loading?: boolean
}
```

### Filter Bar (`src/components/dashboard/filter-bar.tsx`)

**Purpose:** Date range, agency, status filters.

**Features:**
- Date range picker (7d, 30d, 90d, 1y, custom)
- Agency dropdown (DoD, DHS, DoT, etc.)
- Status dropdown (active, pending, closed)
- Clear filters button
- Active filter indicators

### Data Table (`src/components/dashboard/data-table.tsx`)

**Purpose:** Sortable, filterable table with drill-down.

**Features:**
- Column sorting
- Search/filter
- Pagination
- Row click for details
- Export to CSV
- Responsive design

## Section 3: Data Flow & Integration

### Enhanced Dashboard API

**Modified endpoint:** `GET /api/dashboard`

**New query parameters:**
- `dateRange` - 7d, 30d, 90d, 1y
- `agency` - DoD, DHS, DoT, etc.
- `status` - active, pending, closed

**New response fields:**
```typescript
interface DashboardResponse {
  stats: {
    totalContracts: number
    activeContracts: number
    totalContractValue: number
    totalContractors: number
    totalRevenue: number
    totalOrders: number
    // New fields
    rfqResponseRate: number
    contractWinRate: number
    pipelineValue: number
    averageContractValue: number
  }
  trends: {
    contractValueTrend: DataPoint[]
    agencyDistribution: DataPoint[]
    complianceStatus: DataPoint[]
  }
  filters: {
    dateRange: string
    agency: string
    status: string
  }
}
```

### New API Endpoints

- `GET /api/dashboard/trends` - Historical data for charts
- `GET /api/dashboard/performance` - API response times (debug endpoint)

### Data Flow

```
Dashboard Page
    ↓
API Client (with performance tracking)
    ↓
Dashboard API Route
    ↓
Database Query (with logging)
    ↓
Response (with performance metrics)
    ↓
Debug Logger (logs request/response times)
```

## Section 4: Error Handling & Debugging Integration

### Error Boundary (`src/components/error-boundary.tsx`)

**Purpose:** Catch React errors with fallback UI.

**Features:**
- Catches JavaScript errors in component tree
- Shows friendly fallback UI
- Logs error to debug logger
- Allows retry/reset

### Global Error Handling

**Layout integration:**
- Wrap app in error boundary
- Catch unhandled Promise rejections
- Global error event listener

### Debug Output Format

```
[2026-07-09T10:30:00Z] [INFO] [Dashboard] API call: /api/dashboard - 120ms
[2026-07-09T10:30:01Z] [WARN] [API] Slow query: sam_data fetch - 850ms
[2026-07-09T10:30:02Z] [ERROR] [Auth] Unauthorized access attempt - /api/settings
```

## Section 5: Testing Strategy

### Unit Tests

**Debug utilities:**
- `src/lib/debug/__tests__/logger.test.ts` - Test logging functions
- `src/lib/debug/__tests__/error-handler.test.ts` - Test error handling
- `src/lib/debug/__tests__/performance.test.ts` - Test performance tracking

**Dashboard components:**
- `src/components/dashboard/__tests__/stat-card.test.tsx` - Test stat card
- `src/components/dashboard/__tests__/chart-card.test.tsx` - Test chart card

### Integration Tests

- API endpoint tests with filtering
- Dashboard data flow tests

### Coverage Targets

- Debug utilities: 90%+ coverage
- Dashboard components: 80%+ coverage
- API endpoints: 85%+ coverage

## Implementation Order

1. Create debugging utilities (logger, error-handler, performance)
2. Create dashboard components (stat-card, chart-card, filter-bar, data-table)
3. Enhance dashboard API with filtering
4. Integrate error boundaries
5. Add performance tracking to API calls
6. Write tests for all new code
7. Update existing dashboard to use new components

## Success Criteria

- [ ] Dashboard shows enhanced stats with trends
- [ ] Charts display contract data visually
- [ ] Filters work for date range, agency, status
- [ ] Debug utilities log structured information
- [ ] Error boundaries catch and display errors gracefully
- [ ] Performance tracking identifies slow operations
- [ ] All tests pass with target coverage
- [ ] No breaking changes to existing functionality

## Out of Scope

- Real-time WebSocket updates (future enhancement)
- Advanced charting library (use simple CSS charts)
- External logging services (keep local for now)
- Mobile-specific optimizations (future enhancement)
