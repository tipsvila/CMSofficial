import { NextResponse } from 'next/server'
import { client } from '@/lib/db'
import { ensureDb } from '@/lib/db-ready'
import { sendEmail } from '@/lib/email'

// Shared in-memory store across route modules via globalThis
const globalForReset = globalThis as typeof globalThis & {
  __resetVerificationCodes?: Map<string, { code: string; expires: number; email: string }>
}
if (!globalForReset.__resetVerificationCodes) {
  globalForReset.__resetVerificationCodes = new Map()
}
const verificationCodes = globalForReset.__resetVerificationCodes

const CODE_TTL_MS = 10 * 60 * 1000 // 10 minutes

export async function POST() {
  try {
    await ensureDb()

    // Get registered email from settings
    const settings = await client.execute('SELECT email FROM company_settings LIMIT 1')
    const email = settings.rows[0]?.email as string | undefined

    if (!email || !email.trim()) {
      return NextResponse.json(
        { success: false, error: 'No email configured in Company Settings. Please set an email first.' },
        { status: 400 },
      )
    }

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000))

    // Generate requestId
    const requestId = crypto.randomUUID()

    // Store with TTL
    verificationCodes.set(requestId, {
      code,
      expires: Date.now() + CODE_TTL_MS,
      email: email.trim(),
    })

    // Clean up expired codes
    for (const [key, val] of verificationCodes) {
      if (val.expires < Date.now()) verificationCodes.delete(key)
    }

    // Send verification email
    await sendEmail({
      to: email.trim(),
      subject: 'CMS Data Reset Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1a1a2e; margin-bottom: 8px;">Data Reset Verification</h2>
          <p style="color: #555; font-size: 14px; line-height: 1.5;">
            You requested to reset all data in your CMS. Enter the following verification code to confirm:
          </p>
          <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a1a2e;">${code}</span>
          </div>
          <p style="color: #999; font-size: 12px;">
            This code expires in 10 minutes. If you did not request this, ignore this email.
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true, requestId })
  } catch (error) {
    console.error('POST /api/settings/reset error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send verification code' },
      { status: 500 },
    )
  }
}
