import { NextResponse } from 'next/server'
import jsPDF from 'jspdf'
import { getCompanySettings } from '@/lib/company-settings'

const C = {
  primary: [37, 99, 235] as [number, number, number],
  dark: [26, 54, 93] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  gray: [107, 114, 128] as [number, number, number],
  lightGray: [243, 244, 246] as [number, number, number],
  black: [31, 41, 55] as [number, number, number],
  green: [22, 163, 74] as [number, number, number],
}

function addHeader(doc: jsPDF, settings: Record<string, unknown>) {
  const w = doc.internal.pageSize.getWidth()
  doc.setFillColor(...C.dark)
  doc.roundedRect(10, 6, w - 20, 30, 3, 3, 'F')
  doc.setFillColor(...C.primary)
  doc.roundedRect(w / 2, 6, w / 2 - 10, 30, 3, 3, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...C.white)
  doc.text((settings.companyName as string) || 'CMS', 36, 18)

  doc.setFontSize(9)
  doc.setTextColor(147, 197, 253)
  doc.text((settings.tagline as string) || 'Aviation Federal Contract Management', 36, 25)

  doc.setFontSize(8)
  doc.setTextColor(200, 210, 230)
  doc.text(`${settings.city || ''}, ${settings.country || ''}  |  ${settings.email || ''}  |  ${settings.phone || ''}  |  ${settings.website || ''}`, 36, 31)
}

function addFooter(doc: jsPDF, y: number, companyName?: string) {
  const w = doc.internal.pageSize.getWidth()
  const h = doc.internal.pageSize.getHeight()
  doc.setDrawColor(229, 231, 235)
  doc.line(20, y + 5, w - 20, y + 5)
  doc.setFontSize(7)
  doc.setTextColor(156, 163, 175)
  doc.text('CUI - CONTROLLED UNCLASSIFIED INFORMATION', w / 2, h - 15, { align: 'center' })
  doc.text('Handling and dissemination controlled per FAR 4.1801', w / 2, h - 10, { align: 'center' })
  doc.text(`${companyName || 'CMS'} CMS`, 20, h - 10)
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, w - 20, h - 10, { align: 'right' })
}

function sectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(...C.dark)
  doc.text(title, 20, y)
  doc.setDrawColor(...C.primary)
  doc.setLineWidth(0.5)
  doc.line(20, y + 3, 80, y + 3)
  return y + 12
}

function fieldRow(doc: jsPDF, label: string, value: string, y: number): number {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(75, 85, 99)
  doc.text(label + ':', 20, y)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(31, 41, 55)
  doc.text(value || '---', 70, y)
  return y + 7
}

function bulletItem(doc: jsPDF, text: string, y: number): number {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(31, 41, 55)
  doc.text('\u2022', 24, y)
  const lines = doc.splitTextToSize(text, 155)
  doc.text(lines, 30, y)
  return y + (lines.length * 5) + 3
}

