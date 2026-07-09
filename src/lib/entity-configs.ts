import { CrudConfig, FieldMapping } from '@/lib/crud'
import { client } from '@/lib/db'

// ─── Contacts ───
const contactInsertMapper = (body: Record<string, unknown>, _id: string, _now: string): (string | number | null)[] => [
  body.contractorId as string ?? null,
  ((body.firstName as string)?.trim() ?? null),
  ((body.lastName as string)?.trim() ?? null),
  (body.title as string) || null,
  (body.email as string) || null,
  (body.phone as string) || null,
  body.isPrimary ? 1 : 0,
  (body.aviationContractId as string) || null,
  (body.source as string) || null,
]

const contactUpdateFields: FieldMapping[] = [
  { db: 'first_name', body: 'firstName', trim: true },
  { db: 'last_name', body: 'lastName', trim: true },
  { db: 'title' },
  { db: 'email' },
  { db: 'phone' },
  { db: 'is_primary', body: 'isPrimary', transform: (v) => v ? 1 : 0 },
  { db: 'aviation_contract_id', body: 'aviationContractId' },
]

export const contactsConfig: CrudConfig = {
  table: 'contacts', alias: 'c', entityName: 'Contact', responseKey: 'contacts',
  columns: {
    id: 'id', contractorId: 'contractor_id', firstName: 'first_name', lastName: 'last_name',
    title: 'title', email: 'email', phone: 'phone', isPrimary: 'is_primary',
    aviationContractId: 'aviation_contract_id', source: 'source', isActive: 'is_active',
    createdAt: 'created_at', updatedAt: 'updated_at',
  },
  joins: [{ table: 'contractors', alias: 'ct', on: 'c.contractor_id = ct.id', camelKey: 'contractor', nullValue: undefined }],
  sortColumns: {
    firstName: 'c.first_name', lastName: 'c.last_name', email: 'c.email',
    title: 'c.title', isPrimary: 'c.is_primary', createdAt: 'c.created_at',
  },
  defaultSort: 'createdAt',
  searchColumns: ['first_name', 'last_name', 'email', 'title'],
  requiredFields: { contractorId: 'Contractor is required', firstName: 'First name is required', lastName: 'Last name is required' },
  updateFields: contactUpdateFields,
  insertColumns: ['id', 'contractor_id', 'first_name', 'last_name', 'title', 'email', 'phone', 'is_primary', 'aviation_contract_id', 'source'],
  insertMapper: contactInsertMapper,
  import: {
    requiredHeaders: { first: 'CSV must have "firstName" and "lastName" columns', last: 'CSV must have "firstName" and "lastName" columns' },
    requiredFields: ['firstName', 'lastName'],
    headerKeywords: {
      firstName: ['first'], lastName: ['last'], email: ['email'], phone: ['phone'],
      title: ['title'], isPrimary: ['primary'],
    },
    defaults: {},
    contractorMatch: { csvField: 'company', entityField: 'contractorId', fallbackToFirst: true },
  },
}

// ─── Contractors ───
const contractorInsertMapper = (body: Record<string, unknown>, _id: string, _now: string): (string | number | null)[] => [
  ((body.name as string)?.trim() ?? null),
  (body.uei as string) || null, (body.duns as string) || null, (body.address as string) || null,
  (body.city as string) || null, (body.state as string) || null, (body.zipCode as string) || null,
  (body.phone as string) || null, (body.website as string) || null,
  (body.contractingTier as string) || 'Free', (body.notes as string) || null,
  (body.aviationContractId as string) || null, (body.email1 as string) || null,
  (body.email2 as string) || null, (body.email3 as string) || null,
]

const contractorUpdateFields: FieldMapping[] = [
  { db: 'name', trim: true },
  { db: 'uei' }, { db: 'duns' }, { db: 'address' }, { db: 'city' }, { db: 'state' },
  { db: 'zip_code', body: 'zipCode' }, { db: 'phone' }, { db: 'website' },
  { db: 'email_1', body: 'email1' }, { db: 'email_2', body: 'email2' }, { db: 'email_3', body: 'email3' },
  { db: 'contracting_tier', body: 'contractingTier' }, { db: 'notes' },
]

