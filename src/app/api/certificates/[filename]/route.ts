import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join, basename } from 'path'

const DOC_DIR = join(process.cwd(), 'Doc')

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params
    const safeName = basename(filename)

    if (safeName !== filename) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
    }

    if (!safeName.endsWith('.pdf') && !safeName.endsWith('.png') && !safeName.endsWith('.jpg') && !safeName.endsWith('.svg')) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    const filePath = join(DOC_DIR, safeName)
    const data = await readFile(filePath)

    const ext = safeName.split('.').pop()?.toLowerCase() || 'pdf'
    const mimeMap: Record<string, string> = {
      pdf: 'application/pdf',
      png: 'image/png',
      jpg: 'image/jpeg',
      svg: 'image/svg+xml',
    }

    return new NextResponse(data, {
      headers: {
        'Content-Type': mimeMap[ext] || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${safeName}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
}
