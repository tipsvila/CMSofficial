describe('Contracts', () => {
  beforeEach(() => {
    cy.visit('/contracts')
    cy.wait(1000)
  })

  it('loads contracts list', () => {
    cy.get('.matdash-table').should('exist')
  })

  it('has status filter', () => {
    cy.get('select').should('exist')
  })

  it('searches contracts', () => {
    cy.get('input[placeholder*="Search"]').type('test')
    cy.wait(500)
  })

  it('navigates to create new contract', () => {
    cy.contains('a', 'Add Contract').click()
    cy.url().should('include', '/contracts/new')
  })

  it('creates a new contract', () => {
    cy.visit('/contracts/new')
    cy.get('input').first().type('Cypress Test Contract')
    cy.contains('button', 'Save').click()
    cy.wait(1000)
    cy.url().should('include', '/contracts')
  })

  it('has export and import buttons', () => {
    cy.contains('button', 'Export CSV').should('exist')
    cy.contains('button', 'Import CSV').should('exist')
  })

  it('loads email templates tab', () => {
    cy.get('.matdash-table tbody tr').first().click()
    cy.wait(1000)
    cy.contains('button', 'Email').click()
    cy.wait(500)
    cy.contains('Capability Statement').should('exist')
  })
})
