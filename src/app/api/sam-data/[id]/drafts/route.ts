import { NextResponse } from 'next/server'
import { client } from '@/lib/db'

// GET: list drafts for a SAM record
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    // Drafts stored in a drafts table with entity_type + entity_id
    const result = await client.execute({
      sql: `SELECT * FROM drafts WHERE entity_type = 'sam_data' AND entity_id = ? ORDER BY updated_at DESC`,
      args: [id],
    })

    const drafts = result.rows.map(r => ({
      id: r.id,
      to: r.to_recipient,
      cc: r.cc,
      bcc: r.bcc,
      subject: r.subject,
      body: r.body,
      template: r.template,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }))

    return NextResponse.json({ drafts })
  } catch {
    // drafts table may not exist — return empty
    return NextResponse.json({ drafts: [] })
  }
}

// POST: save/update a draft
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { to, cc, bcc, subject, body: emailBody, template, draftId } = body as {
      to: string; cc?: string; bcc?: string; subject: string; body: string; template?: string; draftId?: string
    }

    if (!subject) return NextResponse.json({ error: 'Subject is required' }, { status: 400 })

    const now = new Date().toISOString()

    // Ensure drafts table exists
    await client.execute({
      sql: `CREATE TABLE IF NOT EXISTS drafts (
        id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        to_recipient TEXT,
        cc TEXT,
        bcc TEXT,
        subject TEXT NOT NULL,
        body TEXT,
        template TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      args: [],
    })

    if (draftId) {
      // Update existing draft
      await client.execute({
        sql: `UPDATE drafts SET to_recipient = ?, cc = ?, bcc = ?, subject = ?, body = ?, template = ?, updated_at = ? WHERE id = ?`,
        args: [to || null, cc || null, bcc || null, subject, emailBody || '', template || null, now, draftId],
      })
      return NextResponse.json({ success: true, id: draftId })
    } else {
      // Create new draft
      const newId = crypto.randomUUID()
      await client.execute({
        sql: `INSERT INTO drafts (id, entity_type, entity_id, to_recipient, cc, bcc, subject, body, template, created_at, updated_at) VALUES (?, 'sam_data', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [newId, id, to || null, cc || null, bcc || null, subject, emailBody || '', template || null, now, now],
      })
      return NextResponse.json({ success: true, id: newId })
    }
  } catch (error) {
    console.error('POST drafts error:', error)
    return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 })
  }
}

// DELETE: remove a draft
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const draftId = url.searchParams.get('draftId')
    if (!draftId) return NextResponse.json({ error: 'draftId required' }, { status: 400 })

    await client.execute({ sql: 'DELETE FROM drafts WHERE id = ?', args: [draftId] })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE drafts error:', error)
    return NextResponse.json({ error: 'Failed to delete draft' }, { status: 500 })
  }
}
