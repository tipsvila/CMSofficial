import { NextResponse } from 'next/server'
import { client } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { emailTemplates } from '@/lib/email-templates'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { to, cc, bcc, subject, template, customBody } = body as {
      to: string; cc?: string; bcc?: string; subject?: string; template?: string; customBody?: string
    }

    if (!to) return NextResponse.json({ error: 'Recipient email is required' }, { status: 400 })

    // Load SAM record for context
    const samResult = await client.execute({ sql: 'SELECT * FROM SAM_Data WHERE id = ?', args: [id] })
    if (samResult.rows.length === 0) return NextResponse.json({ error: 'SAM record not found' }, { status: 404 })
    const sam = samResult.rows[0]

    // Render email from template or use custom body
    let html: string
    let emailSubject = subject || ''

    if (template && template in emailTemplates) {
      const fn = emailTemplates[template as keyof typeof emailTemplates]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rendered = await (fn as any)({
        recipientName: to.split('@')[0],
        companyName: '',
        agency: sam.awarding_agency_name as string || '',
        contractValue: sam.total_obligated_amount != null ? `$${Number(sam.total_obligated_amount).toLocaleString()}` : '',
        subject: emailSubject,
        notes: customBody || '',
      })
      html = rendered.html
      if (!emailSubject) emailSubject = rendered.subject
    } else {
      html = customBody || `<p>${subject || 'No content'}</p>`
    }

    // Staging: all emails rerouted to STAGING_EMAIL
    const result = await sendEmail({ to, cc, bcc, subject: emailSubject, html })

    // Log to email_log table if it exists
    try {
      await client.execute({
        sql: `INSERT INTO email_log (id, entity_type, entity_id, recipient, subject, template, sent_at, created_at) VALUES (?, 'sam_data', ?, ?, ?, ?, ?, ?)`,
        args: [crypto.randomUUID(), id, to, emailSubject, template || 'custom', new Date().toISOString(), new Date().toISOString()],
      })
    } catch { /* email_log table may not exist */ }

    return NextResponse.json({ success: true, messageId: result.messageId })
  } catch (error) {
    console.error('POST send-email error:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
