import { NextResponse } from 'next/server'
import { requireSameOrigin } from '@/lib/http/server-api'
import { getSession } from '@/lib/auth/server'
import { isDatabaseConfigured } from '@/lib/db/client'
import { listPlatformSignups, listPlatformTenants, updatePlatformSubscription } from '@/lib/db/repositories/platform-billing'
import type { PlatformTenantStatus, SubscriptionPlan } from '@/types/domain'

const plans = new Set<SubscriptionPlan>(['starter', 'business', 'professional', 'enterprise'])
const statuses = new Set<PlatformTenantStatus>(['trial', 'active', 'past_due', 'suspended', 'cancelled'])

function canManagePlatform(role: string | undefined) {
  return role === 'platform_owner' || role === 'platform_admin'
}

function canReadPlatform(role: string | undefined) {
  return canManagePlatform(role) || role === 'platform_support'
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 })
  if (!canReadPlatform(session.user.platformRole)) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
  if (!isDatabaseConfigured()) return NextResponse.json({ error: 'Datenbank ist nicht konfiguriert.' }, { status: 503 })

  const [tenants, signups] = await Promise.all([listPlatformTenants(), listPlatformSignups()])
  return NextResponse.json({ tenants, signups, canManage: canManagePlatform(session.user.platformRole) })
}

export async function PATCH(request: Request) {
  try { requireSameOrigin(request) } catch { return NextResponse.json({ error: 'Ungültige Anfragequelle.' }, { status: 403 }) }
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 })
  if (!canManagePlatform(session.user.platformRole)) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
  if (!isDatabaseConfigured()) return NextResponse.json({ error: 'Datenbank ist nicht konfiguriert.' }, { status: 503 })

  const body = await request.json().catch(() => null) as null | { tenantId?: string; plan?: SubscriptionPlan; status?: PlatformTenantStatus }
  const tenantId = body?.tenantId?.trim() ?? ''
  if (!tenantId || !body?.plan || !plans.has(body.plan) || !body?.status || !statuses.has(body.status)) {
    return NextResponse.json({ error: 'Ungültige Abonnementdaten.' }, { status: 400 })
  }

  try {
    await updatePlatformSubscription({
      tenantId,
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      plan: body.plan,
      status: body.status,
    })
    return NextResponse.json({ ok: true })
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : 'Abonnement konnte nicht aktualisiert werden.' }, { status: 409 })
  }
}
