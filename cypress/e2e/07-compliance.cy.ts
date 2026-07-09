describe('Compliance', () => {
  beforeEach(() => {
    cy.visit('/compliance')
    cy.wait(1000)
  })

  it('loads compliance list with data', () => {
    cy.get('.matdash-table tbody tr').should('have.length.greaterThan', 0)
  })

  it('has status and risk level filters', () => {
    cy.get('select').should('have.length', 2)
  })

  it('filters by status', () => {
    cy.get('select').first().select('Pending')
    cy.wait(500)
  })

  it('filters by risk level', () => {
    cy.get('select').eq(1).select('Critical')
    cy.wait(500)
  })

  it('searches compliance records', () => {
    cy.get('input[placeholder*="Search"]').type('FAR')
    cy.wait(500)
  })

  it('navigates to create new record', () => {
    cy.contains('a', 'Add Record').click()
    cy.url().should('include', '/compliance/new')
  })
})
