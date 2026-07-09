import { render, screen, fireEvent } from '@testing-library/react'
import { FilterPanel } from '../filter-panel'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

function getFilterSelect(label: string): HTMLSelectElement {
  return screen.getByText(label).closest('div')!.querySelector('select')!
}

function getFilterInput(label: string): HTMLInputElement {
  return screen.getByText(label).closest('div')!.querySelector('input')!
}

describe('FilterPanel', () => {
  const onFiltersChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(window, 'location', {
      value: { pathname: '/sam-data' },
      writable: true,
    })
  })

  it('renders the Filters header', () => {
    render(<FilterPanel onFiltersChange={onFiltersChange} />)
    expect(screen.getByText('Filters')).toBeInTheDocument()
  })

  it('calls onFiltersChange with initial empty filters', () => {
    render(<FilterPanel onFiltersChange={onFiltersChange} />)
    expect(onFiltersChange).toHaveBeenCalledWith({
      agency: '',
      amountMin: '',
      amountMax: '',
      dateStart: '',
      dateEnd: '',
      naicsSearch: '',
      status: '',
    })
  })

  it('renders all filter controls when expanded', () => {
    render(<FilterPanel onFiltersChange={onFiltersChange} />)
    expect(getFilterSelect('Agency')).toBeInTheDocument()
    expect(getFilterSelect('Status')).toBeInTheDocument()
    expect(getFilterInput('NAICS Code')).toBeInTheDocument()
    // Amount and Date use div wrappers with two inputs each
    expect(screen.getByText('Amount Range')).toBeInTheDocument()
    expect(screen.getByText('Date Range')).toBeInTheDocument()
  })

  it('collapses and expands the filter panel', () => {
    render(<FilterPanel onFiltersChange={onFiltersChange} />)
    // Click to collapse
    fireEvent.click(screen.getByText('Filters'))
    expect(screen.queryByText('Amount Range')).not.toBeInTheDocument()
    // Click to expand again
    fireEvent.click(screen.getByText('Filters'))
    expect(screen.getByText('Amount Range')).toBeInTheDocument()
  })

  it('calls onFiltersChange when agency is selected', () => {
    render(<FilterPanel onFiltersChange={onFiltersChange} />)
    fireEvent.change(getFilterSelect('Agency'), { target: { value: 'Department of Defense' } })
    const lastCall = onFiltersChange.mock.calls[onFiltersChange.mock.calls.length - 1][0]
    expect(lastCall.agency).toBe('Department of Defense')
  })

  it('calls onFiltersChange when amount min is entered', () => {
    render(<FilterPanel onFiltersChange={onFiltersChange} />)
    const inputs = screen.getAllByRole('spinbutton')
    fireEvent.change(inputs[0], { target: { value: '1000' } })
    const lastCall = onFiltersChange.mock.calls[onFiltersChange.mock.calls.length - 1][0]
    expect(lastCall.amountMin).toBe('1000')
  })

  it('calls onFiltersChange when amount max is entered', () => {
    render(<FilterPanel onFiltersChange={onFiltersChange} />)
    const inputs = screen.getAllByRole('spinbutton')
    fireEvent.change(inputs[1], { target: { value: '5000' } })
    const lastCall = onFiltersChange.mock.calls[onFiltersChange.mock.calls.length - 1][0]
    expect(lastCall.amountMax).toBe('5000')
  })

  it('calls onFiltersChange when NAICS code is entered', () => {
    render(<FilterPanel onFiltersChange={onFiltersChange} />)
    fireEvent.change(screen.getByPlaceholderText('Search NAICS code...'), { target: { value: '336110' } })
    const lastCall = onFiltersChange.mock.calls[onFiltersChange.mock.calls.length - 1][0]
    expect(lastCall.naicsSearch).toBe('336110')
  })

  it('calls onFiltersChange when status is selected', () => {
    render(<FilterPanel onFiltersChange={onFiltersChange} />)
    fireEvent.change(getFilterSelect('Status'), { target: { value: 'active' } })
    const lastCall = onFiltersChange.mock.calls[onFiltersChange.mock.calls.length - 1][0]
    expect(lastCall.status).toBe('active')
  })

  it('shows active filter count badge when filters are set', () => {
    render(<FilterPanel onFiltersChange={onFiltersChange} />)
    fireEvent.change(getFilterSelect('Agency'), { target: { value: 'Department of Defense' } })
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('shows Clear all button when filters are active', () => {
    render(<FilterPanel onFiltersChange={onFiltersChange} />)
    fireEvent.change(getFilterSelect('Agency'), { target: { value: 'Department of Defense' } })
    expect(screen.getByText('Clear all')).toBeInTheDocument()
  })

  it('clears all filters when Clear all is clicked', () => {
    render(<FilterPanel onFiltersChange={onFiltersChange} />)
    fireEvent.change(getFilterSelect('Agency'), { target: { value: 'Department of Defense' } })
    fireEvent.click(screen.getByText('Clear all'))
    const lastCall = onFiltersChange.mock.calls[onFiltersChange.mock.calls.length - 1][0]
    expect(lastCall.agency).toBe('')
  })

  it('shows agency filter badge when agency is set', () => {
    render(<FilterPanel onFiltersChange={onFiltersChange} />)
    fireEvent.change(getFilterSelect('Agency'), { target: { value: 'Department of Defense' } })
    expect(screen.getAllByText('Department of Defense').length).toBeGreaterThanOrEqual(2)
  })

  it('removes individual filter when badge X is clicked', () => {
    render(<FilterPanel onFiltersChange={onFiltersChange} />)
    fireEvent.change(getFilterSelect('Agency'), { target: { value: 'Department of Defense' } })
    // Badge is the first span inside the active-filters div
    const badgeArea = document.querySelector('.flex.flex-wrap.gap-2')!
    const badge = badgeArea.querySelector('span')!
    const removeBtn = badge.querySelector('button')!
    fireEvent.click(removeBtn)
    const lastCall = onFiltersChange.mock.calls[onFiltersChange.mock.calls.length - 1][0]
    expect(lastCall.agency).toBe('')
  })
})
