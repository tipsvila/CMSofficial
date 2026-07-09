describe('Outreach', () => {
  beforeEach(() => {
    cy.visit('/outreach')
    cy.wait(1000)
  })

  it('loads outreach list with data', () => {
    cy.get('.matdash-table tbody tr').should('have.length.greaterThan', 0)
  })

  it('has status and priority filters', () => {
    cy.get('select').should('have.length', 2)
  })

  it('filters by status', () => {
    cy.get('select').first().select('Pending')
    cy.wait(500)
    cy.get('.matdash-table').should('exist')
  })

  it('searches outreach', () => {
    cy.get('input[placeholder*="Search"]').type('BOEING')
    cy.wait(500)
  })

  it('navigates to create new outreach', () => {
    cy.contains('a', 'Add Outreach').click()
    cy.url().should('include', '/outreach/new')
  })
})
