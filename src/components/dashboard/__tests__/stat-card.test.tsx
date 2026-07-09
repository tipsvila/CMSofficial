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