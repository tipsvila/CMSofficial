describe('Inquiries', () => {
  beforeEach(() => {
    cy.visit('/inquiries')
    cy.wait(1000)
  })

  it('loads inquiries list with data', () => {
    cy.get('.matdash-table tbody tr').should('have.length.greaterThan', 0)
  })

  it('shows status filter', () => {
    cy.get('select').should('exist')
  })

  it('filters by status', () => {
    cy.get('select').first().select('Draft')
    cy.wait(500)
    cy.get('.matdash-table').should('exist')
  })

  it('searches inquiries', () => {
    cy.get('input[placeholder*="Search"]').type('MS')
    cy.wait(500)
    cy.get('.matdash-table').should('exist')
  })

  it('sorts by inquiry ID', () => {
    cy.contains('th', 'Inquiry ID').click()
    cy.wait(500)
  })

  it('navigates to create new inquiry', () => {
    cy.contains('a', 'Add Inquiry').click()
    cy.url().should('include', '/inquiries/new')
  })
})
