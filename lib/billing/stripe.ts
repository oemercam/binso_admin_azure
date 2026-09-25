import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'
import type { SubscriptionPlan } from '@/types/domain'
import { serverEnv } from '@/lib/config/server-env'

const STRIPE_API = 'https://api.stripe.com/v1'

export function stripeConfigured() {
  return Boolean(serverEnv.stripeSecretKey && serverEnv.stripeWebhookSecret)
}

export function stripePriceId(plan: SubscriptionPlan) {
  return serverEnv.stripePrices[plan] || null
}

export function stripePlanForPriceId(priceId: string | null | undefined): SubscriptionPlan | null {
  if (!priceId) return null
  const entries: Array<[SubscriptionPlan, string | undefined]> = [
    ['starter', serverEnv.stripePrices.starter],
    ['business', serverEnv.stripePrices.business],
    ['professional', serverEnv.stripePrices.professional],
    ['enterprise', serverEnv.stripePrices.enterprise],
  ]
  return entries.find(([, id]) => id?.trim() === priceId)?.[0] ?? null
}

export async function stripePost<T>(path: string, params: URLSearchParams, idempotencyKey?: string): Promise<T> {
  const key = serverEnv.stripeSecretKey
  if (!key) throw new Error('Stripe ist nicht konfiguriert.')
  const response = await fetch(`${STRIPE_API}${path}`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${key}`,
      'content-type': 'application/x-www-form-urlencoded',
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    },
    body: params,
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
  })
  const payload = await response.json().catch(() => ({})) as T & { error?: { message?: string } }
  if (!response.ok) throw new Error(payload.error?.message || 'Stripe-Anfrage fehlgeschlagen.')
  return payload
}

export async function stripeGet<T>(path: string): Promise<T> {
  const key = serverEnv.stripeSecretKey
  if (!key) throw new Error('Stripe ist nicht konfiguriert.')
  const response = await fetch(`${STRIPE_API}${path}`, { headers: { authorization: `Bearer ${key}` }, cache: 'no-store', signal: AbortSignal.timeout(20_000) })
  if (!response.ok) throw new Error(`Stripe-Abgleich fehlgeschlagen (${response.status}).`)
  return response.json() as Promise<T>
}

export function appBaseUrl(request: Request) {
  const configured = serverEnv.appBaseUrl
  if (configured) return configured.replace(/\/$/, '')
  return new URL(request.url).origin
}

export function verifyStripeWebhook(rawBody: string, signatureHeader: string | null) {
  const secret = serverEnv.stripeWebhookSecret
  if (!secret || !signatureHeader) return false

  const parts = signatureHeader.split(',').map((part) => part.trim())
  const timestamp = parts.find((part) => part.startsWith('t='))?.slice(2)
  const signatures = parts.filter((part) => part.startsWith('v1=')).map((part) => part.slice(3))
  if (!timestamp || signatures.length === 0) return false

  const seconds = Number(timestamp)
  if (!Number.isFinite(seconds) || Math.abs(Date.now() / 1000 - seconds) > 300) return false

  const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`, 'utf8').digest('hex')
  const expectedBuffer = Buffer.from(expected, 'hex')
  return signatures.some((signature) => {
    try {
      const candidate = Buffer.from(signature, 'hex')
      return candidate.length === expectedBuffer.length && timingSafeEqual(candidate, expectedBuffer)
    } catch {
      return false
    }
  })
}
