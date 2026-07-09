import { NextResponse } from 'next/server'
import { client } from '@/lib/db'

function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let current = ''
  let inQuotes = false
  const row: string[] = []

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { current += '"'; i++ }
      else if (ch === '"') inQuotes = false
      else current += ch
    } else {
      if (ch === '"') inQuotes = true
      else if (ch === ',') { row.push(current); current = '' }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++
        row.push(current); current = ''
        if (row.length > 0 && row.some(c => c.trim())) rows.push(row)
        row.length = 0
      } else current += ch
    }
  }
  row.push(current)
  if (row.length > 0 && row.some(c => c.trim())) rows.push(row)
  return rows
}

async function ensureDocumentsTable() {
  const check = await client.execute(`SELECT name FROM sqlite_master WHERE type='table' AND name='documents'`)
  if (check.rows.length === 0) {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        contractor_id TEXT,
        file_name TEXT NOT NULL,
        file_type TEXT,
        file_size INTEGER DEFAULT 0,
        file_path TEXT,
        notes TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `)
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })

    const text = await file.text()
    const rows = parseCSV(text)
    if (rows.length < 2) return NextResponse.json({ error: 'CSV must have a header row and at least one data row' }, { status: 400 })

    const headers = rows[0].map(h => h.trim().toLowerCase())
    const fileNameIdx = headers.findIndex(h => h === 'filename' || h === 'file_name')
    const contractorIdx = headers.findIndex(h => h === 'contractor' || h === 'contractorname')
    const fileTypeIdx = headers.findIndex(h => h === 'filetype' || h === 'file_type')
    const notesIdx = headers.findIndex(h => h === 'notes')

    if (fileNameIdx === -1) {
      return NextResponse.json({ error: 'CSV must have a "fileName" column' }, { status: 400 })
    }

    await ensureDocumentsTable()

    const now = new Date().toISOString()
    let imported = 0

    for (let i = 1; i < rows.length && i <= 10000; i++) {
      const row = rows[i]
      if (row.length < 1) continue

      const fileName = row[fileNameIdx]?.trim()
      if (!fileName) continue

      let contractorId: string | null = null
      if (contractorIdx !== -1 && row[contractorIdx]?.trim()) {
        const contractorName = row[contractorIdx].trim()
        const match = await client.execute({
          sql: 'SELECT id FROM contractors WHERE name LIKE ? AND is_active = 1 LIMIT 1',
          args: [`%${contractorName}%`],
        })
        if (match.rows.length > 0) contractorId = match.rows[0].id as string
      }

      const id = crypto.randomUUID()
      await client.execute({
        sql: `INSERT INTO documents (id, contractor_id, file_name, file_type, file_size, file_path, notes, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, 0, NULL, ?, 1, ?, ?)`,
        args: [
          id,
          contractorId,
          fileName,
          fileTypeIdx !== -1 ? (row[fileTypeIdx]?.trim() || null) : null,
          notesIdx !== -1 ? (row[notesIdx]?.trim() || null) : null,
          now,
          now,
        ],
      })
      imported++
    }

    return NextResponse.json({ success: true, imported })
  } catch (error) {
    console.error('POST /api/documents/import error:', error)
    return NextResponse.json({ error: 'Import failed' }, { status: 500 })
  }
}
