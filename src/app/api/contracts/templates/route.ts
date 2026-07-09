// ponytail: contracts/templates stays custom — template management is not CRUD
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ templates: [] })
}
