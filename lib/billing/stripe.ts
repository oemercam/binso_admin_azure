import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'
import type { SubscriptionPlan } from '@/types/domain'

const STRIPE_API = 'https://api.stripe.com/v1'

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim() && process.env.STRIPE_WEBHOOK_SECRET?.trim())
}

export function stripePriceId(plan: SubscriptionPlan) {
  const key = `STRIPE_PRICE_${plan.toUpperCase()}`
  return process.env[key]?.trim() || null
}

export function stripePlanForPriceId(priceId: string | null | undefined): SubscriptionPlan | null {
  if (!priceId) return null
  const entries: Array<[SubscriptionPlan, string | undefined]> = [
    ['starter', process.env.STRIPE_PRICE_STARTER],
    ['business', process.env.STRIPE_PRICE_BUSINESS],
    ['professional', process.env.STRIPE_PRICE_PROFESSIONAL],
    ['enterprise', process.env.STRIPE_PRICE_ENTERPRISE],
  ]
  return entries.find(([, id]) => id?.trim() === priceId)?.[0] ?? null
}

export async function stripePost<T>(path: string, params: URLSearchParams): Promise<T> {
  const key = process.env.STRIPE_SECRET_KEY?.trim()
  if (!key) throw new Error('Stripe ist nicht konfiguriert.')
  const response = await fetch(`${STRIPE_API}${path}`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${key}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: params,
    cache: 'no-store',
  })
  const payload = await response.json().catch(() => ({})) as T & { error?: { message?: string } }
  if (!response.ok) throw new Error(payload.error?.message || 'Stripe-Anfrage fehlgeschlagen.')
  return payload
}

export function appBaseUrl(request: Request) {
  const configured = process.env.APP_BASE_URL?.trim()
  if (configured) return configured.replace(/\/$/, '')
  return new URL(request.url).origin
}

export function verifyStripeWebhook(rawBody: string, signatureHeader: string | null) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim()
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
