import { NextResponse } from 'next/server'
import { resolveTenantContext } from '@/lib/auth/tenant-server'
import { appBaseUrl, stripePost } from '@/lib/billing/stripe'
import { getBillingIdentity } from '@/lib/db/repositories/stripe-billing'

type PortalSession = { url: string }

export async function POST(request: Request) {
  const context = await resolveTenantContext()
  if (!context) return NextResponse.json({ error: 'Keine aktive Organisation.' }, { status: 403 })
  if (context.membership.role !== 'owner') return NextResponse.json({ error: 'Nur der Inhaber kann die Abrechnung ändern.' }, { status: 403 })

  const billing = await getBillingIdentity(context.organizationId)
  if (!billing?.billingCustomerId) return NextResponse.json({ error: 'Noch kein Stripe-Kundenkonto vorhanden.' }, { status: 409 })

  try {
    const params = new URLSearchParams()
    params.set('customer', billing.billingCustomerId)
    params.set('return_url', `${appBaseUrl(request)}/organization`)
    const session = await stripePost<PortalSession>('/billing_portal/sessions', params)
    return NextResponse.json({ url: session.url })
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : 'Abrechnungsportal konnte nicht geöffnet werden.' }, { status: 502 })
  }
}
