describe('Contractors', () => {
  beforeEach(() => {
    cy.visit('/contractors')
    cy.wait(1000)
  })

  it('loads contractors list', () => {
    cy.get('.matdash-table tbody tr').should('have.length.greaterThan', 0)
  })

  it('shows total records', () => {
    cy.contains('records').should('exist')
  })

  it('searches contractors', () => {
    cy.get('input[placeholder*="Search"]').type('BOEING')
    cy.wait(500)
    cy.get('.matdash-table tbody tr').should('contain', 'BOEING')
  })

  it('sorts by column', () => {
    cy.contains('th', 'Name').click()
    cy.wait(500)
    cy.get('.matdash-table tbody tr').should('have.length.greaterThan', 0)
  })

  it('selects and deselects rows', () => {
    cy.get('.matdash-table tbody tr').first().find('button').first().click()
    cy.get('.matdash-table tbody tr').first().find('button').first().click()
  })

  it('navigates to create new contractor', () => {
    cy.contains('a', 'Add Contractor').click()
    cy.url().should('include', '/contractors/new')
  })

  it('creates a new contractor', () => {
    cy.visit('/contractors/new')
    cy.get('input').first().type('Cypress Test Company')
    cy.contains('button', 'Save').click()
    cy.wait(1000)
    cy.url().should('include', '/contractors')
  })

  it('views contractor detail', () => {
    cy.get('.matdash-table tbody tr').first().click()
    cy.url().should('match', /\/contractors\/[^/]+$/)
  })

  it('exports CSV', () => {
    cy.contains('button', 'Export CSV').should('exist')
  })

  it('has import button', () => {
    cy.contains('button', 'Import CSV').should('exist')
  })

  it('has delete all button', () => {
    cy.contains('button', 'Delete All').should('exist')
  })
})