export const contractorsConfig: CrudConfig = {
  table: 'contractors', alias: 'c', entityName: 'Contractor', responseKey: 'contractors',
  columns: {
    id: 'id', name: 'name', uei: 'uei', duns: 'duns', address: 'address',
    city: 'city', state: 'state', zipCode: 'zip_code', phone: 'phone', website: 'website',
    contractingTier: 'contracting_tier', notes: 'notes', aviationContractId: 'aviation_contract_id',
    email1: 'email_1', email2: 'email_2', email3: 'email_3',
    isActive: 'is_active', createdAt: 'created_at', updatedAt: 'updated_at',
  },
  sortColumns: { name: 'c.name', city: 'c.city', state: 'c.state', createdAt: 'c.created_at' },
  defaultSort: 'createdAt',
  searchColumns: ['name', 'city', 'state', 'uei', 'duns'],
  requiredFields: { name: 'Name is required' },
  updateFields: contractorUpdateFields,
  insertColumns: ['id', 'name', 'uei', 'duns', 'address', 'city', 'state', 'zip_code', 'phone', 'website', 'contracting_tier', 'notes', 'aviation_contract_id', 'email_1', 'email_2', 'email_3'],
  insertMapper: contractorInsertMapper,
  detailExtra: async (id, db) => {
    const contactsResult = await db.execute({ sql: 'SELECT * FROM contacts WHERE contractor_id = ? AND is_active = 1', args: [id] })
    const complianceResult = await db.execute({ sql: 'SELECT * FROM compliance WHERE contractor_id = ? AND is_active = 1', args: [id] })
    return {
      contacts: contactsResult.rows.map(r => ({
        id: r.id, contractorId: r.contractor_id, firstName: r.first_name, lastName: r.last_name,
        title: r.title, email: r.email, phone: r.phone, isPrimary: r.is_primary === 1,
        aviationContractId: r.aviation_contract_id, isActive: r.is_active === 1,
        createdAt: r.created_at, updatedAt: r.updated_at,
      })),
      compliance: complianceResult.rows.map(r => ({
        id: r.id, contractorId: r.contractor_id, aviationContractId: r.aviation_contract_id,
        type: r.type, status: r.status, requirement: r.requirement, documentation: r.documentation,
        expiryDate: r.expiry_date, lastAuditDate: r.last_audit_date, nextAuditDate: r.next_audit_date,
        riskLevel: r.risk_level, priority: r.priority, scope: r.scope, notes: r.notes,
        isActive: r.is_active === 1, createdAt: r.created_at, updatedAt: r.updated_at,
      })),
    }
  },
  import: {
    requiredHeaders: { name: 'CSV must have a "name" column' },
    requiredFields: ['name'],
    headerKeywords: {
      name: ['name'], uei: ['uei'], duns: ['duns'], city: ['city'], state: ['state'],
      contractingTier: ['tier', 'contracting'], email1: ['email1', 'email_1'],
      email2: ['email2', 'email_2'], email3: ['email3', 'email_3'], phone: ['phone'],
    },
    defaults: {},
  },
}

// ─── Contracts ───
const contractInsertMapper = (body: Record<string, unknown>, _id: string, _now: string): (string | number | null)[] => [
  (body._generatedNumber as string) || '',
  ((body.title as string)?.trim() ?? null),
  (body.contractorId as string) || null, (body.contactId as string) || null,
  (body.status as string) || 'Draft',
  (body.totalAmount as number) || 0, (body.taxAmount as number) || 0, (body.shippingAmount as number) || 0,
  (body.currency as string) || 'USD',
  (body.startDate as string) || null, (body.endDate as string) || null,
  (body.paymentTerms as string) || null, (body.deliveryTerms as string) || null,
  (body.notes as string) || null, (body.internalNotes as string) || null,
]

