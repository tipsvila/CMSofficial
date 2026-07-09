// SAM email utilities — wraps the existing email system for SAM-specific workflows
import { api } from '@/lib/api-client'

export interface SAMContact {
  id: string
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  contractor?: { id: string; name: string }
}

export interface SAMRecord {
  id: string
  awardIdPiid: string
  recipientName: string
  totalObligatedAmount?: number | null
  periodOfPerformanceCurrentEndDate?: string | null
  naicsDescription?: string | null
  productOrServiceCodeDescription?: string | null
  awardingAgencyName?: string | null
  contacts?: SAMContact[]
}

export interface SendEmailPayload {
  to: string
  cc?: string
  bcc?: string
  subject?: string
  template?: string
  customBody?: string
}

export interface BulkSendResult {
  total: number
  sent: number
  failed: number
  errors: Array<{ contactId?: string; recipient?: string; error: string }>
}

// Send email to a single SAM record
export async function sendSAMEmail(recordId: string, payload: SendEmailPayload): Promise<{ messageId: string }> {
  return api.post(`/api/sam-data/${recordId}/send-email`, payload)
}

// Send email to multiple SAM records (bulk)
export async function sendBulkSAMEmail(recordIds: string[], payload: SendEmailPayload): Promise<BulkSendResult> {
  const result: BulkSendResult = { total: recordIds.length, sent: 0, failed: 0, errors: [] }

  for (const id of recordIds) {
    try {
      await sendSAMEmail(id, payload)
      result.sent++
    } catch (err) {
      result.failed++
      result.errors.push({
        contactId: id,
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  return result
}

// Send email to all contacts for a SAM record
export async function sendEmailToContacts(
  record: SAMRecord,
  payload: SendEmailPayload
): Promise<BulkSendResult> {
  const contacts = record.contacts || []
  if (contacts.length === 0) {
    return {
      total: 1,
      sent: 0,
      failed: 1,
      errors: [{ contactId: record.id, recipient: '', error: 'No contacts found for this SAM record' }],
    }
  }

  const emailContacts = contacts.filter(c => c.email)
  if (emailContacts.length === 0) {
    return {
      total: contacts.length,
      sent: 0,
      failed: contacts.length,
      errors: contacts.map(c => ({
        contactId: c.id,
        recipient: '',
        error: `No email address for ${c.firstName} ${c.lastName}`,
      })),
    }
  }

  const result: BulkSendResult = { total: emailContacts.length, sent: 0, failed: 0, errors: [] }

  for (const contact of emailContacts) {
    try {
      await sendSAMEmail(record.id, { ...payload, to: contact.email! })
      result.sent++
    } catch (err) {
      result.failed++
      result.errors.push({
        contactId: contact.id,
        recipient: contact.email || '',
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  return result
}

// Build default subject from SAM record context
export function buildDefaultSubject(record: SAMRecord, template?: string): string {
  const agency = record.awardingAgencyName || 'SAM'
  switch (template) {
    case 'capability_statement':
      return `Business Introduction: Capability Statement for ${agency}`
    case 'follow_up':
      return `Follow-up: ${record.awardIdPiid} - ${record.recipientName}`
    case 'capability_follow_up':
      return `Capability Statement & Documentation: ${agency}`
    case 'rfq_published':
      return `RFQ Opportunity: ${record.awardIdPiid}`
    default:
      return `Regarding ${agency} - ${record.awardIdPiid}`
  }
}

// Map template keys to human-readable labels
export const TEMPLATE_LABELS: Record<string, string> = {
  capability_statement: 'Introduction',
  follow_up: 'Follow-up',
  capability_follow_up: 'Capability Statement',
  rfq_published: 'RFQ Response',
}

// SAM-specific template keys (subset of emailTemplates that make sense for SAM outreach)
export const SAM_TEMPLATE_KEYS = Object.keys(TEMPLATE_LABELS)
