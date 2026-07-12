import { NextResponse } from 'next/server'
import { client } from '@/lib/db'
import { ensureDb } from '@/lib/db-ready'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

const TABLE_IMPORT_MAP: Record<string, { table: string; columns: string[] }> = {
  'sam-data.csv': { table: 'SAM_Data', columns: ['id', 'award_id_piid', 'recipient_name', 'total_obligated_amount', 'period_of_performance_current_end_date', 'naics_description', 'product_or_service_code_description', 'awarding_agency_name', 'is_active', 'created_at', 'updated_at'] },
  'contracts.csv': { table: 'contracts', columns: ['id', 'contract_number', 'title', 'contractor_id', 'contact_id', 'status', 'total_amount', 'tax_amount', 'shipping_amount', 'currency', 'start_date', 'end_date', 'payment_terms', 'delivery_terms', 'notes', 'internal_notes', 'is_active', 'created_at', 'updated_at'] },
  'contractors.csv': { table: 'contractors', columns: ['id', 'name', 'uei', 'duns', 'address', 'city', 'state', 'zip_code', 'phone', 'website', 'contracting_tier', 'notes', 'aviation_contract_id', 'email_1', 'email_2', 'email_3', 'is_active', 'created_at', 'updated_at'] },
  'contacts.csv': { table: 'contacts', columns: ['id', 'contractor_id', 'first_name', 'last_name', 'title', 'email', 'phone', 'uei', 'duns', 'address', 'city', 'state', 'zip_code', 'contact1', 'email1', 'contact2', 'email2', 'contact3', 'email3', 'website', 'is_primary', 'aviation_contract_id', 'source', 'is_active', 'created_at', 'updated_at'] },
  'outreach.csv': { table: 'outreach', columns: ['id', 'contractor_id', 'contact_id', 'aviation_contract_id', 'status', 'priority', 'subject', 'notes', 'interaction_date', 'follow_up_date', 'sent_date', 'inquiry_id', 'is_active', 'created_at', 'updated_at'] },
  'compliance.csv': { table: 'compliance', columns: ['id', 'contractor_id', 'aviation_contract_id', 'type', 'status', 'requirement', 'documentation', 'expiry_date', 'last_audit_date', 'next_audit_date', 'risk_level', 'priority', 'scope', 'notes', 'is_active', 'created_at', 'updated_at'] },
  'inquiries.csv': { table: 'inquiries', columns: ['id', 'inquiry_id', 'part_number', 'part_description', 'contractor_id', 'aviation_contract_id', 'status', 'notes', 'is_active', 'created_at', 'updated_at'] },
  'rfqs.csv': { table: 'rfqs', columns: ['id', 'rfq_number', 'title', 'part_number', 'part_description', 'quantity', 'status', 'aog_flag', 'contractor_id', 'is_active', 'created_at', 'updated_at'] },
  'orders.csv': { table: 'orders', columns: ['id', 'order_number', 'rfq_id', 'quote_id', 'contractor_id', 'status', 'total_amount', 'tax_amount', 'shipping_amount', 'currency', 'payment_status', 'notes', 'created_at', 'updated_at'] },
  'capabilities.csv': { table: 'capabilities', columns: ['id', 'contractor_id', 'category', 'name', 'description', 'status', 'certification_level', 'expiry_date', 'naics_code', 'aircraft_types', 'part_numbers', 'estimated_value', 'priority', 'notes', 'is_active', 'created_at', 'updated_at'] },
  'company-settings.csv': { table: 'company_settings', columns: ['id', 'company_name', 'tagline', 'address', 'city', 'state', 'zip_code', 'country', 'phone', 'phone_alt', 'email', 'website', 'logo_url', 'logo_size', 'favicon_url', 'uei', 'cage_code', 'naics_codes', 'tax_id', 'duns', 'sam_registration', 'capabilities', 'core_capabilities', 'certifications', 'compliance_frameworks', 'naics_descriptions', 'service_highlights', 'why_choose_us', 'sam_gov_status', 'registration_purpose', 'owner_name', 'default_currency', 'smtp_from_name', 'smtp_from_email', 'created_at', 'updated_at'] },
  'notifications.csv': { table: 'notifications', columns: ['id', 'user_id', 'type', 'title', 'body', 'entity_id', 'entity_type', 'is_read', 'created_at'] },
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++ }
      else if (ch === '"') { inQuotes = false }
      else { current += ch }
    } else {
      if (ch === '"') { inQuotes = true }
      else if (ch === ',') { result.push(current); current = '' }
      else { current += ch }
    }
  }
  result.push(current)
  return result
}

function parseCsv(content: string): string[][] {
  const lines = content.split(/\r?\n/).filter(l => l.trim())
  return lines.map(parseCsvLine)
}

export async function POST() {
  try {
    await ensureDb()

    const dataDir = join(process.cwd(), 'DataBank')
    let files: string[]
    try {
      files = await readdir(dataDir)
    } catch {
      return NextResponse.json(
        { success: false, error: 'DataBank folder not found. Export data first.' },
        { status: 400 },
      )
    }

    const csvFiles = files.filter(f => f.endsWith('.csv'))
    if (csvFiles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No CSV files found in DataBank folder.' },
        { status: 400 },
      )
    }

    const results: { table: string; filename: string; imported: number; skipped: number }[] = []

    for (const filename of csvFiles) {
      const mapping = TABLE_IMPORT_MAP[filename]
      if (!mapping) continue

      const content = await readFile(join(dataDir, filename), 'utf-8')
      const rows = parseCsv(content)
      if (rows.length < 2) { results.push({ table: mapping.table, filename, imported: 0, skipped: 0 }); continue }

      const headers = rows[0]
      const dataRows = rows.slice(1)

      // Build column index map
      const colMap: Record<string, number> = {}
      headers.forEach((h, i) => { colMap[h.trim()] = i })

      let imported = 0
      let skipped = 0

      for (const row of dataRows) {
        try {
          const values: Record<string, unknown> = {}
          for (const col of mapping.columns) {
            const idx = colMap[col]
            if (idx !== undefined && idx < row.length) {
              let val: unknown = row[idx]
              // Type coerce numeric fields
              if (['total_obligated_amount', 'total_amount', 'tax_amount', 'shipping_amount', 'quantity', 'estimated_value', 'logo_size', 'priority'].includes(col)) {
                val = val === '' ? 0 : Number(val) || 0
              } else if (['is_active', 'sam_registration', 'aog_flag', 'is_primary', 'is_read'].includes(col)) {
                val = val === '' ? 0 : Number(val) || 0
              }
              values[col] = val
            }
          }

          // Use INSERT OR REPLACE to handle duplicates
          const cols = Object.keys(values)
          const placeholders = cols.map(() => '?')
          const sql = `INSERT OR REPLACE INTO "${mapping.table}" (${cols.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders.join(', ')})`
          await client.execute({ sql, args: Object.values(values) as (string | number | null)[] })
          imported++
        } catch {
          skipped++
        }
      }

      results.push({ table: mapping.table, filename, imported, skipped })
    }

    const totalImported = results.reduce((sum, r) => sum + r.imported, 0)
    const totalSkipped = results.reduce((sum, r) => sum + r.skipped, 0)

    return NextResponse.json({
      success: true,
      totalImported,
      totalSkipped,
      files: results,
    })
  } catch (error) {
    console.error('POST /api/settings/import error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to import data' },
      { status: 500 },
    )
  }
}
