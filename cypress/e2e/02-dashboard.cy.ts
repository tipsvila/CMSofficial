describe('Dashboard', () => {
  beforeEach(() => cy.visit('/'))

  it('renders dashboard page', () => {
    cy.contains('Dashboard').should('exist')
  })

  it('shows stat cards', () => {
    cy.get('.matdash-card').should('have.length.greaterThan', 0)
  })

  it('loads dashboard data from API', () => {
    cy.request('/api/dashboard').then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body).to.have.property('stats')
    })
  })
})
