import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/server'

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const subscription = await request.json()
  // TODO production: persist encrypted/validated subscription in database, scoped to session.user.id.
  return NextResponse.json({ ok: true, stored: Boolean(subscription?.endpoint) })
}

export async function DELETE() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  // TODO production: delete subscription belonging to session.user.id.
  return NextResponse.json({ ok: true })
}
