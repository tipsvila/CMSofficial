describe('Documents', () => {
  beforeEach(() => {
    cy.visit('/documents')
    cy.wait(1000)
  })

  it('loads documents page', () => {
    cy.get('.matdash-table').should('exist')
  })

  it('has export and import buttons', () => {
    cy.contains('button', 'Export CSV').should('exist')
    cy.contains('button', 'Import CSV').should('exist')
  })
})

describe('Orders', () => {
  beforeEach(() => {
    cy.visit('/orders')
    cy.wait(1000)
  })

  it('loads orders page', () => {
    cy.get('.matdash-table').should('exist')
  })

  it('shows total records', () => {
    cy.contains('records').should('exist')
  })

  it('has export and import buttons', () => {
    cy.contains('button', 'Export CSV').should('exist')
    cy.contains('button', 'Import CSV').should('exist')
  })
})

describe('Notifications', () => {
  beforeEach(() => {
    cy.visit('/notifications')
    cy.wait(1000)
  })

  it('loads notifications page', () => {
    cy.contains('Notifications').should('exist')
  })

  it('shows unread count', () => {
    cy.contains('unread').should('exist')
  })

  it('shows empty state or notification list', () => {
    cy.get('.matdash-card').should('exist')
  })
})

describe('Settings', () => {
  beforeEach(() => {
    cy.visit('/settings')
    cy.wait(1000)
  })

  it('loads settings page', () => {
    cy.get('.matdash-card').should('exist')
  })

  it('has form inputs', () => {
    cy.get('input').should('have.length.greaterThan', 0)
  })
})

describe('Capabilities', () => {
  beforeEach(() => {
    cy.visit('/capabilities')
    cy.wait(1000)
  })

  it('loads capabilities page', () => {
    cy.get('.matdash-card').should('exist')
  })
})

describe('Database', () => {
  beforeEach(() => {
    cy.visit('/database')
    cy.wait(1000)
  })

  it('loads database viewer', () => {
    cy.contains('Database Viewer').should('exist')
  })

  it('shows table list', () => {
    cy.contains('Tables').should('exist')
  })
})