const contractUpdateFields: FieldMapping[] = [
  { db: 'title', trim: true },
  { db: 'contractor_id', body: 'contractorId' }, { db: 'contact_id', body: 'contactId' },
  { db: 'status' }, { db: 'total_amount', body: 'totalAmount' },
  { db: 'tax_amount', body: 'taxAmount' }, { db: 'shipping_amount', body: 'shippingAmount' },
  { db: 'currency' }, { db: 'start_date', body: 'startDate' }, { db: 'end_date', body: 'endDate' },
  { db: 'payment_terms', body: 'paymentTerms' }, { db: 'delivery_terms', body: 'deliveryTerms' },
  { db: 'notes' }, { db: 'internal_notes', body: 'internalNotes' },
]

async function generateContractNumber() {
  const year = new Date().getFullYear()
  const maxResult = await client.execute({
    sql: `SELECT contract_number FROM contracts WHERE contract_number LIKE ? ORDER BY contract_number DESC LIMIT 1`,
    args: [`CTR-${year}-%`],
  })
  let nextNum = 1
  if (maxResult.rows.length > 0) {
    const lastNum = parseInt((maxResult.rows[0].contract_number as string).split('-').pop() || '0')
    nextNum = lastNum + 1
  }
  return `CTR-${year}-${String(nextNum).padStart(4, '0')}`
}

export const contractsConfig: CrudConfig = {
  table: 'contracts', alias: 'co', entityName: 'Contract', responseKey: 'contracts',
  createStatus: 201,
  columns: {
    id: 'id', contractNumber: 'contract_number', title: 'title',
    contractorId: 'contractor_id', contactId: 'contact_id', status: 'status',
    totalAmount: 'total_amount', taxAmount: 'tax_amount', shippingAmount: 'shipping_amount',
    currency: 'currency', startDate: 'start_date', endDate: 'end_date',
    paymentTerms: 'payment_terms', deliveryTerms: 'delivery_terms',
    notes: 'notes', internalNotes: 'internal_notes',
    isActive: 'is_active', createdAt: 'created_at', updatedAt: 'updated_at',
  },
  joins: [
    { table: 'contractors', alias: 'ct', on: 'co.contractor_id = ct.id', camelKey: 'contractor', nullValue: null },
    { table: 'contacts', alias: 'c', on: 'co.contact_id = c.id', camelKey: 'contact', nullValue: null, nameColumn: null, extraFields: ['firstName', 'lastName'] },
  ],
  sortColumns: {
    contractNumber: 'co.contract_number', title: 'co.title', status: 'co.status',
    totalAmount: 'co.total_amount', createdAt: 'co.created_at',
  },
  defaultSort: 'createdAt',
  searchColumns: ['contract_number', 'title'],
  searchTable: 'co',
  filters: ['status'],
  requiredFields: { title: 'Title is required' },
  updateFields: contractUpdateFields,
  insertColumns: ['id', 'contract_number', 'title', 'contractor_id', 'contact_id', 'status', 'total_amount', 'tax_amount', 'shipping_amount', 'currency', 'start_date', 'end_date', 'payment_terms', 'delivery_terms', 'notes', 'internal_notes'],
  insertMapper: async (body, id, now) => {
    const contractNumber = await generateContractNumber()
    body._generatedNumber = contractNumber
    return contractInsertMapper(body, id, now)
  },
  import: {
    requiredHeaders: { title: 'CSV must have a "title" column' },
    requiredFields: ['title'],
    headerKeywords: {
      title: ['title'], status: ['status'], totalAmount: ['amount', 'total'],
      startDate: ['start'], endDate: ['end'], notes: ['notes'],
    },
    defaults: {},
    contractorMatch: { csvField: 'contractor', entityField: 'contractorId' },
  },
}

// ─── Compliance ───
const complianceInsertMapper = (body: Record<string, unknown>, _id: string, _now: string): (string | number | null)[] => [
  body.contractorId as string ?? null,
  (body.aviationContractId as string) || null,
  ((body.type as string)?.trim() ?? null),
  (body.status as string) || 'Pending',
  ((body.requirement as string)?.trim() ?? null),
  (body.documentation as string) || null,
  (body.expiryDate as string) || null,
  (body.lastAuditDate as string) || null, (body.nextAuditDate as string) || null,
  (body.riskLevel as string) || 'Medium', (body.priority as number) || 0,
  (body.scope as string) || 'Contract', (body.notes as string) || null,
]

