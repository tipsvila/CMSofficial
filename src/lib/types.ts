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
  samData: {
    totalRecords: number
    activeContracts: number
    pipelineValue: number
    topAgencies: { agency: string; count: number; total: number }[]
  }
  recentOutreach: { id: string; contractorId: string; status: string; priority: string; subject?: string; createdAt: string; contractor?: { name: string } }[]
  agencySummary: { agency: string; count: number; total: number }[]
  trends: {
    contracts: { month: string; count: number; total: number }[]
    outreach: { month: string; count: number }[]
    inquiries: { month: string; count: number }[]
  }
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
