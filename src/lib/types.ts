export interface DashboardStats {
  stats: {
    totalContracts: number
    totalContractors: number
    totalOutreach: number
    pendingOutreach: number
    activeContracts: number
    totalContractValue: number
    compliance: Record<string, number>
    totalInquiries: number
    openInquiries: number
    wonInquiries: number
    completedChecklists: number
    totalRfqs: number
    openRfqs: number
    awardedRfqs: number
    totalOrders: number
    pendingOrders: number
    totalRevenue: number
    unreadNotifications: number
  }
  recentOutreach: Outreach[]
  agencySummary: { agency: string; count: number; total: number }[]
}

export interface Outreach {
  id: string
  contractorId: string
  contactId?: string | null
  status: string
  priority: string
  subject?: string | null
  notes?: string | null
  interactionDate?: string | null
  followUpDate?: string | null
  sentDate?: string | null
  inquiryId?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  contractor?: { id: string; name: string }
}

export interface Document {
  id: string
  contractorId?: string | null
  fileName: string
  fileType?: string | null
  fileSize?: number | null
  filePath?: string | null
  notes?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  contractor?: { id: string; name: string }
}

export interface Contractor {
  id: string
  name: string
  uei?: string | null
  duns?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  phone?: string | null
  email1?: string | null
  email2?: string | null
  email3?: string | null
  website?: string | null
  contractingTier?: string | null
  notes?: string | null
  createdAt: string
  isActive: boolean
}

export interface Contact {
  id: string
  contractorId: string
  firstName: string
  lastName: string
  title?: string | null
  email?: string | null
  phone?: string | null
  isPrimary: boolean
  aviationContractId?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  contractor?: { id: string; name: string }
  aviationContract?: { id: string; awardIdPiid: string } | null
}

export interface Inquiry {
  id: string
  inquiryId: string
  partNumber: string
  partDescription?: string | null
  contractorId: string
  aviationContractId?: string | null
  status: string
  notes?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  contractor?: { id: string; name: string }
}

export interface Compliance {
  id: string
  contractorId: string
  aviationContractId?: string | null
  type: string
  status: string
  requirement: string
  documentation?: string | null
  expiryDate?: string | null
  lastAuditDate?: string | null
  nextAuditDate?: string | null
  riskLevel?: string | null
  priority?: number | null
  scope?: string | null
  notes?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  contractor?: { id: string; name: string }
}

export interface Contract {
  id: string
  contractNumber: string
  title: string
  contractorId?: string | null
  contactId?: string | null
  status: string
  totalAmount?: number | null
  taxAmount?: number | null
  shippingAmount?: number | null
  currency?: string | null
  startDate?: string | null
  endDate?: string | null
  paymentTerms?: string | null
  deliveryTerms?: string | null
  notes?: string | null
  internalNotes?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  contractor?: { id: string; name: string }
  contact?: { id: string; firstName: string; lastName: string; email?: string }
}
