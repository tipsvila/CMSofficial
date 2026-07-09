import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { client } = await import('@/lib/db')
  try {
    const { id } = await params
    const body = await request.json()

    if (body.isRead !== undefined) {
      await client.execute({
        sql: 'UPDATE notifications SET is_read = ? WHERE id = ?',
        args: [body.isRead ? 1 : 0, id],
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PUT /api/notifications/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
