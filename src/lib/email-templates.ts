import { getCompanySettings } from './company-settings'

// XSS protection: escape HTML entities in user-provided strings
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

interface TemplateData {
  recipientName: string
  companyName?: string
  agency?: string
  contractValue?: string
  subject?: string
  notes?: string
}

function greet(data: TemplateData): string {
  return `Dear ${escapeHtml(data.recipientName)},`
}

function co(data: TemplateData): string {
  return escapeHtml(data.companyName || 'your organization')
}

async function corporateSignature(): Promise<string> {
  const s = await getCompanySettings()
  const name = escapeHtml(s.companyName as string || 'INTAEROBASE')
  const phone = s.phone ? ` <strong>Phone:</strong> ${escapeHtml(s.phone as string)}` : ''
  const phoneAlt = s.phoneAlt ? ` | ${escapeHtml(s.phoneAlt as string)}` : ''
  const web = s.website ? `<br/><strong>Web:</strong> <a href="${escapeHtml(s.website as string)}" style="color:#2563eb">${escapeHtml(s.website as string)}</a>` : ''
  const emailAddr = s.email ? `<br/><strong>Email:</strong> <a href="mailto:${escapeHtml(s.email as string)}" style="color:#2563eb">${escapeHtml(s.email as string)}</a>` : ''
  const tagline = escapeHtml(s.tagline as string || 'Aviation Federal Contract Management')

  return `
<hr style="border:0; border-top: 1px solid #eee; margin: 20px 0;" />
<table cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;font-size:13px;color:#333;width:100%;max-width:600px">
  <tr>
    <td style="vertical-align:top;border-right:2px solid #1a365d;padding-right:15px">
      <strong style="color:#1a365d;font-size:15px">${name} Team</strong><br/>
      <span style="color:#555;font-size:12px">${tagline}</span>
    </td>
    <td style="vertical-align:top;padding-left:15px"${phone ? '' : ' style="display:none"'}>${phone}${phoneAlt}${web}${emailAddr}</td>
  </tr>
</table>
<p style="font-size:11px;color:#777;margin-top:12px"><em>CUI - CONTROLLED UNCLASSIFIED INFORMATION</em></p>`
}

