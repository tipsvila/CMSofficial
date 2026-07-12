// SAM compliance tracking utilities — wraps the compliance system for SAM-specific workflows
import { api } from '@/lib/api-client'
import type { SAMRecord } from '@/lib/sam-email'

export type { SAMRecord }

export type CompliancePriority = 'High' | 'Medium' | 'Low'

export interface ComplianceFollowUpPayload {
  samRecordId: string
  priority: CompliancePriority
  notes: string
  dueDate: string
  assignTo: string
}

export interface ComplianceFollowUpResult {
  id: string
  success: boolean
  error?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const COMPLIANCE_PRIORITIES: CompliancePriority[] = ['High', 'Medium', 'Low']

export const PRIORITY_RISK_MAP: Record<CompliancePriority, string> = {
  High: 'High',
  Medium: 'Medium',
  Low: 'Low',
}

export const PRIORITY_STATUS_MAP: Record<CompliancePriority, string> = {
  High: 'Pending',
  Medium: 'Pending',
  Low: 'Pending',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Build a compliance requirement description from a SAM record
export function buildRequirementDescription(record: SAMRecord): string {
  const agency = record.awardingAgencyName || 'Unknown Agency'
  const naics = record.naicsDescription ? ` (${record.naicsDescription})` : ''
  return `Follow-up: ${record.awardIdPiid} — ${record.recipientName}${naics} [${agency}]`
}

// Build internal notes that include the assignee
export function buildComplianceNotes(notes: string, assignTo: string): string {
  const parts: string[] = []
  if (notes.trim()) parts.push(notes.trim())
  if (assignTo.trim()) parts.push(`Assigned to: ${assignTo.trim()}`)
  return parts.join('\n')
}

// Format a due date for display
export function formatDueDate(dateStr: string): string {
  if (!dateStr) return 'No due date'
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── API ──────────────────────────────────────────────────────────────────────

// Create a compliance follow-up record from a SAM record
export async function createSAMFollowUp(
  record: SAMRecord,
  payload: ComplianceFollowUpPayload
): Promise<ComplianceFollowUpResult> {
  try {
    const body = {
      contractorId: '',
      type: 'Follow-Up',
      status: PRIORITY_STATUS_MAP[payload.priority],
      requirement: buildRequirementDescription(record),
      documentation: null,
      expiryDate: payload.dueDate || null,
      lastAuditDate: null,
      nextAuditDate: null,
      riskLevel: PRIORITY_RISK_MAP[payload.priority],
      priority: payload.priority === 'High' ? 3 : payload.priority === 'Medium' ? 2 : 1,
      scope: 'Contract',
      notes: buildComplianceNotes(payload.notes, payload.assignTo) || null,
      samRecordId: record.id,
    }

    const result = await api.post<{ id: string }>('/api/compliance', body)
    return { id: result.id, success: true }
  } catch (err) {
    return {
      id: '',
      success: false,
      error: err instanceof Error ? err.message : 'Failed to create compliance follow-up',
    }
  }
}

// Bulk create compliance follow-ups for multiple SAM records
export async function createBulkSAMFollowUps(
  records: SAMRecord[],
  payload: Omit<ComplianceFollowUpPayload, 'samRecordId'>
): Promise<{ total: number; created: number; failed: number; errors: string[] }> {
  const result = { total: records.length, created: 0, failed: 0, errors: [] as string[] }

  for (const record of records) {
    const res = await createSAMFollowUp(record, { ...payload, samRecordId: record.id })
    if (res.success) result.created++
    else {
      result.failed++
      result.errors.push(`${record.awardIdPiid}: ${res.error}`)
    }
  }

  return result
}