const complianceUpdateFields: FieldMapping[] = [
  { db: 'type', trim: true }, { db: 'status' }, { db: 'requirement', trim: true },
  { db: 'documentation' }, { db: 'expiry_date', body: 'expiryDate' },
  { db: 'last_audit_date', body: 'lastAuditDate' }, { db: 'next_audit_date', body: 'nextAuditDate' },
  { db: 'risk_level', body: 'riskLevel' }, { db: 'priority' }, { db: 'scope' }, { db: 'notes' },
]

export const complianceConfig: CrudConfig = {
  table: 'compliance', alias: 'co', entityName: 'Compliance record', responseKey: 'records',
  columns: {
    id: 'id', contractorId: 'contractor_id', aviationContractId: 'aviation_contract_id',
    type: 'type', status: 'status', requirement: 'requirement', documentation: 'documentation',
    expiryDate: 'expiry_date', lastAuditDate: 'last_audit_date', nextAuditDate: 'next_audit_date',
    riskLevel: 'risk_level', priority: 'priority', scope: 'scope', notes: 'notes',
    isActive: 'is_active', createdAt: 'created_at', updatedAt: 'updated_at',
  },
  joins: [{ table: 'contractors', alias: 'ct', on: 'co.contractor_id = ct.id', camelKey: 'contractor', nullValue: undefined }],
  sortColumns: {
    type: 'co.type', status: 'co.status', riskLevel: 'co.risk_level', createdAt: 'co.created_at',
  },
  defaultSort: 'createdAt',
  searchColumns: ['type', 'requirement', 'documentation', 'notes'],
  searchTable: 'co',
  filters: ['status', 'type', 'riskLevel'],
  filterColumns: { riskLevel: 'co.risk_level' },
  requiredFields: { contractorId: 'Contractor is required', type: 'Type is required', requirement: 'Requirement is required' },
  updateFields: complianceUpdateFields,
  insertColumns: ['id', 'contractor_id', 'aviation_contract_id', 'type', 'status', 'requirement', 'documentation', 'expiry_date', 'last_audit_date', 'next_audit_date', 'risk_level', 'priority', 'scope', 'notes'],
  insertMapper: complianceInsertMapper,
  import: {
    requiredHeaders: { type: 'CSV must have "type" and "requirement" columns', requirement: 'CSV must have "type" and "requirement" columns' },
    requiredFields: ['type', 'requirement'],
    headerKeywords: {
      type: ['type'], status: ['status'], requirement: ['requirement'],
      documentation: ['documentation'], expiryDate: ['expiry'],
      riskLevel: ['risk'], scope: ['scope'], notes: ['notes'],
    },
    defaults: {},
    contractorMatch: { csvField: 'company', entityField: 'contractorId', fallbackToFirst: true },
  },
}

// ─── Inquiries ───
const inquiryInsertMapper = (body: Record<string, unknown>, _id: string, _now: string): (string | number | null)[] => [
  (body._generatedNumber as string) || '',
  ((body.partNumber as string)?.trim() ?? null),
  (body.partDescription as string) || null,
  (body.contractorId as string) || null, (body.aviationContractId as string) || null,
  (body.status as string) || 'Draft', (body.notes as string) || null,
]

const inquiryUpdateFields: FieldMapping[] = [
  { db: 'part_number', body: 'partNumber', trim: true },
  { db: 'part_description', body: 'partDescription' },
  { db: 'contractor_id', body: 'contractorId' },
  { db: 'status', trim: true }, { db: 'notes' },
]

async function generateInquiryNumber() {
  const year = new Date().getFullYear()
  const seqResult = await client.execute({
    sql: `SELECT COUNT(*) as cnt FROM inquiries WHERE inquiry_id LIKE ?`,
    args: [`INQ-${year}-%`],
  })
  const seq = Number(seqResult.rows[0]?.cnt || 0) + 1
  return `INQ-${year}-${String(seq).padStart(4, '0')}`
}

