import { render, screen, fireEvent } from '@testing-library/react'
import { BulkActions } from '../bulk-actions'

describe('BulkActions', () => {
  const defaultProps = {
    selectedCount: 3,
    onClearSelection: vi.fn(),
    onExportSelected: vi.fn(),
    onDeleteSelected: vi.fn(),
    onTransferSelected: vi.fn(),
  }

  beforeEach(() => vi.clearAllMocks())

  it('renders nothing when selectedCount is 0', () => {
    const { container } = render(<BulkActions {...defaultProps} selectedCount={0} />)
    expect(container.firstChild).toBeNull()
  })

  it('shows selected count with singular entity name', () => {
    render(<BulkActions {...defaultProps} selectedCount={1} entityName="records" />)
    expect(screen.getByText('1 record selected')).toBeInTheDocument()
  })

  it('shows selected count with plural entity name', () => {
    render(<BulkActions {...defaultProps} selectedCount={5} entityName="records" />)
    expect(screen.getByText('5 records selected')).toBeInTheDocument()
  })

  it('defaults entity name to "items"', () => {
    render(<BulkActions {...defaultProps} selectedCount={2} />)
    expect(screen.getByText('2 items selected')).toBeInTheDocument()
  })

  it('calls onClearSelection when Clear is clicked', () => {
    render(<BulkActions {...defaultProps} />)
    fireEvent.click(screen.getByText('Clear'))
    expect(defaultProps.onClearSelection).toHaveBeenCalledTimes(1)
  })

  it('calls onExportSelected when Export Selected is clicked', () => {
    render(<BulkActions {...defaultProps} />)
    fireEvent.click(screen.getByText('Export Selected'))
    expect(defaultProps.onExportSelected).toHaveBeenCalledTimes(1)
  })

  it('calls onDeleteSelected when Delete Selected is clicked', () => {
    render(<BulkActions {...defaultProps} />)
    fireEvent.click(screen.getByText('Delete Selected'))
    expect(defaultProps.onDeleteSelected).toHaveBeenCalledTimes(1)
  })

  it('calls onTransferSelected when Transfer To is clicked', () => {
    render(<BulkActions {...defaultProps} />)
    fireEvent.click(screen.getByText('Transfer To'))
    expect(defaultProps.onTransferSelected).toHaveBeenCalledTimes(1)
  })

  it('shows Email button when onEmailSelected is provided', () => {
    const onEmailSelected = vi.fn()
    render(<BulkActions {...defaultProps} onEmailSelected={onEmailSelected} />)
    expect(screen.getByText('Email')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Email'))
    expect(onEmailSelected).toHaveBeenCalledTimes(1)
  })

  it('hides Email button when onEmailSelected is not provided', () => {
    render(<BulkActions {...defaultProps} />)
    expect(screen.queryByText('Email')).not.toBeInTheDocument()
  })
})
