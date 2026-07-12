import { NextResponse } from 'next/server'
import { client } from '@/lib/db'
import { ensureDb } from '@/lib/db-ready'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'

// In-memory store — shared reference with the parent route via module-level import
const globalForReset = globalThis as typeof globalThis & {
  __resetVerificationCodes?: Map<string, { code: string; expires: number; email: string }>
}
if (!globalForReset.__resetVerificationCodes) {
  globalForReset.__resetVerificationCodes = new Map()
}
const verificationCodes = globalForReset.__resetVerificationCodes

const TABLES_TO_RESET = [
  { name: 'SAM_Data', filename: 'sam-data.csv' },
  { name: 'contracts', filename: 'contracts.csv' },
  { name: 'contractors', filename: 'contractors.csv' },
  { name: 'outreach', filename: 'outreach.csv' },
  { name: 'compliance', filename: 'compliance.csv' },
  { name: 'inquiries', filename: 'inquiries.csv' },
  { name: 'rfqs', filename: 'rfqs.csv' },
  { name: 'orders', filename: 'orders.csv' },
]

function escapeCsv(value: unknown): string {
  const str = String(value ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

interface ResetResult {
  table: string
  deleted: number
}

export async function POST(request: Request) {
  try {
    await ensureDb()

    const { requestId, code } = await request.json()

    if (!requestId || !code) {
      return NextResponse.json(
        { success: false, error: 'Missing requestId or code' },
        { status: 400 },
      )
    }

    // Look up verification code
    const stored = verificationCodes.get(requestId)
    if (!stored) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired verification code. Please request a new one.' },
        { status: 400 },
      )
    }

    // Check expiry
    if (stored.expires < Date.now()) {
      verificationCodes.delete(requestId)
      return NextResponse.json(
        { success: false, error: 'Verification code expired. Please request a new one.' },
        { status: 400 },
      )
    }

    // Verify code
    if (stored.code !== String(code).trim()) {
      return NextResponse.json(
        { success: false, error: 'Incorrect verification code.' },
        { status: 400 },
      )
    }

    // Code verified — first export all data to DataBank, then delete
    verificationCodes.delete(requestId)

    // Auto-export before reset
    const exportDir = join(process.cwd(), 'DataBank')
    await mkdir(exportDir, { recursive: true })

    const exported: { table: string; rows: number }[] = []
    for (const { name, filename } of TABLES_TO_RESET) {
      const result = await client.execute(`SELECT * FROM "${name}"`)
      const columns = result.columns
      const header = columns.map(escapeCsv).join(',')
      const body = result.rows.map(row =>
        columns.map(col => escapeCsv(row[col])).join(',')
      ).join('\n')
      await writeFile(join(exportDir, filename), `${header}\n${body}`, 'utf-8')
      exported.push({ table: name, rows: result.rows.length })
    }

    // Then delete data from all 8 tables
    const results: ResetResult[] = []
    for (const { name } of TABLES_TO_RESET) {
      const countResult = await client.execute(`SELECT COUNT(*) as cnt FROM "${name}"`)
      const count = Number(countResult.rows[0]?.cnt || 0)
      await client.execute(`DELETE FROM "${name}"`)
      results.push({ table: name, deleted: count })
    }

    const totalDeleted = results.reduce((sum, r) => sum + r.deleted, 0)
    const totalExported = exported.reduce((sum, r) => sum + r.rows, 0)

    return NextResponse.json({
      success: true,
      deleted: totalDeleted,
      exported: totalExported,
      exportDir: 'DataBank',
      details: results,
    })
  } catch (error) {
    console.error('POST /api/settings/reset/confirm error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to reset data' },
      { status: 500 },
    )
  }
}
