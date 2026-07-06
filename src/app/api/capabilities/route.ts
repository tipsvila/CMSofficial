import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { capabilities, contractors } from '@/lib/schema'
import { eq, count, sum, sql, desc } from 'drizzle-orm'
import { ensureDb } from '@/lib/db-ready'

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function now(): string {
  return new Date().toISOString()
}

export async function GET() {
  try {
    await ensureDb()

    const allCapabilities = await db.select({
      id: capabilities.id,
      contractorId: capabilities.contractorId,
      category: capabilities.category,
      name: capabilities.name,
      description: capabilities.description,
      status: capabilities.status,
      certificationLevel: capabilities.certificationLevel,
      expiryDate: capabilities.expiryDate,
      naicsCode: capabilities.naicsCode,
      aircraftTypes: capabilities.aircraftTypes,
      partNumbers: capabilities.partNumbers,
      estimatedValue: capabilities.estimatedValue,
      priority: capabilities.priority,
      notes: capabilities.notes,
      isActive: capabilities.isActive,
      createdAt: capabilities.createdAt,
      updatedAt: capabilities.updatedAt,
      contractorName: contractors.name,
    }).from(capabilities)
      .leftJoin(contractors, eq(capabilities.contractorId, contractors.id))
      .where(eq(capabilities.isActive, true))
      .orderBy(desc(capabilities.createdAt))

    const statsResult = await Promise.all([
      db.select({ value: count() }).from(capabilities).where(eq(capabilities.isActive, true)),
      db.select({ value: count() }).from(capabilities).where(sql`${capabilities.status} = 'Active'`),
      db.select({ value: count() }).from(capabilities).where(sql`${capabilities.status} = 'Expired'`),
      db.select({ value: sum(capabilities.estimatedValue) }).from(capabilities).where(eq(capabilities.isActive, true)),
    ])

    const categoryStats = await db.select({
      category: capabilities.category,
      cnt: count(),
    }).from(capabilities)
      .where(eq(capabilities.isActive, true))
      .groupBy(capabilities.category)
      .orderBy(desc(count()))

    return NextResponse.json({
      capabilities: allCapabilities.map((c) => ({
        ...c,
        contractor: { name: c.contractorName || 'Unassigned' },
      })),
      stats: {
        total: statsResult[0][0]?.value || 0,
        active: statsResult[1][0]?.value || 0,
        expired: statsResult[2][0]?.value || 0,
        totalValue: Number(statsResult[3][0]?.value || 0),
      },
      categoryBreakdown: categoryStats.map((r) => ({
        category: r.category,
        count: r.cnt,
      })),
    })
  } catch (error) {
    console.error('GET /api/capabilities error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await ensureDb()
    const body = await request.json()

    const id = uid()
    const ts = now()

    await db.insert(capabilities).values({
      id,
      contractorId: body.contractorId || null,
      category: body.category,
      name: body.name,
      description: body.description || null,
      status: body.status || 'Active',
      certificationLevel: body.certificationLevel || null,
      expiryDate: body.expiryDate || null,
      naicsCode: body.naicsCode || null,
      aircraftTypes: body.aircraftTypes || null,
      partNumbers: body.partNumbers || null,
      estimatedValue: body.estimatedValue || 0,
      priority: body.priority || 'Medium',
      notes: body.notes || null,
      isActive: true,
      createdAt: ts,
      updatedAt: ts,
    })

    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error('POST /api/capabilities error:', error)
    return NextResponse.json({ error: 'Failed to create capability' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    await ensureDb()
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    await db.update(capabilities)
      .set({ ...updates, updatedAt: now() })
      .where(eq(capabilities.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PUT /api/capabilities error:', error)
    return NextResponse.json({ error: 'Failed to update capability' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    await ensureDb()
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    await db.update(capabilities)
      .set({ isActive: false, updatedAt: now() })
      .where(eq(capabilities.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/capabilities error:', error)
    return NextResponse.json({ error: 'Failed to delete capability' }, { status: 500 })
  }
}
