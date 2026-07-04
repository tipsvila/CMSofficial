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
  status: string
  priority: string
  subject?: string | null
  createdAt: string
  contractor?: { name: string }
}

export interface Contractor {
  id: string
  name: string
  uei?: string | null
  duns?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  phone?: string | null
  email1?: string | null
  website?: string | null
  contractingTier?: string | null
  notes?: string | null
  createdAt: string
  isActive: boolean
}
