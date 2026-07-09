import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { SAMDataList } from '../sam-data-list'
import { api } from '@/lib/api-client'
import type { EntityListConfig } from '../sam-data-list'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}))

vi.mock('@/components/toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

vi.mock('@/components/ui', () => ({
  DataTable: ({ columns, data, emptyMessage = 'No data found' }: { columns: { key: string; label: string; render?: (row: Record<string, unknown>) => React.ReactNode; headerRender?: () => React.ReactNode }[]; data: Record<string, unknown>[]; emptyMessage?: string }) => (
    <table data-testid="data-table">
      <thead>
        <tr>{columns.map(col => <th key={col.key}>{col.headerRender ? col.headerRender() : col.label}</th>)}</tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr><td colSpan={columns.length}>{emptyMessage}</td></tr>
        ) : data.map((row, i) => (
          <tr key={(row.id as string) || i}>{columns.map(col => <td key={col.key}>{col.render ? col.render(row) : String(row[col.key] ?? '-')}</td>)}</tr>
        ))}
      </tbody>
    </table>
  ),
  ConfirmDialog: ({ open, onClose, onConfirm, title }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string }) => (
    open ? <div data-testid="confirm-dialog"><h3>{title}</h3><button onClick={onConfirm}>Confirm</button><button onClick={onClose}>Cancel</button></div> : null
  ),
  Modal: ({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) => (
    open ? <div data-testid="modal"><h2>{title}</h2>{children}<button onClick={onClose}>Close</button></div> : null
  ),
}))

vi.mock('@/components/page-header', () => ({
  PageHeader: ({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) => (
    <div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}{actions && <div>{actions}</div>}</div>
  ),
}))

vi.mock('@/components/skeleton', () => ({
  TableSkeleton: ({ rows, cols }: { rows: number; cols: number }) => <div data-testid="skeleton">Skeleton {rows}x{cols}</div>,
}))

vi.mock('@/components/sort-icon', () => ({
  SortIcon: () => <span data-testid="sort-icon" />,
}))

const mockConfig: EntityListConfig = {
  entityName: 'SAM Records',
  endpoint: '/api/sam-data',
  responseKey: 'records',
  columns: [
    { key: 'awardIdPiid', label: 'Award ID', sortable: true, sortField: 'awardIdPiid' },
    { key: 'recipientName', label: 'Recipient' },
  ],
  csvHeaders: ['Award ID', 'Recipient'],
  csvRowMapper: (row) => [row.awardIdPiid, row.recipientName],
  searchPlaceholder: 'Search SAM records...',
  addHref: '/sam-data/new',
  addLabel: 'Add SAM Record',
  filters: [
    { param: 'status', label: 'Status', options: ['All', 'Active', 'Inactive'] },
  ],
}

const mockApiGet = api.get as ReturnType<typeof vi.fn>
const mockApiPost = api.post as ReturnType<typeof vi.fn>

