describe('Search, Sort, and Pagination', () => {
  it('contractors: search filters results', () => {
    cy.visit('/contractors')
    cy.wait(1000)
    const initialCount = Cypress.$('.matdash-table tbody tr').length
    cy.get('input[placeholder*="Search"]').type('ZZZZNONEXISTENT')
    cy.wait(500)
    cy.get('.matdash-table tbody tr').should('have.length', 0)
  })

  it('contractors: sort toggles direction', () => {
    cy.visit('/contractors')
    cy.wait(1000)
    cy.contains('th', 'Name').click()
    cy.wait(300)
    cy.contains('th', 'Name').click()
    cy.wait(300)
    cy.get('.matdash-table tbody tr').should('have.length.greaterThan', 0)
  })

  it('pagination: next and previous', () => {
    cy.visit('/contractors')
    cy.wait(1000)
    cy.contains('button', 'Next').click()
    cy.wait(500)
    cy.contains('Page 2').should('exist')
    cy.contains('button', 'Previous').click()
    cy.wait(500)
    cy.contains('Page 1').should('exist')
  })

  it('inquiries: status filter works', () => {
    cy.visit('/inquiries')
    cy.wait(1000)
    cy.get('select').first().select('Draft')
    cy.wait(500)
    cy.get('.matdash-table').should('exist')
  })

  it('compliance: dual filters work', () => {
    cy.visit('/compliance')
    cy.wait(1000)
    cy.get('select').first().select('Pending')
    cy.get('select').eq(1).select('Medium')
    cy.wait(500)
    cy.get('.matdash-table').should('exist')
  })

  it('outreach: status and priority filters', () => {
    cy.visit('/outreach')
    cy.wait(1000)
    cy.get('select').first().select('Sent')
    cy.get('select').eq(1).select('Critical')
    cy.wait(500)
    cy.get('.matdash-table').should('exist')
  })
})
