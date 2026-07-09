import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { companySettings } from '@/lib/schema'
import { ensureDb } from '@/lib/db-ready'
import { clearSettingsCache } from '@/lib/company-settings'
import { eq } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth-check'

export async function GET() {
  try {
    await ensureDb()
    const settings = await db.select().from(companySettings).limit(1)
    if (settings.length === 0) {
      return NextResponse.json({ success: true, data: { companyName: 'INTAEROBASE', tagline: 'Aviation CMS' } })
    }
    return NextResponse.json({ success: true, data: settings[0] })
  } catch (error) {
    console.error('GET /api/settings error:', error)
    return NextResponse.json({ success: true, data: { companyName: 'INTAEROBASE', tagline: 'Aviation CMS' } })
  }
}

export async function PUT(request: Request) {
  try {
    // Require admin auth for settings updates
    const auth = requireAuth()
    if ('error' in auth) return auth.error

    await ensureDb()
    const body = await request.json()

    const existing = await db.select().from(companySettings).limit(1)
    const now = new Date().toISOString()

    if (existing.length > 0) {
      await db.update(companySettings)
        .set({
          companyName: body.companyName,
          tagline: body.tagline,
          address: body.address,
          city: body.city,
          state: body.state,
          zipCode: body.zipCode,
          country: body.country,
          phone: body.phone,
          phoneAlt: body.phoneAlt,
          email: body.email,
          website: body.website,
          logoUrl: body.logoUrl,
          logoSize: body.logoSize,
          faviconUrl: body.faviconUrl,
          uei: body.uei,
          cageCode: body.cageCode,
          naicsCodes: body.naicsCodes,
          taxId: body.taxId,
          duns: body.duns,
          samRegistration: body.samRegistration,
          capabilities: body.capabilities,
          coreCapabilities: body.coreCapabilities,
          certifications: body.certifications,
          complianceFrameworks: body.complianceFrameworks,
          naicsDescriptions: body.naicsDescriptions,
          serviceHighlights: body.serviceHighlights,
          whyChooseUs: body.whyChooseUs,
          samGovStatus: body.samGovStatus,
          registrationPurpose: body.registrationPurpose,
          ownerName: body.ownerName,
          defaultCurrency: body.defaultCurrency,
          smtpFromName: body.smtpFromName,
          smtpFromEmail: body.smtpFromEmail,
          updatedAt: now,
        })
        .where(eq(companySettings.id, existing[0].id))
    }

    clearSettingsCache()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PUT /api/settings error:', error)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
