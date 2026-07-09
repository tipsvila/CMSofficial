describe('Contacts', () => {
  beforeEach(() => {
    cy.visit('/contacts')
    cy.wait(1000)
  })

  it('loads contacts list', () => {
    cy.get('.matdash-table').should('exist')
  })

  it('shows total records', () => {
    cy.contains('records').should('exist')
  })

  it('searches contacts', () => {
    cy.get('input[placeholder*="Search"]').type('test')
    cy.wait(500)
    cy.get('.matdash-table').should('exist')
  })

  it('navigates to create new contact', () => {
    cy.contains('a', 'Add Contact').click()
    cy.url().should('include', '/contacts/new')
  })

  it('creates a new contact', () => {
    cy.visit('/contacts/new')
    cy.get('select').first().select(1)
    cy.get('input').eq(1).type('Cypress')
    cy.get('input').eq(2).type('TestUser')
    cy.contains('button', 'Save').click()
    cy.wait(1000)
    cy.url().should('include', '/contacts')
  })

  it('has export and import buttons', () => {
    cy.contains('button', 'Export CSV').should('exist')
    cy.contains('button', 'Import CSV').should('exist')
  })
})
