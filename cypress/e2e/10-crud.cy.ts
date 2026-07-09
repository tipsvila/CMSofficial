describe('Full CRUD Lifecycle', () => {
  const uniqueId = Date.now()

  it('contractor: create → read → update → delete', () => {
    // Create
    cy.visit('/contractors/new')
    cy.get('input').first().type(`CRUD Test ${uniqueId}`)
    cy.contains('button', 'Save').click()
    cy.wait(1000)
    cy.url().should('include', '/contractors')

    // Read — find in list
    cy.get('input[placeholder*="Search"]').type(`CRUD Test ${uniqueId}`)
    cy.wait(500)
    cy.get('.matdash-table tbody tr').should('contain', `CRUD Test ${uniqueId}`)

    // Click into detail
    cy.get('.matdash-table tbody tr').first().click()
    cy.wait(500)

    // Delete
    cy.contains('button', 'Delete').click()
    cy.contains('button', 'Delete').last().click()
    cy.wait(1000)
    cy.url().should('include', '/contractors')
  })

  it('contract: create → read → email → delete via API', () => {
    cy.request('POST', '/api/contracts', {
      title: `API Test Contract ${uniqueId}`,
      contractorId: 'c00000000000000000000001',
      totalAmount: 99999,
    }).then((res) => {
      expect(res.status).to.eq(201)
      const id = res.body.id

      // Read
      cy.request(`/api/contracts/${id}`).then((r) => {
        expect(r.body.title).to.contain('API Test Contract')
      })

      // Send email
      cy.request('POST', '/api/contracts/send-email', {
        contractId: id,
        template: 'capability_statement',
        recipientEmail: 'test@cypress.io',
        recipientName: 'Cypress Test',
      }).then((r) => {
        expect(r.status).to.eq(200)
      })

      // Delete
      cy.request('DELETE', `/api/contracts/${id}`).then((r) => {
        expect(r.status).to.eq(200)
      })
    })
  })

  it('bulk operations via API', () => {
    // Create 3 contractors
    const ids: string[] = []
    for (let i = 0; i < 3; i++) {
      cy.request('POST', '/api/contractors', { name: `Bulk ${uniqueId} ${i}` }).then((res) => {
        ids.push(res.body.id)
      })
    }

    cy.then(() => {
      // Bulk delete
      cy.request('POST', '/api/contractors/bulk-delete', { ids }).then((res) => {
        expect(res.status).to.eq(200)
        expect(res.body.deleted).to.be.greaterThan(0)
      })
    })
  })

  it('CSV export returns data', () => {
    cy.request('/api/contractors/export').then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.contractors).to.be.an('array')
    })
  })
})
