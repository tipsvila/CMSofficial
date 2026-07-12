import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { SAMData, contractors, outreach, compliance, inquiries, rfqs, orders, notifications } from '@/lib/schema'
import { eq, count, sum, sql, and, gte, lte, ilike, type SQL } from 'drizzle-orm'
import { ensureDb } from '@/lib/db-ready'

export async function GET(request: Request) {
  try {
    await ensureDb()
    
    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url)
    const dateRange = searchParams.get('dateRange') // e.g., "2024-01-01,2024-12-31"
    const agency = searchParams.get('agency')
    const status = searchParams.get('status')
    
    // Build filter conditions
    const filters: SQL<unknown>[] = []
    
    if (dateRange) {
      const parts = dateRange.split(',')
      const startDate = parts[0]?.trim()
      const endDate = parts[1]?.trim()
      if (startDate && endDate) {
        filters.push(gte(SAMData.createdAt, startDate))
        filters.push(lte(SAMData.createdAt, endDate))
      }
    }
    
    if (agency) {
      filters.push(ilike(SAMData.agencyName, `%${agency}%`))
    }
    
    // Note: SAMData has no status column; status filter is not applicable here
    
    // Apply filters to queries
    const whereClause = filters.length > 0 ? and(...filters) : undefined
    
    const [
      totalContracts,
      totalContractors,
      totalOutreach,
      pendingOutreach,
      activeContracts,
      totalInquiries,
      openInquiries,
      wonInquiries,
      totalRfqs,
      openRfqs,
      awardedRfqs,
      totalOrders,
      pendingOrders,
      unreadNotifications,
      complianceStats,
      recentOutreach,
      totalValueResult,
      revenueResult,
      agencyRaw,
      // Add trends data queries
      monthlyContracts,
      monthlyOutreach,
      monthlyInquiries,
    ] = await Promise.all([
      // Basic counts — filter is_active=1 to match what pages show
      db.select({ value: count() }).from(SAMData).where(eq(SAMData.isActive, true)),
      db.select({ value: count() }).from(contractors).where(eq(contractors.isActive, true)),
      db.select({ value: count() }).from(outreach).where(eq(outreach.isActive, true)),
      db.select({ value: count() }).from(outreach).where(and(eq(outreach.status, 'Pending'), eq(outreach.isActive, true))),
      db.select({ value: count() }).from(SAMData).where(eq(SAMData.isActive, true)),
      db.select({ value: count() }).from(inquiries).where(eq(inquiries.isActive, true)),
      db.select({ value: count() }).from(inquiries).where(and(sql`${inquiries.status} IN ('Draft', 'Open', 'Quoted')`, eq(inquiries.isActive, true))),
      db.select({ value: count() }).from(inquiries).where(and(eq(inquiries.status, 'Won'), eq(inquiries.isActive, true))),
      db.select({ value: count() }).from(rfqs).where(eq(rfqs.isActive, true)),
      db.select({ value: count() }).from(rfqs).where(and(eq(rfqs.status, 'Published'), eq(rfqs.isActive, true))),
      db.select({ value: count() }).from(rfqs).where(and(eq(rfqs.status, 'Awarded'), eq(rfqs.isActive, true))),
      db.select({ value: count() }).from(orders),
      db.select({ value: count() }).from(orders).where(eq(orders.status, 'Pending')),
      db.select({ value: count() }).from(notifications).where(eq(notifications.isRead, false)),
      db.select({ status: compliance.status, cnt: count() }).from(compliance).where(eq(compliance.isActive, true)).groupBy(compliance.status),
      db.select({
        id: outreach.id,
        contractorId: outreach.contractorId,
        status: outreach.status,
        priority: outreach.priority,
        subject: outreach.subject,
        createdAt: outreach.createdAt,
        contractorName: contractors.name,
      }).from(outreach)
        .leftJoin(contractors, eq(outreach.contractorId, contractors.id))
        .where(eq(outreach.isActive, true))
        .orderBy(sql`${outreach.createdAt} DESC`)
        .limit(5),
      db.select({ value: sum(SAMData.obligatedAmount) }).from(SAMData).where(eq(SAMData.isActive, true)),
      db.select({ value: sum(orders.totalAmount) }).from(orders).where(sql`${orders.status} IN ('Completed', 'Delivered')`),
      db.select({
        agency: SAMData.agencyName,
        cnt: count(),
        total: sum(SAMData.obligatedAmount),
      }).from(SAMData)
        .where(and(sql`${SAMData.agencyName} IS NOT NULL`, eq(SAMData.isActive, true)))
        .groupBy(SAMData.agencyName)
        .orderBy(sql`sum(${SAMData.obligatedAmount}) DESC`)
        .limit(5),
      // Trends data - monthly contracts (SQLite strftime)
      db.select({
        month: sql`strftime('%Y-%m', ${SAMData.createdAt})`,
        count: count(),
        total: sum(SAMData.obligatedAmount),
      }).from(SAMData)
        .where(whereClause)
        .groupBy(sql`strftime('%Y-%m', ${SAMData.createdAt})`)
        .orderBy(sql`strftime('%Y-%m', ${SAMData.createdAt})`)
        .limit(12),
      // Trends data - monthly outreach (SQLite strftime)
      db.select({
        month: sql`strftime('%Y-%m', ${outreach.createdAt})`,
        count: count(),
      }).from(outreach)
        .groupBy(sql`strftime('%Y-%m', ${outreach.createdAt})`)
        .orderBy(sql`strftime('%Y-%m', ${outreach.createdAt})`)
        .limit(12),
      // Trends data - monthly inquiries (SQLite strftime)
      db.select({
        month: sql`strftime('%Y-%m', ${inquiries.createdAt})`,
        count: count(),
      }).from(inquiries)
        .groupBy(sql`strftime('%Y-%m', ${inquiries.createdAt})`)
        .orderBy(sql`strftime('%Y-%m', ${inquiries.createdAt})`)
        .limit(12),
    ])

    const totalContractValue = Number(totalValueResult[0]?.value || 0)
    const totalRevenue = Number(revenueResult[0]?.value || 0)

    const complianceMap: Record<string, number> = {}
    for (const row of complianceStats) {
      complianceMap[row.status] = row.cnt
    }

    // Format trends data for charts
    const trends = {
      contracts: monthlyContracts.map((r) => ({
        month: r.month,
        count: r.count,
        total: Number(r.total || 0),
      })),
      outreach: monthlyOutreach.map((r) => ({
        month: r.month,
        count: r.count,
      })),
      inquiries: monthlyInquiries.map((r) => ({
        month: r.month,
        count: r.count,
      })),
    }

    return NextResponse.json({
      stats: {
        totalContracts: totalContracts[0]?.value || 0,
        totalContractors: totalContractors[0]?.value || 0,
        totalOutreach: totalOutreach[0]?.value || 0,
        pendingOutreach: pendingOutreach[0]?.value || 0,
        activeContracts: activeContracts[0]?.value || 0,
        totalContractValue,
        compliance: complianceMap,
        totalInquiries: totalInquiries[0]?.value || 0,
        openInquiries: openInquiries[0]?.value || 0,
        wonInquiries: wonInquiries[0]?.value || 0,
        completedChecklists: 0,
        totalRfqs: totalRfqs[0]?.value || 0,
        openRfqs: openRfqs[0]?.value || 0,
        awardedRfqs: awardedRfqs[0]?.value || 0,
        totalOrders: totalOrders[0]?.value || 0,
        pendingOrders: pendingOrders[0]?.value || 0,
        totalRevenue,
        unreadNotifications: unreadNotifications[0]?.value || 0,
      },
      samData: {
        totalRecords: totalContracts[0]?.value || 0,
        activeContracts: activeContracts[0]?.value || 0,
        pipelineValue: totalContractValue,
        topAgencies: agencyRaw
          .filter((r) => Number(r.total || 0) > 0)
          .map((r) => ({
            agency: r.agency || 'Unknown',
            count: r.cnt,
            total: Number(r.total || 0),
          })),
      },
      recentOutreach: recentOutreach.map((r) => ({
        id: r.id,
        contractorId: r.contractorId,
        status: r.status,
        priority: r.priority,
        subject: r.subject,
        createdAt: r.createdAt,
        contractor: { name: r.contractorName || '-' },
      })),
      agencySummary: agencyRaw.map((r) => ({
        agency: r.agency || 'Unknown',
        count: r.cnt,
        total: Number(r.total || 0),
      })),
      trends,
      filters: {
        dateRange,
        agency,
        status,
      },
    })
  } catch (error) {
    console.error('GET /api/dashboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}