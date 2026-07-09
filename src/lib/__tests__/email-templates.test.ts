import { describe, it, expect } from 'vitest'
import { emailTemplates } from '../email-templates'

describe('emailTemplates', () => {
  describe('capability_statement', () => {
    it('returns subject and html', () => {
      const result = emailTemplates.capability_statement({
        recipientName: 'John Doe',
        companyName: 'Acme Corp',
      })
      expect(result.subject).toContain('Capability Statement')
      expect(result.html).toContain('Acme Corp')
      expect(result.html).toContain('John Doe')
    })

    it('escapes XSS in recipientName', () => {
      const result = emailTemplates.capability_statement({
        recipientName: '<script>alert("xss")</script>',
        companyName: 'Test',
      })
      expect(result.html).not.toContain('<script>')
      expect(result.html).toContain('&lt;script&gt;')
    })

    it('escapes XSS in companyName', () => {
      const result = emailTemplates.capability_statement({
        recipientName: 'Test',
        companyName: '"><img src=x onerror=alert(1)>',
      })
      expect(result.html).not.toContain('<img')
      expect(result.html).toContain('&quot;&gt;&lt;img')
    })
  })

  describe('follow_up', () => {
    it('uses provided notes', () => {
      const result = emailTemplates.follow_up({
        recipientName: 'Jane',
        subject: 'RFQ-123',
        notes: 'Please respond ASAP',
      })
      expect(result.html).toContain('Please respond ASAP')
    })

    it('uses default notes when empty', () => {
      const result = emailTemplates.follow_up({
        recipientName: 'Jane',
        subject: 'RFQ-123',
        notes: '',
      })
      expect(result.html).toContain('Following up on our previous correspondence')
    })
  })

  describe('rfq_published', () => {
    it('includes RFQ details in table', () => {
      const result = emailTemplates.rfq_published({
        rfqNumber: 'RFQ-2024-001',
        title: 'Widget Parts',
        partNumber: 'WP-100',
      })
      expect(result.html).toContain('RFQ-2024-001')
      expect(result.html).toContain('Widget Parts')
      expect(result.html).toContain('WP-100')
    })
  })

  describe('quote_received', () => {
    it('formats amount with locale', () => {
      const result = emailTemplates.quote_received({
        rfqNumber: 'RFQ-001',
        contractorName: 'Acme',
        amount: 125000,
      })
      expect(result.html).toContain('125,000')
    })
  })

  describe('quote_accepted', () => {
    it('contains accepted status', () => {
      const result = emailTemplates.quote_accepted({
        rfqNumber: 'RFQ-001',
        contractorName: 'Acme',
      })
      expect(result.html).toContain('accepted')
      expect(result.html).toContain('#13de81')
    })
  })

  describe('quote_rejected', () => {
    it('contains rejected status', () => {
      const result = emailTemplates.quote_rejected({
        rfqNumber: 'RFQ-001',
        contractorName: 'Acme',
      })
      expect(result.html).toContain('rejected')
      expect(result.html).toContain('#fa896b')
    })
  })

  describe('compliance_alert', () => {
    it('includes compliance details', () => {
      const result = emailTemplates.compliance_alert({
        requirement: 'CAGE Code',
        status: 'Expiring',
        expiryDate: '2026-12-31',
      })
      expect(result.html).toContain('CAGE Code')
      expect(result.html).toContain('Expiring')
      expect(result.html).toContain('2026-12-31')
    })
  })

  describe('all templates', () => {
    it('produce valid HTML structure', () => {
      const templates = [
        () => emailTemplates.capability_statement({ recipientName: 'A', companyName: 'B' }),
        () => emailTemplates.follow_up({ recipientName: 'A', subject: 'S', notes: 'N' }),
        () => emailTemplates.rfq_published({ rfqNumber: 'R', title: 'T', partNumber: 'P' }),
        () => emailTemplates.quote_received({ rfqNumber: 'R', contractorName: 'C', amount: 100 }),
        () => emailTemplates.quote_accepted({ rfqNumber: 'R', contractorName: 'C' }),
        () => emailTemplates.quote_rejected({ rfqNumber: 'R', contractorName: 'C' }),
        () => emailTemplates.compliance_alert({ requirement: 'R', status: 'S', expiryDate: 'D' }),
      ]

      for (const getTemplate of templates) {
        const { subject, html } = getTemplate()
        expect(subject).toBeTruthy()
        expect(html).toContain('<!DOCTYPE html>')
        expect(html).toContain('</html>')
        expect(html).toContain('INTAEROBASE')
      }
    })
  })
})