describe('SAMDataList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApiGet.mockResolvedValue({ records: [], total: 0 })
  })

  it('renders loading state initially', () => {
    render(<SAMDataList config={mockConfig} />)
    expect(screen.getByTestId('skeleton')).toBeInTheDocument()
  })

  it('renders page header with entity name', async () => {
    mockApiGet.mockResolvedValue({ records: [], total: 0 })
    render(<SAMDataList config={mockConfig} />)
    expect(screen.getByText('SAM Records')).toBeInTheDocument()
  })

  it('renders empty table when no data', async () => {
    render(<SAMDataList config={mockConfig} />)
    await waitFor(() => {
      expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument()
    })
    expect(screen.getByText('No data found')).toBeInTheDocument()
  })

  it('renders data rows when data is loaded', async () => {
    mockApiGet.mockResolvedValue({
      records: [
        { id: '1', awardIdPiid: 'AID-001', recipientName: 'Acme Corp' },
        { id: '2', awardIdPiid: 'AID-002', recipientName: 'Beta Inc' },
      ],
      total: 2,
    })
    render(<SAMDataList config={mockConfig} />)
    await waitFor(() => {
      expect(screen.getByText('AID-001')).toBeInTheDocument()
    })
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    expect(screen.getByText('AID-002')).toBeInTheDocument()
    expect(screen.getByText('Beta Inc')).toBeInTheDocument()
  })

  it('displays total record count in header', async () => {
    mockApiGet.mockResolvedValue({ records: [], total: 42 })
    render(<SAMDataList config={mockConfig} />)
    await waitFor(() => {
      expect(screen.getByText('42 sam records')).toBeInTheDocument()
    })
  })

  it('renders search input with placeholder', async () => {
    render(<SAMDataList config={mockConfig} />)
    expect(screen.getByPlaceholderText('Search SAM records...')).toBeInTheDocument()
  })

  it('renders filter dropdowns from config', async () => {
    render(<SAMDataList config={mockConfig} />)
    const selects = screen.getAllByRole('combobox')
    expect(selects.length).toBeGreaterThan(0)
  })

  it('renders Export CSV button', async () => {
    render(<SAMDataList config={mockConfig} />)
    expect(screen.getByText('Export CSV')).toBeInTheDocument()
  })

  it('renders Import CSV button', async () => {
    render(<SAMDataList config={mockConfig} />)
    expect(screen.getByText('Import CSV')).toBeInTheDocument()
  })

  it('renders Add button with addLabel', async () => {
    render(<SAMDataList config={mockConfig} />)
    expect(screen.getByText('Add SAM Record')).toBeInTheDocument()
  })

  it('renders Delete All button when no items selected', async () => {
    render(<SAMDataList config={mockConfig} />)
    expect(screen.getByText('Delete All')).toBeInTheDocument()
  })

  it('renders pagination controls', async () => {
    mockApiGet.mockResolvedValue({ records: [], total: 0 })
    render(<SAMDataList config={mockConfig} />)
    await waitFor(() => {
      expect(screen.getByText('Previous')).toBeInTheDocument()
    })
    expect(screen.getByText('Next')).toBeInTheDocument()
  })

  it('disables Previous button on first page', async () => {
    render(<SAMDataList config={mockConfig} />)
    await waitFor(() => {
      expect(screen.getByText('Previous')).toBeDisabled()
    })
  })

  it('shows error message on API failure', async () => {
    mockApiGet.mockRejectedValue(new Error('Network error'))
    render(<SAMDataList config={mockConfig} />)
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('calls api.get with correct endpoint', async () => {
    render(<SAMDataList config={mockConfig} />)
    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalled()
    })
    const callUrl = mockApiGet.mock.calls[0][0] as string
    expect(callUrl).toContain('/api/sam-data?')
  })

  it('shows BulkActions when items are selected', async () => {
    mockApiGet.mockResolvedValue({
      records: [{ id: '1', awardIdPiid: 'AID-001', recipientName: 'Acme Corp' }],
      total: 1,
    })
    render(<SAMDataList config={mockConfig} />)
    await waitFor(() => {
      expect(screen.getByText('AID-001')).toBeInTheDocument()
    })
    // BulkActions should not be visible initially
    expect(screen.queryByText('Clear')).not.toBeInTheDocument()
    // Click the header select-all button (first button in the table)
    const selectAllBtn = document.querySelector('table thead button')
    fireEvent.click(selectAllBtn!)
    // BulkActions should now appear
    await waitFor(() => {
      expect(screen.getByText('Clear')).toBeInTheDocument()
    })
    expect(screen.getByText('1 sam record selected')).toBeInTheDocument()
  })

  it('hides Add button when addHref is not provided', async () => {
    const configNoAdd = { ...mockConfig, addHref: undefined }
    render(<SAMDataList config={configNoAdd} />)
    expect(screen.queryByText('Add SAM Record')).not.toBeInTheDocument()
  })

  it('disables Export CSV button when data is empty', async () => {
    mockApiGet.mockResolvedValue({ records: [], total: 0 })
    render(<SAMDataList config={mockConfig} />)
    await waitFor(() => {
      expect(screen.getByText('Export CSV')).toBeInTheDocument()
    })
    const exportBtn = screen.getByText('Export CSV').closest('button')!
    expect(exportBtn).toBeDisabled()
  })

  it('opens transfer modal after selecting items', async () => {
    mockApiGet.mockResolvedValue({
      records: [{ id: '1', awardIdPiid: 'AID-001', recipientName: 'Acme Corp' }],
      total: 1,
    })
    render(<SAMDataList config={mockConfig} />)
    await waitFor(() => {
      expect(screen.getByText('AID-001')).toBeInTheDocument()
    })
    // Select all via header checkbox
    const selectAllBtn = document.querySelector('table thead button')
    fireEvent.click(selectAllBtn!)
    await waitFor(() => {
      expect(screen.getByText('Clear')).toBeInTheDocument()
    })
    // Click Transfer To button in BulkActions
    const transferBtn = screen.getByText('Transfer To')
    fireEvent.click(transferBtn)
    // Transfer modal should appear
    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument()
    })
  })

  it('shows row count in pagination', async () => {
    mockApiGet.mockResolvedValue({
      records: [{ id: '1', awardIdPiid: 'AID-001', recipientName: 'Acme Corp' }],
      total: 25,
    })
    render(<SAMDataList config={mockConfig} />)
    await waitFor(() => {
      expect(screen.getByText('Showing 1 of 25 records')).toBeInTheDocument()
    })
  })
})
