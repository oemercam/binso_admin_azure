import { apiError, apiJson, readTextBody } from '@/lib/http/server-api'
import { query } from '@/lib/db/client'
import { verifyStripeWebhook } from '@/lib/billing/stripe'
import { applyStripeSubscription, completeWebhookEvent, findOrganizationByStripeCustomer, registerWebhookEvent } from '@/lib/db/repositories/stripe-billing'
import { PRODUCT_LIMITS } from '@/lib/config/product'

type StripeEvent = {
  id: string
  type: string
  data: { object: Record<string, unknown> }
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value : null
}

function metadataOrganizationId(object: Record<string, unknown>) {
  const metadata = object.metadata
  if (!metadata || typeof metadata !== 'object') return null
  return stringValue((metadata as Record<string, unknown>).organizationId)
}

export async function POST(request: Request) {
  let rawBody: string
  try {
    rawBody = await readTextBody(request, PRODUCT_LIMITS.stripeWebhookBodyBytes)
  } catch {
    return apiError(413, 'validation', 'Payload zu gross.')
  }

  if (!verifyStripeWebhook(rawBody, request.headers.get('stripe-signature'))) {
    return apiError(400, 'validation', 'Ungültige Stripe-Signatur.')
  }

  let event: StripeEvent
  try {
    event = JSON.parse(rawBody) as StripeEvent
  } catch {
    return apiError(400, 'validation', 'Ungültiges Event.')
  }
  if (!event || typeof event.id !== 'string' || typeof event.type !== 'string' || !event.data?.object) {
    return apiError(400, 'validation', 'Ungültiges Event.')
  }

  const object = event.data.object
  const customerId = stringValue(object.customer)
  let organizationId = metadataOrganizationId(object)
  if (!organizationId && customerId) organizationId = await findOrganizationByStripeCustomer(customerId)

  const inserted = await registerWebhookEvent({
    externalEventId: event.id,
    eventType: event.type,
    payload: { id: event.id, type: event.type, objectId: stringValue(object.id), customerId, organizationId },
    organizationId,
  })

  if (!inserted) {
    const existing = await query<{ status: string }>(
      "select status from billing_webhook_events where provider='stripe' and external_event_id=$1",
      [event.id],
    )
    if (existing.rows[0]?.status === 'received') return apiError(503, 'server', 'Event wird verarbeitet.')
    return apiJson({ received: true, duplicate: true })
  }

  try {
    if (event.type.startsWith('customer.subscription.')) {
      if (!organizationId) throw new Error('Organisation für Stripe-Abonnement nicht gefunden.')
      const items = object.items as { data?: Array<{ price?: { id?: string } }> } | undefined
      const priceId = items?.data?.[0]?.price?.id ?? null
      await applyStripeSubscription({
        organizationId,
        stripeSubscriptionId: stringValue(object.id) ?? '',
        stripeCustomerId: customerId,
        stripeStatus: stringValue(object.status) ?? 'past_due',
        priceId,
        currentPeriodEnd: typeof object.current_period_end === 'number' ? object.current_period_end : null,
        cancelAtPeriodEnd: Boolean(object.cancel_at_period_end),
        eventId: event.id,
      })
      await completeWebhookEvent(event.id, 'processed')
      return apiJson({ received: true })
    }

    if (event.type === 'checkout.session.completed') {
      await completeWebhookEvent(event.id, 'processed')
      return apiJson({ received: true })
    }

    if (['invoice.payment_failed', 'invoice.paid'].includes(event.type) && organizationId) {
      const parent = object.parent as { subscription_details?: { subscription?: string } } | undefined
      const subscriptionId = stringValue(object.subscription) ?? parent?.subscription_details?.subscription
      if (subscriptionId) {
        await applyStripeSubscription({
          organizationId,
          stripeSubscriptionId: subscriptionId,
          stripeCustomerId: customerId,
          stripeStatus: 'past_due',
          eventId: event.id,
        })
      }
      await completeWebhookEvent(event.id, 'processed')
      return apiJson({ received: true })
    }

    await completeWebhookEvent(event.id, 'ignored')
    return apiJson({ received: true, ignored: true })
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'Webhook-Verarbeitung fehlgeschlagen.'
    await completeWebhookEvent(event.id, 'failed', message)
    return apiError(500, 'server', message)
  }
}
