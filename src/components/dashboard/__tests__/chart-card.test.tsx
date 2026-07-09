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

  it('should render subtitle', () => {
    render(<ChartCard title="Revenue" subtitle="Last 12 months" type="line" data={[]} />)
    expect(screen.getByText('Last 12 months')).toBeInTheDocument()
  })

  it('should render empty state', () => {
    render(<ChartCard title="Chart" type="bar" data={[]} />)
    expect(screen.getByText('No data available')).toBeInTheDocument()
  })

  it('should render data items', () => {
    const data = [
      { label: 'Jan', value: 100 },
      { label: 'Feb', value: 200 },
    ]
    render(<ChartCard title="Monthly" type="bar" data={data} />)
    expect(screen.getByText('Jan')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('Feb')).toBeInTheDocument()
    expect(screen.getByText('200')).toBeInTheDocument()
  })
})
