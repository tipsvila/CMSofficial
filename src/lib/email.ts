// ponytail: minimal SMTP transport — staging mode reroutes all mail to STAGING_EMAIL
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
})

export interface SendEmailOpts {
  to: string
  cc?: string
  bcc?: string
  subject: string
  html: string
  from?: string
  attachments?: { filename: string; content: Buffer | string }[]
}

export async function sendEmail(opts: SendEmailOpts): Promise<{ messageId: string; accepted: string[] }> {
  const staging = process.env.STAGING_EMAIL
  const to = staging ? staging : opts.to
  const subject = staging ? `[CMS REVIEW DRAFT] ${opts.subject}` : opts.subject

  const info = await transporter.sendMail({
    from: opts.from || process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@intaerobase.com',
    to,
    cc: opts.cc || undefined,
    bcc: opts.bcc || undefined,
    subject,
    html: opts.html,
    attachments: opts.attachments || undefined,
  })

  return { messageId: info.messageId, accepted: info.accepted as string[] }
}

export async function verifyConnection(): Promise<boolean> {
  try {
    await transporter.verify()
    return true
  } catch {
    return false
  }
}