async function emailShell(title: string, bodyHtml: string): Promise<{ subject: string; html: string }> {
  const s = await getCompanySettings()
  const name = escapeHtml(s.companyName as string || 'INTAEROBASE')
  const tagline = escapeHtml(s.tagline as string || '')
  const logoUrl = escapeHtml((s.logoUrl as string) || '/logo.svg')

  return {
    subject: title,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family:Arial,sans-serif;color:#333;line-height:1.7;margin:0;padding:0">
  <div style="max-width:640px;margin:0 auto;padding:0">
    <div style="background:#1a365d;color:white;padding:24px 28px;text-align:center;border-radius:4px 4px 0 0">
      <img src="${logoUrl}" alt="${name}" style="height:48px;margin-bottom:12px;object-fit:contain" />
      <h1 style="margin:0;font-size:20px;letter-spacing:0.5px">${name}</h1>
      <p style="margin:4px 0 0;font-size:11px;color:#93c5fd;letter-spacing:1px">${tagline}</p>
    </div>
    <div style="background:#f9fafb;padding:28px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 4px 4px">
      <h2 style="margin:0 0 18px;font-size:16px;color:#1a365d;border-bottom:1px solid #e5e7eb;padding-bottom:10px">${title}</h2>
      ${bodyHtml}
      ${await corporateSignature()}
    </div>
    <div style="text-align:center;padding:12px;font-size:10px;color:#9ca3af">
      This communication contains proprietary information intended solely for the addressee.
    </div>
  </div>
</body>
</html>`,
  }
}

async function companyDetails(): Promise<{ uei: string; cageCode: string; naics: string }> {
  const s = await getCompanySettings()
  return {
    uei: escapeHtml(s.uei as string || ''),
    cageCode: escapeHtml(s.cageCode as string || ''),
    naics: escapeHtml(s.naicsCodes as string || ''),
  }
}

// ── Template: Capability Statement ──────────────────────────────────────────────

async function capabilityStatementTemplate(data: TemplateData) {
  const name = greet(data)
  const company = co(data)
  const ids = await companyDetails()
  const s = await getCompanySettings()
  const cName = escapeHtml(s.companyName as string || 'INTAEROBASE')

  const body = `
<p>${name}</p>

<p>I am reaching out from <strong>${cName}</strong> regarding potential vendor integration and subcontracting opportunities specifically supporting ${company}'s active aviation programs.</p>

<p>We are currently in our operational foundation phase, actively finalizing our local Compliance CMS architecture to handle high-volume government contract compliance, precision sourcing, and IT-Enabled Services (ITeS). To ensure seamless data mapping into prime contractor pipelines like yours, our organization maintains absolute regulatory transparency:</p>

<table cellpadding="8" cellspacing="0" style="width:100%;margin:16px 0;font-size:13px">
  <tr>
    <td style="background:#eef2ff;border-left:3px solid #2563eb;padding:12px;border-radius:0 4px 4px 0">
      <strong style="color:#1e40af">SAM.gov Active Registration</strong><br/>
      <span style="color:#555">Unique Entity ID (UEI): <code style="background:#dbeafe;padding:2px 6px;border-radius:3px;font-size:12px">${ids.uei || 'Not configured'}</code></span>
    </td>
  </tr>
  <tr><td style="height:8px"></td></tr>
  <tr>
    <td style="background:#f0fdf4;border-left:3px solid #16a34a;padding:12px;border-radius:0 4px 4px 0">
      <strong style="color:#166534">Defense Logistics Agency (DLA)</strong><br/>
      <span style="color:#555">NATO CAGE Code: <code style="background:#dcfce7;padding:2px 6px;border-radius:3px;font-size:12px">${ids.cageCode || 'Not configured'}</code></span>
    </td>
  </tr>
  <tr><td style="height:8px"></td></tr>
  <tr>
    <td style="background:#fefce8;border-left:3px solid #ca8a04;padding:12px;border-radius:0 4px 4px 0">
      <strong style="color:#854d0e">Quality Target</strong><br/>
      <span style="color:#555">Strictest alignment with FAA Form 8130-3 and AS9120 tracing standards</span>
    </td>
  </tr>
</table>

${data.agency ? `<p>We noted ${company}'s active contract with <strong>${escapeHtml(data.agency)}</strong>${data.contractValue ? ` valued at <strong>${escapeHtml(data.contractValue)}</strong>` : ''} and believe we can add measurable value to the supply chain.</p>` : ''}

<p>We would welcome the opportunity to learn about ${company}'s specific API or documentation ingestion standards so we can map our system configurations to your needs during this deployment cycle.</p>

<p>Attached is our current Capability Statement for your review. Let us know your standard onboarding requirements and we will expedite accordingly.</p>`

  return emailShell(`Business Introduction: ${cName} Vendor Alignment for ${company}`, body)
}

// ── Template: Follow-Up ─────────────────────────────────────────────────────────

async function followUpTemplate(data: TemplateData) {
  const name = greet(data)
  const company = co(data)
  const s = await getCompanySettings()
  const cName = escapeHtml(s.companyName as string || 'INTAEROBASE')

  const body = `
<p>${name}</p>

<p>I understand your team at ${company} faces competing operational priorities, but I wanted to briefly reconnect regarding our previous structural introduction${data.subject ? ` concerning <strong>${escapeHtml(data.subject)}</strong>` : ''}.</p>

<p>While we are finalizing our internal compliance data ledger, we remain highly interested in how ${cName} can provide compliant logistical and sourcing support for ${company}'s active parts and MRO requirements. We wish to ensure our system's automated tracking flags the exact solicitation profiles relevant to ${company}.</p>

<table cellpadding="6" cellspacing="0" style="width:100%;margin:16px 0;font-size:13px">
  <tr>
    <td style="width:50%;vertical-align:top;background:#f8fafc;border:1px solid #e2e8f0;padding:14px;border-radius:4px">
      <strong style="color:#1a365d;font-size:12px">COMPLIANCE</strong><br/>
      <span style="color:#555;font-size:12px">FAA 8130-3, AS9120/9110, FAR/DFARS aligned</span>
    </td>
    <td style="width:8px"></td>
    <td style="width:50%;vertical-align:top;background:#f8fafc;border:1px solid #e2e8f0;padding:14px;border-radius:4px">
      <strong style="color:#1a365d;font-size:12px">SOURCING</strong><br/>
      <span style="color:#555;font-size:12px">OEM & PMA parts with global logistics network</span>
    </td>
  </tr>
  <tr><td colspan="3" style="height:8px"></td></tr>
  <tr>
    <td style="vertical-align:top;background:#f8fafc;border:1px solid #e2e8f0;padding:14px;border-radius:4px">
      <strong style="color:#1a365d;font-size:12px">TRACEABILITY</strong><br/>
      <span style="color:#555;font-size:12px">Complete chain-of-custody and CoC documentation</span>
    </td>
    <td style="width:8px"></td>
    <td style="vertical-align:top;background:#f8fafc;border:1px solid #e2e8f0;padding:14px;border-radius:4px">
      <strong style="color:#1a365d;font-size:12px">REACH</strong><br/>
      <span style="color:#555;font-size:12px">SAM.gov registered, DLA CAGE certified</span>
    </td>
  </tr>
</table>

<p>Could you please direct us to ${company}'s standard vendor questionnaire or technical onboarding documentation so we can review it against our current database schema sprint?</p>

<p>Please let us know a convenient window for a brief alignment call, or reply directly with your current sourcing gaps.</p>`

  return emailShell(`Reconnecting: ${cName} & ${company}`, body)
}

// ── Template: Capability Follow-Up ──────────────────────────────────────────────

async function capabilityFollowUpTemplate(data: TemplateData) {
  const name = greet(data)
  const company = co(data)
  const ids = await companyDetails()
  const s = await getCompanySettings()
  const cName = escapeHtml(s.companyName as string || 'INTAEROBASE')

  const body = `
<p>${name}</p>

<p>Thank you for your valuable time${data.subject ? ` regarding <strong>${escapeHtml(data.subject)}</strong>` : ''}. As discussed, please find attached our official <strong>${cName} Capability Statement</strong> detailing our compliance workflows, NAICS classifications, and aviation service metrics.</p>

<p>We are fully prepared to meet strict FAR/DFARS compliance mandates to ensure a seamless execution channel for ${company}'s upcoming programs.</p>

<table cellpadding="0" cellspacing="0" style="width:100%;margin:20px 0;font-size:13px;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden">
  <tr>
    <td style="background:#1a365d;color:white;padding:12px 16px;font-weight:bold;font-size:12px" colspan="2">CAPABILITY HIGHLIGHTS FOR ${company.toUpperCase()}</td>
  </tr>
  <tr>
    <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;width:40%;color:#555;font-size:12px"><strong>NAICS Codes</strong></td>
    <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;font-size:12px">${ids.naics || 'Not configured'}</td>
  </tr>
  <tr>
    <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;color:#555;font-size:12px"><strong>Certifications</strong></td>
    <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;font-size:12px">FAA Form 8130-3, AS9120, AS9110</td>
  </tr>
  <tr>
    <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;color:#555;font-size:12px"><strong>Compliance</strong></td>
    <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;font-size:12px">FAR/DFARS, CMMC, ITAR ready</td>
  </tr>
  <tr>
    <td style="padding:12px 16px;color:#555;font-size:12px"><strong>Entity IDs</strong></td>
    <td style="padding:12px 16px;font-size:12px">UEI: ${ids.uei || 'N/A'} | CAGE: ${ids.cageCode || 'N/A'}</td>
  </tr>
</table>

<p>We look forward to working with ${company} and are ready to align our data architecture to your ingestion requirements.</p>`

  return emailShell(`Capability Statement & Documentation`, body)
}

// ── Template: RFQ Published ─────────────────────────────────────────────────────

interface RfqEmailData {
  rfqNumber: string
  title: string
  partNumber: string
  quantity: number
  condition: string
  targetPrice?: string
  deliveryDays?: number
  aogFlag?: boolean
  contractorName: string
}

async function rfqPublishedTemplate(data: RfqEmailData) {
  const s = await getCompanySettings()
  const cName = escapeHtml(s.companyName as string || 'INTAEROBASE')

  const body = `
<p>Dear ${escapeHtml(data.contractorName)},</p>

<p>A new Request for Quote has been published on ${cName} that matches your capabilities:</p>

<table cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0;font-size:13px;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden">
  <tr>
    <td style="background:#1a365d;color:white;padding:12px 16px;font-weight:bold;font-size:12px" colspan="2">
      ${data.aogFlag ? 'AOG PRIORITY ' : ''}RFQ DETAILS
    </td>
  </tr>
  <tr>
    <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;width:40%;color:#555;font-size:12px"><strong>RFQ Number</strong></td>
    <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:12px;font-weight:bold">${escapeHtml(data.rfqNumber)}</td>
  </tr>
  <tr>
    <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;color:#555;font-size:12px"><strong>Title</strong></td>
    <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:12px">${escapeHtml(data.title)}</td>
  </tr>
  <tr>
    <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;color:#555;font-size:12px"><strong>Part Number</strong></td>
    <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:12px;font-weight:bold">${escapeHtml(data.partNumber)}</td>
  </tr>
  <tr>
    <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;color:#555;font-size:12px"><strong>Quantity</strong></td>
    <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:12px">${data.quantity}</td>
  </tr>
  <tr>
    <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;color:#555;font-size:12px"><strong>Condition</strong></td>
    <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:12px">${escapeHtml(data.condition)}</td>
  </tr>
  ${data.targetPrice ? `<tr>
    <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;color:#555;font-size:12px"><strong>Target Price</strong></td>
    <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:12px">$${escapeHtml(data.targetPrice)}</td>
  </tr>` : ''}
  ${data.deliveryDays ? `<tr>
    <td style="padding:10px 16px;color:#555;font-size:12px"><strong>Delivery</strong></td>
    <td style="padding:10px 16px;font-size:12px">${data.deliveryDays} days</td>
  </tr>` : ''}
</table>

<p>Please log in to ${cName} to submit your quote. ${data.aogFlag ? '<strong style="color:#dc2626">This is an AOG (Aircraft on Ground) request — immediate response requested.</strong>' : ''}</p>

<p>Thank you,<br/>${cName} Procurement Team</p>`

  return emailShell(`New RFQ: ${data.rfqNumber} - ${data.title}`, body)
}

// ── Template: Quote Received ────────────────────────────────────────────────────

interface QuoteEmailData {
  rfqNumber: string
  rfqTitle: string
  partNumber: string
  contractorName: string
  unitPrice: string
  leadTimeDays: number
  condition: string
}

async function quoteReceivedTemplate(data: QuoteEmailData) {
  const s = await getCompanySettings()
  const cName = escapeHtml(s.companyName as string || 'INTAEROBASE')

  const body = `
<p>Dear Procurement Team,</p>

<p>A new quote has been submitted for RFQ <strong>${escapeHtml(data.rfqNumber)}</strong>:</p>

<table cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0;font-size:13px;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden">
  <tr>
    <td style="background:#1a365d;color:white;padding:12px 16px;font-weight:bold;font-size:12px" colspan="2">QUOTE DETAILS</td>
  </tr>
  <tr>
    <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;width:40%;color:#555;font-size:12px"><strong>Contractor</strong></td>
    <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:12px">${escapeHtml(data.contractorName)}</td>
  </tr>
  <tr>
    <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;color:#555;font-size:12px"><strong>Price</strong></td>
    <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:12px;font-weight:bold;color:#16a34a">$${escapeHtml(data.unitPrice)}</td>
  </tr>
  <tr>
    <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;color:#555;font-size:12px"><strong>Lead Time</strong></td>
    <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:12px">${data.leadTimeDays} days</td>
  </tr>
  <tr>
    <td style="padding:10px 16px;color:#555;font-size:12px"><strong>Condition</strong></td>
    <td style="padding:10px 16px;font-size:12px">${escapeHtml(data.condition)}</td>
  </tr>
</table>

<p>Log in to review and compare all quotes for this RFQ.</p>

<p>Thank you,<br/>${cName} System</p>`

  return emailShell(`Quote Received: ${data.rfqNumber}`, body)
}

// ── Template: Quote Accepted / Rejected ─────────────────────────────────────────

async function quoteAcceptedTemplate(data: { rfqNumber: string; contractorName: string; partNumber: string }) {
  const s = await getCompanySettings()
  const cName = escapeHtml(s.companyName as string || 'INTAEROBASE')

  const body = `
<p>Dear ${escapeHtml(data.contractorName)},</p>

<p>Congratulations! Your quote for RFQ <strong>${escapeHtml(data.rfqNumber)}</strong> (Part: ${escapeHtml(data.partNumber)}) has been <strong style="color:#16a34a">accepted</strong>.</p>

<p>Our team will be in touch shortly with order details. Please ensure all required certifications and documentation are prepared for shipment.</p>

<p>Thank you for your partnership.<br/>${cName} Procurement Team</p>`

  return emailShell(`Quote Accepted: ${data.rfqNumber}`, body)
}

async function quoteRejectedTemplate(data: { rfqNumber: string; contractorName: string; partNumber: string }) {
  const s = await getCompanySettings()
  const cName = escapeHtml(s.companyName as string || 'INTAEROBASE')

  const body = `
<p>Dear ${escapeHtml(data.contractorName)},</p>

<p>Thank you for your quote on RFQ <strong>${escapeHtml(data.rfqNumber)}</strong> (Part: ${escapeHtml(data.partNumber)}). After careful evaluation, we have selected an alternative supplier for this requirement.</p>

<p>We appreciate your time and encourage you to continue monitoring ${cName} for future opportunities that match your capabilities.</p>

<p>Thank you,<br/>${cName} Procurement Team</p>`

  return emailShell(`Quote Update: ${data.rfqNumber}`, body)
}

export const emailTemplates: Record<string, (data: TemplateData) => Promise<{ subject: string; html: string }>> = {
  capability_statement: capabilityStatementTemplate,
  follow_up: followUpTemplate,
  capability_follow_up: capabilityFollowUpTemplate,
  rfq_published: rfqPublishedTemplate as unknown as (data: TemplateData) => Promise<{ subject: string; html: string }>,
  quote_received: quoteReceivedTemplate as unknown as (data: TemplateData) => Promise<{ subject: string; html: string }>,
  quote_accepted: quoteAcceptedTemplate as unknown as (data: TemplateData) => Promise<{ subject: string; html: string }>,
  quote_rejected: quoteRejectedTemplate as unknown as (data: TemplateData) => Promise<{ subject: string; html: string }>,
}

export type TemplateKey = keyof typeof emailTemplates
