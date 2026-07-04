export const OUTREACH_STATUSES = ['Pending', 'Sent', 'Follow-Up', 'Responded', 'Closed'] as const
export type OutreachStatus = (typeof OUTREACH_STATUSES)[number]

export const OUTREACH_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'] as const
export type OutreachPriority = (typeof OUTREACH_PRIORITIES)[number]

export const COMPLIANCE_TYPES = ['FAR', 'DFARS', 'ITAR', 'CMMC', 'NIST', 'AS9100', 'ISO27001', 'Other'] as const
export type ComplianceType = (typeof COMPLIANCE_TYPES)[number]

export const COMPLIANCE_STATUSES = ['Pending', 'In-Review', 'Compliant', 'Non-Compliant', 'Expired', 'Waived', 'Exempt'] as const
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number]

export const RISK_LEVELS = ['Critical', 'High', 'Medium', 'Low'] as const
export type RiskLevel = (typeof RISK_LEVELS)[number]

export const INQUIRY_STATUSES = ['Draft', 'Open', 'Quoted', 'Won', 'Lost', 'Closed'] as const
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number]

export const PART_CONDITIONS = ['NEW', 'OH', 'SV', 'AR', 'REPAIR', 'SCRAP', 'ANY'] as const
export type PartCondition = (typeof PART_CONDITIONS)[number]

export const RFQ_STATUSES = ['Draft', 'Published', 'Awarded', 'Closed', 'Cancelled'] as const
export type RfqStatus = (typeof RFQ_STATUSES)[number]

export const QUOTE_STATUSES = ['Draft', 'Submitted', 'Accepted', 'Rejected', 'Expired'] as const
export type QuoteStatus = (typeof QUOTE_STATUSES)[number]

export const ORDER_STATUSES = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Completed', 'Cancelled'] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const PAYMENT_STATUSES = ['Unpaid', 'Partial', 'Paid', 'Refunded'] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export const NOTIFICATION_TYPES = [
  'AOG_ALERT', 'QUOTE_RECEIVED', 'QUOTE_ACCEPTED', 'QUOTE_REJECTED',
  'ORDER_UPDATE', 'PRICE_DROP', 'NEW_LISTING', 'CERT_EXPIRY',
  'COMPLIANCE_ALERT', 'RFQ_PUBLISHED', 'SYSTEM',
] as const
export type NotificationType = (typeof NOTIFICATION_TYPES)[number]