export const inquiriesConfig: CrudConfig = {
  table: 'inquiries', alias: 'i', entityName: 'Inquiry', responseKey: 'inquiries',
  columns: {
    id: 'id', inquiryId: 'inquiry_id', partNumber: 'part_number',
    partDescription: 'part_description', contractorId: 'contractor_id',
    aviationContractId: 'aviation_contract_id', status: 'status', notes: 'notes',
    isActive: 'is_active', createdAt: 'created_at', updatedAt: 'updated_at',
  },
  joins: [{ table: 'contractors', alias: 'ct', on: 'i.contractor_id = ct.id', camelKey: 'contractor', nullValue: undefined }],
  sortColumns: {
    inquiryId: 'i.inquiry_id', partNumber: 'i.part_number', status: 'i.status', createdAt: 'i.created_at',
  },
  defaultSort: 'createdAt',
  searchColumns: ['inquiry_id', 'part_number', 'part_description', 'notes'],
  filters: ['status'],
  requiredFields: { partNumber: 'Part number is required' },
  updateFields: inquiryUpdateFields,
  insertColumns: ['id', 'inquiry_id', 'part_number', 'part_description', 'contractor_id', 'aviation_contract_id', 'status', 'notes'],
  insertMapper: async (body, id, now) => {
    const inquiryId = await generateInquiryNumber()
    body._generatedNumber = inquiryId
    return inquiryInsertMapper(body, id, now)
  },
  import: {
    requiredHeaders: { partnumber: 'CSV must have a "partNumber" column' },
    requiredFields: ['partNumber'],
    headerKeywords: {
      inquiryId: ['inquiryid', 'inquiry_id'], partNumber: ['partnumber', 'part_number'],
      partDescription: ['partdescription', 'part_description'], status: ['status'], notes: ['notes'],
    },
    defaults: {},
    contractorMatch: { csvField: 'contractor', entityField: 'contractorId' },
  },
}

// ─── Outreach ───
const outreachInsertMapper = (body: Record<string, unknown>, _id: string, _now: string): (string | number | null)[] => [
  body.contractorId as string, (body.contactId as string) || null, (body.aviationContractId as string) || null,
  (body.status as string) || 'Pending', (body.priority as string) || 'Medium', (body.subject as string) || null,
  (body.notes as string) || null, (body.interactionDate as string) || null, (body.followUpDate as string) || null,
  (body.sentDate as string) || null, (body.inquiryId as string) || null,
]

const outreachUpdateFields: FieldMapping[] = [
  { db: 'contractor_id', body: 'contractorId' }, { db: 'contact_id', body: 'contactId' },
  { db: 'aviation_contract_id', body: 'aviationContractId' },
  { db: 'status' }, { db: 'priority' }, { db: 'subject' }, { db: 'notes' },
  { db: 'interaction_date', body: 'interactionDate' }, { db: 'follow_up_date', body: 'followUpDate' },
  { db: 'sent_date', body: 'sentDate' }, { db: 'inquiry_id', body: 'inquiryId' },
]

export const outreachConfig: CrudConfig = {
  table: 'outreach', alias: 'o', entityName: 'Outreach', responseKey: 'outreach',
  columns: {
    id: 'id', contractorId: 'contractor_id', contactId: 'contact_id',
    aviationContractId: 'aviation_contract_id', status: 'status', priority: 'priority',
    subject: 'subject', notes: 'notes', interactionDate: 'interaction_date',
    followUpDate: 'follow_up_date', sentDate: 'sent_date', inquiryId: 'inquiry_id',
    isActive: 'is_active', createdAt: 'created_at', updatedAt: 'updated_at',
  },
  joins: [{ table: 'contractors', alias: 'ct', on: 'o.contractor_id = ct.id', camelKey: 'contractor', nullValue: null }],
  sortColumns: {
    subject: 'o.subject', status: 'o.status', priority: 'o.priority',
    followUpDate: 'o.follow_up_date', createdAt: 'o.created_at',
  },
  defaultSort: 'createdAt',
  searchColumns: ['subject', 'notes'],
  searchTable: 'o',
  filters: ['status', 'priority'],
  requiredFields: { contractorId: 'Contractor is required' },
  updateFields: outreachUpdateFields,
  insertColumns: ['id', 'contractor_id', 'contact_id', 'aviation_contract_id', 'status', 'priority', 'subject', 'notes', 'interaction_date', 'follow_up_date', 'sent_date', 'inquiry_id'],
  insertMapper: outreachInsertMapper,
  import: {
    requiredHeaders: {},
    requiredFields: [],
    headerKeywords: {
      subject: ['subject'], status: ['status'], priority: ['priority'],
      followUpDate: ['followup', 'follow_up', 'followupdate'], notes: ['notes'],
    },
    defaults: {},
    contractorMatch: { csvField: 'company', entityField: 'contractorId', fallbackToFirst: true },
  },
}

