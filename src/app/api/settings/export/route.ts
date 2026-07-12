import { NextResponse } from 'next/server'
import { client } from '@/lib/db'
import { ensureDb } from '@/lib/db-ready'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'

const TABLES_TO_EXPORT = [
  { name: 'SAM_Data', filename: 'sam-data.csv' },
  { name: 'contracts', filename: 'contracts.csv' },
  { name: 'contractors', filename: 'contractors.csv' },
  { name: 'contacts', filename: 'contacts.csv' },
  { name: 'outreach', filename: 'outreach.csv' },
  { name: 'compliance', filename: 'compliance.csv' },
  { name: 'inquiries', filename: 'inquiries.csv' },
  { name: 'rfqs', filename: 'rfqs.csv' },
  { name: 'orders', filename: 'orders.csv' },
  { name: 'capabilities', filename: 'capabilities.csv' },
  { name: 'company_settings', filename: 'company-settings.csv' },
  { name: 'notifications', filename: 'notifications.csv' },
]

function escapeCsv(value: unknown): string {
  const str = String(value ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function POST() {
  try {
    await ensureDb()

    const exportDir = join(process.cwd(), 'DataBank')
    await mkdir(exportDir, { recursive: true })

    const results: { table: string; filename: string; rows: number }[] = []

    for (const { name, filename } of TABLES_TO_EXPORT) {
      const result = await client.execute(`SELECT * FROM "${name}"`)
      const rows = result.rows
      const columns = result.columns

      // Build CSV
      const header = columns.map(escapeCsv).join(',')
      const body = rows.map(row =>
        columns.map(col => escapeCsv(row[col])).join(',')
      ).join('\n')
      const csv = `${header}\n${body}`

      await writeFile(join(exportDir, filename), csv, 'utf-8')
      results.push({ table: name, filename, rows: rows.length })
    }

    const totalRows = results.reduce((sum, r) => sum + r.rows, 0)

    return NextResponse.json({
      success: true,
      directory: 'DataBank',
      totalRows,
      files: results,
    })
  } catch (error) {
    console.error('POST /api/settings/export error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to export data' },
      { status: 500 },
    )
  }
}
