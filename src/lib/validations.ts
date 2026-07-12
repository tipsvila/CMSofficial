import { z } from 'zod'

// ─── Contractors ───
export const contractorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  uei: z.string().optional().nullable(),
  duns: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  contractingTier: z.enum(['Free', 'Platinum', 'Gold', 'Silver', 'Bronze', '']).optional().nullable(),
  aviationContractId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  email1: z.string().email('Invalid email').optional().or(z.literal('')),
  email2: z.string().email('Invalid email').optional().or(z.literal('')),
  email3: z.string().email('Invalid email').optional().or(z.literal('')),
})
export type ContractorInput = z.infer<typeof contractorSchema>

// ─── Contacts ───
export const contactSchema = z.object({
  contractorId: z.string().min(1, 'Contractor is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  title: z.string().optional().nullable(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional().nullable(),
  uei: z.string().optional().nullable(),
  duns: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  isPrimary: z.boolean().default(false),
  aviationContractId: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
})
export type ContactInput = z.infer<typeof contactSchema>
export const contactUpdateSchema = contactSchema.omit({ contractorId: true })

// ─── Contracts ───
export const contractSchema = z.object({
  contractNumber: z.string().min(1, 'Contract number is required'),
  title: z.string().min(1, 'Title is required'),
  contractorId: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  status: z.enum(['Draft', 'Active', 'Completed', 'Cancelled']).default('Draft'),
  totalAmount: z.coerce.number().min(0).default(0),
  taxAmount: z.coerce.number().min(0).default(0),
  shippingAmount: z.coerce.number().min(0).default(0),
  currency: z.string().default('USD'),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  paymentTerms: z.string().optional().nullable(),
  deliveryTerms: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
})
export type ContractInput = z.infer<typeof contractSchema>

// ─── Outreach ───
export const outreachSchema = z.object({
  contractorId: z.string().min(1, 'Contractor is required'),
  contactId: z.string().optional().nullable(),
  aviationContractId: z.string().optional().nullable(),
  status: z.enum(['Pending', 'Sent', 'Follow-Up', 'Responded', 'Closed']),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']),
  subject: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  interactionDate: z.string().optional().nullable(),
  followUpDate: z.string().optional().nullable(),
  sentDate: z.string().optional().nullable(),
  inquiryId: z.string().optional().nullable(),
})
export type OutreachInput = z.infer<typeof outreachSchema>

// ─── Compliance ───
export const complianceSchema = z.object({
  contractorId: z.string().min(1, 'Contractor is required'),
  aviationContractId: z.string().optional().nullable(),
  type: z.enum(['FAR', 'DFARS', 'ITAR', 'CMMC', 'NIST', 'AS9100', 'ISO27001', 'Other']),
  status: z.enum(['Pending', 'In-Review', 'Compliant', 'Non-Compliant', 'Expired', 'Waived', 'Exempt']),
  requirement: z.string().min(1, 'Requirement is required'),
  documentation: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  lastAuditDate: z.string().optional().nullable(),
  nextAuditDate: z.string().optional().nullable(),
  riskLevel: z.enum(['Critical', 'High', 'Medium', 'Low']).default('Medium'),
  priority: z.number().min(0).max(10).default(0),
  scope: z.enum(['Enterprise', 'Contract', 'Project']).default('Contract'),
  notes: z.string().optional().nullable(),
})
export type ComplianceInput = z.infer<typeof complianceSchema>

// ─── Inquiries ───
export const inquirySchema = z.object({
  inquiryId: z.string().optional().nullable(),
  partNumber: z.string().min(1, 'Part number is required'),
  partDescription: z.string().optional().nullable(),
  contractorId: z.string().min(1, 'Contractor is required'),
  aviationContractId: z.string().optional().nullable(),
  status: z.enum(['Draft', 'Open', 'Quoted', 'Won', 'Lost', 'Closed']).default('Draft'),
  notes: z.string().optional().nullable(),
})
export type InquiryInput = z.infer<typeof inquirySchema>

// ─── RFQs ───
export const rfqSchema = z.object({
  rfqNumber: z.string().optional().nullable(),
  title: z.string().min(1, 'Title is required'),
  partNumber: z.string().min(1, 'Part number is required'),
  partDescription: z.string().optional().nullable(),
  quantity: z.coerce.number().int().min(1).default(1),
  status: z.enum(['Draft', 'Published', 'Closed', 'Awarded']).default('Draft'),
  aogFlag: z.boolean().default(false),
  contractorId: z.string().optional().nullable(),
})
export type RfqInput = z.infer<typeof rfqSchema>

// ─── Orders ───
export const orderSchema = z.object({
  orderNumber: z.string().optional().nullable(),
  rfqId: z.string().optional().nullable(),
  quoteId: z.string().optional().nullable(),
  contractorId: z.string().optional().nullable(),
  status: z.enum(['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled']).default('Pending'),
  totalAmount: z.coerce.number().min(0).default(0),
  taxAmount: z.coerce.number().min(0).default(0),
  shippingAmount: z.coerce.number().min(0).default(0),
  currency: z.string().default('USD'),
  paymentStatus: z.enum(['Unpaid', 'Partial', 'Paid', 'Refunded']).default('Unpaid'),
  notes: z.string().optional().nullable(),
})
export type OrderInput = z.infer<typeof orderSchema>

// ─── SAM Data ───
export const samDataSchema = z.object({
  awardIdPiid: z.string().min(1, 'Award ID is required'),
  recipientName: z.string().min(1, 'Recipient name is required'),
  totalObligatedAmount: z.coerce.number().min(0).default(0),
  naicsDescription: z.string().optional().nullable(),
  productOrServiceCodeDescription: z.string().optional().nullable(),
  awardingAgencyName: z.string().optional().nullable(),
  periodOfPerformanceCurrentEndDate: z.string().optional().nullable(),
})
export type SamDataInput = z.infer<typeof samDataSchema>

// ─── Auth ───
export const loginUserSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})
export type LoginInput = z.infer<typeof loginUserSchema>