// ─── SAM Data (Federal Contracts) ───
const samDataInsertMapper = (body: Record<string, unknown>, _id: string, _now: string): (string | number | null)[] => [
  (body.awardIdPiid as string) || '',
  (body.recipientName as string) || '',
  (body.totalObligatedAmount as number) || 0,
  (body.periodOfPerformanceCurrentEndDate as string) || null,
  (body.naicsDescription as string) || null,
  (body.productOrServiceCodeDescription as string) || null,
  (body.awardingAgencyName as string) || null,
]

const samDataUpdateFields: FieldMapping[] = [
  { db: 'award_id_piid', body: 'awardIdPiid', trim: true },
  { db: 'recipient_name', body: 'recipientName', trim: true },
  { db: 'total_obligated_amount', body: 'totalObligatedAmount' },
  { db: 'period_of_performance_current_end_date', body: 'periodOfPerformanceCurrentEndDate' },
  { db: 'naics_description', body: 'naicsDescription' },
  { db: 'product_or_service_code_description', body: 'productOrServiceCodeDescription' },
  { db: 'awarding_agency_name', body: 'awardingAgencyName' },
]

export const samDataConfig: CrudConfig = {
  table: 'SAM_Data', alias: 's', entityName: 'SAM Record', responseKey: 'records',
  columns: {
    id: 'id', awardIdPiid: 'award_id_piid', recipientName: 'recipient_name',
    totalObligatedAmount: 'total_obligated_amount',
    periodOfPerformanceCurrentEndDate: 'period_of_performance_current_end_date',
    naicsDescription: 'naics_description',
    productOrServiceCodeDescription: 'product_or_service_code_description',
    awardingAgencyName: 'awarding_agency_name',
    isActive: 'is_active', createdAt: 'created_at', updatedAt: 'updated_at',
  },
  sortColumns: {
    awardIdPiid: 's.award_id_piid', recipientName: 's.recipient_name',
    totalObligatedAmount: 's.total_obligated_amount',
    periodOfPerformanceCurrentEndDate: 's.period_of_performance_current_end_date',
    awardingAgencyName: 's.awarding_agency_name', createdAt: 's.created_at',
  },
  defaultSort: 'createdAt',
  searchColumns: ['award_id_piid', 'recipient_name', 'naics_description', 'product_or_service_code_description', 'awarding_agency_name'],
  requiredFields: { awardIdPiid: 'Award ID/PIID is required', recipientName: 'Recipient name is required' },
  updateFields: samDataUpdateFields,
  insertColumns: ['id', 'award_id_piid', 'recipient_name', 'total_obligated_amount', 'period_of_performance_current_end_date', 'naics_description', 'product_or_service_code_description', 'awarding_agency_name'],
  insertMapper: samDataInsertMapper,
  import: {
    requiredHeaders: { award: 'CSV must have an "award_id_piid" column', recipient: 'CSV must have a "recipient_name" column' },
    requiredFields: ['awardIdPiid', 'recipientName'],
    headerKeywords: {
      awardIdPiid: ['award_id_piid', 'awardidpiid', 'piid', 'award'],
      recipientName: ['recipient_name', 'recipientname', 'recipient', 'company', 'name'],
      totalObligatedAmount: ['total_obligated_amount', 'amount', 'total', 'obligated'],
      periodOfPerformanceCurrentEndDate: ['end_date', 'end date', 'period', 'performance'],
      naicsDescription: ['naics', 'description'],
      productOrServiceCodeDescription: ['product', 'service', 'psc'],
      awardingAgencyName: ['agency', 'awarding'],
    },
    defaults: {},
  },
}
