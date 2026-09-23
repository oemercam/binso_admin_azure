import { NextResponse } from 'next/server'
import { requireSameOrigin } from '@/lib/http/server-api'
import { resolveTenantContext } from '@/lib/auth/tenant-server'
import { getOrganizationSubscription, requestSubscriptionChange } from '@/lib/db/repositories/platform-billing'
import type { SubscriptionPlan } from '@/types/domain'

const plans = new Set<SubscriptionPlan>(['starter', 'business', 'professional', 'enterprise'])

export async function GET() {
  const context = await resolveTenantContext()
  if (!context) return NextResponse.json({ error: 'Keine aktive Organisation.' }, { status: 403 })
  const subscription = await getOrganizationSubscription(context.organizationId)
  if (!subscription) return NextResponse.json({ error: 'Kein Abonnement gefunden.' }, { status: 404 })
  return NextResponse.json({ subscription })
}

export async function PATCH(request: Request) {
  try { requireSameOrigin(request) } catch { return NextResponse.json({ error: 'Ungültige Anfragequelle.' }, { status: 403 }) }
  const context = await resolveTenantContext()
  if (!context) return NextResponse.json({ error: 'Keine aktive Organisation.' }, { status: 403 })
  if (context.membership.role !== 'owner') return NextResponse.json({ error: 'Nur der Inhaber kann das Abonnement ändern.' }, { status: 403 })

  const body = await request.json().catch(() => null) as null | {
    action?: 'change_plan' | 'cancel' | 'reactivate'
    plan?: SubscriptionPlan
  }
  if (!body?.action || !['change_plan','cancel','reactivate'].includes(body.action)) {
    return NextResponse.json({ error: 'Ungültige Aktion.' }, { status: 400 })
  }
  if (body.action === 'change_plan' && (!body.plan || !plans.has(body.plan))) {
    return NextResponse.json({ error: 'Ungültiger Plan.' }, { status: 400 })
  }

  try {
    const result = await requestSubscriptionChange({
      organizationId: context.organizationId,
      actorUserId: context.userId,
      action: body.action,
      plan: body.plan,
    })
    return NextResponse.json(result)
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : 'Abonnement konnte nicht aktualisiert werden.' }, { status: 409 })
  }
}
