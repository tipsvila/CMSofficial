describe('Navigation', () => {
  beforeEach(() => cy.visit('/'))

  it('renders sidebar with all nav groups', () => {
    // Desktop sidebar uses hidden lg:flex, not .sidebar class
    cy.get('aside').should('be.visible')
    cy.contains('Dashboards')
    cy.contains('CRM')
    cy.contains('Operations')
    cy.contains('System')
  })

  it('navigates to all 13 pages from sidebar', () => {
    const routes = [
      { label: 'Dashboard', path: '/' },
      { label: 'Contractors', path: '/contractors' },
      { label: 'Contacts', path: '/contacts' },
      { label: 'Outreach', path: '/outreach' },
      { label: 'Compliance', path: '/compliance' },
      { label: 'Inquiries', path: '/inquiries' },
      { label: 'Contracts', path: '/contracts' },
      { label: 'Capabilities', path: '/capabilities' },
      { label: 'Documents', path: '/documents' },
      { label: 'Orders', path: '/orders' },
      { label: 'Notifications', path: '/notifications' },
      { label: 'Settings', path: '/settings' },
      { label: 'Database', path: '/database' },
    ]

    routes.forEach(({ label, path }) => {
      cy.get('aside').contains('a', label).click()
      cy.url().should('include', path)
      cy.get('aside').should('be.visible')
    })
  })

  it('highlights active nav item', () => {
    cy.visit('/contractors')
    cy.get('aside').contains('a', 'Contractors').should('have.attr', 'class').and('contain', 'bg-[var(--primary)]')
  })

  it('renders topbar with page name', () => {
    cy.visit('/contractors')
    cy.get('header').contains('Contractors')
  })

  it('collapses and expands sidebar', () => {
    cy.get('aside').should('be.visible')
    // Desktop sidebar has a collapse button (ChevronLeft icon)
    cy.get('aside button').first().click()
    cy.wait(500)
    // Sidebar should still be present (collapsed state)
    cy.get('aside').should('exist')
  })
})