export async function GET() {
  try {
    const s = await getCompanySettings()
    const doc = new jsPDF()
    const w = doc.internal.pageSize.getWidth()

    // PAGE 1: Header + Government IDs + NAICS
    addHeader(doc, s)

    let y = 70

    y = sectionTitle(doc, 'COMPANY OVERVIEW', y)
    y = fieldRow(doc, 'Legal Name', s.companyName as string || '', y)
    y = fieldRow(doc, 'Website', s.website as string || '', y)
    y = fieldRow(doc, 'Email', s.email as string || '', y)
    y = fieldRow(doc, 'Phone', s.phone as string || '', y)
    y = fieldRow(doc, 'Address', s.address as string || '', y)
    y += 1
    y = fieldRow(doc, '', `${s.city || ''}, ${s.state || ''} ${s.zipCode || ''}, ${s.country || ''}`, y)
    y += 8

    y = sectionTitle(doc, 'GOVERNMENT REGISTRATIONS', y)
    y = fieldRow(doc, 'SAM.gov UEI', s.uei as string || '', y)
    y = fieldRow(doc, 'CAGE/NCAGE Code', `${s.cageCode || ''} (Active)`, y)
    y = fieldRow(doc, 'FBR/NTN Tax ID', s.taxId as string || '', y)
    y = fieldRow(doc, 'SAM.gov Status', (s.samGovStatus as string) || 'Submitted Registration', y)
    y = fieldRow(doc, 'Registration Purpose', (s.registrationPurpose as string) || 'All Awards', y)
    y += 8

    y = sectionTitle(doc, 'NAICS CLASSIFICATIONS', y)
    const naicsList = (s.naicsCodes as string || '423860, 488190, 518210, 541512').split(',').map((n) => n.trim())
    let naicsDescs: Record<string, string> = {}
    try { naicsDescs = JSON.parse(s.naicsDescriptions as string || '{}') } catch {}
    for (const code of naicsList) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(...C.primary)
      doc.text(code, 24, y)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(75, 85, 99)
      doc.text(naicsDescs[code] || 'Classification', 50, y)
      y += 6
    }
    y += 5

    y = sectionTitle(doc, 'CERTIFICATIONS & STANDARDS', y)
    const certs = (s.certifications as string || 'FAA Form 8130-3, AS9120 Quality Management, AS9110 Maintenance Standards').split(',').map((c: string) => c.trim())
    for (const cert of certs) {
      doc.setFont('zapfdingbats', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(...C.green)
      doc.text('4', 24, y)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(31, 41, 55)
      doc.text(cert, 32, y)
      y += 6
    }
    y += 3

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(75, 85, 99)
    doc.text('Compliance Frameworks:  ', 24, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(37, 99, 235)
    doc.text((s.complianceFrameworks as string || 'FAR, DFARS, CMMC, ITAR').split(',').join('  |  '), 80, y)

    addFooter(doc, y + 10, s.companyName as string)

    // PAGE 2: Core Capabilities
    doc.addPage()
    addHeader(doc, s)
    y = 70

    y = sectionTitle(doc, 'CORE CAPABILITIES', y)

    let services = [
      { title: 'Aviation Parts Sourcing & Procurement', desc: 'Global supply chain facilitation for OEM, PMA, and surplus aviation parts with full traceability.' },
      { title: 'IT-Enabled Services (ITeS)', desc: 'Data processing, systems design, and digital infrastructure for government contractors.' },
      { title: 'Defense Logistics Support', desc: 'DLA-certified supply chain management with NATO CAGE compliance.' },
      { title: 'Federal Contract Management', desc: 'End-to-end CMS architecture for compliance tracking, RFQ workflows, and order management.' },
      { title: 'Compliance & Audit Support', desc: 'FAR/DFARS alignment, CMMC readiness, and ITAR compliance documentation.' },
      { title: 'Supply Chain Traceability', desc: 'Complete chain-of-custody documentation, CoC verification, and serial number tracking.' },
    ]
    try {
      const parsed = JSON.parse(s.coreCapabilities as string || '[]')
      if (Array.isArray(parsed) && parsed.length > 0) services = parsed
    } catch {}

    for (const svc of services) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(...C.dark)
      doc.text(svc.title, 20, y)
      y += 5
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(...C.gray)
      const lines = doc.splitTextToSize(svc.desc, 160)
      doc.text(lines, 20, y)
      y += lines.length * 4 + 8
    }

    y += 5

    y = sectionTitle(doc, 'SERVICE HIGHLIGHTS', y)

    doc.setFillColor(...C.dark)
    doc.rect(20, y, w - 40, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...C.white)
    doc.text('Service Area', 24, y + 5.5)
    doc.text('Details', 80, y + 5.5)
    y += 8

    let tableData = [
      ['Compliance', 'FAA 8130-3, AS9120/9110, FAR/DFARS aligned'],
      ['Sourcing', 'OEM & PMA parts with global logistics network'],
      ['Traceability', 'Complete chain-of-custody and CoC documentation'],
      ['Reach', 'SAM.gov registered, DLA CAGE certified'],
      ['Quality', 'Strictest alignment with FAA Form 8130-3 standards'],
      ['IT Services', 'Data processing, systems design, web infrastructure'],
    ]
    try {
      const parsed = JSON.parse(s.serviceHighlights as string || '[]')
      if (Array.isArray(parsed) && parsed.length > 0) tableData = parsed
    } catch {}

    for (let i = 0; i < tableData.length; i++) {
      const [area, details] = tableData[i]
      if (i % 2 === 0) {
        doc.setFillColor(...C.lightGray)
        doc.rect(20, y, w - 40, 7, 'F')
      }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(31, 41, 55)
      doc.text(area, 24, y + 5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(107, 114, 128)
      doc.text(details, 80, y + 5)
      y += 7
    }

    addFooter(doc, y + 10, s.companyName as string)

    // PAGE 3: Contact + Why Choose Us
    doc.addPage()
    addHeader(doc, s)
    y = 70

    y = sectionTitle(doc, `WHY CHOOSE ${((s.companyName as string) || 'CMS').toUpperCase()}`, y)

    let reasons = [
      'SAM.gov registered entity with active CAGE code',
      'FAA Form 8130-3 and AS9120 compliant quality systems',
      'End-to-end contract management CMS with real-time tracking',
      'Global aviation parts sourcing network with full traceability',
      'FAR/DFARS, CMMC, and ITAR compliance ready',
      'Dedicated defense logistics support with NATO standards',
      'Data-driven price intelligence and anomaly detection',
      'Automated RFQ matching and quote management',
    ]
    try {
      const parsed = JSON.parse(s.whyChooseUs as string || '[]')
      if (Array.isArray(parsed) && parsed.length > 0) reasons = parsed
    } catch {}

    for (const reason of reasons) {
      y = bulletItem(doc, reason, y)
    }

    y += 10

    y = sectionTitle(doc, 'CONTACT INFORMATION', y)
    y = fieldRow(doc, 'Owner', s.ownerName as string || '', y)
    y = fieldRow(doc, 'Email', s.email as string || '', y)
    y = fieldRow(doc, 'Phone', s.phone as string || '', y)
    y = fieldRow(doc, 'Website', s.website as string || '', y)
    y = fieldRow(doc, 'Address', s.address as string || '', y)
    y += 1
    y = fieldRow(doc, '', `${s.city || ''}, ${s.state || ''} ${s.zipCode || ''}, ${s.country || ''}`, y)
    y += 10

    // Legal Notice
    doc.setFillColor(254, 252, 232)
    doc.rect(20, y, w - 40, 18, 'F')
    doc.setDrawColor(234, 179, 8)
    doc.setLineWidth(0.3)
    doc.rect(20, y, w - 40, 18, 'S')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(146, 64, 14)
    doc.text('CUI - CONTROLLED UNCLASSIFIED INFORMATION', 24, y + 6)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(146, 64, 14)
    doc.text('This document contains proprietary information. Handling and dissemination controlled per FAR 4.1801.', 24, y + 13)

    addFooter(doc, y + 25, s.companyName as string)

    // Generate PDF
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="Capability_Statement.pdf"',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Failed to generate capabilities PDF:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
