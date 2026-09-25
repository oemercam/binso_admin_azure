'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BinsoLogo } from '@/components/ui/binso-logo'
import { Select } from '@/components/ui/form-controls'
import { planDefinitions } from '@/lib/data/plans'
import type { OrganizationSubscription, SubscriptionPlan } from '@/types/domain'
import { apiRequest, jsonBody } from '@/lib/http/api-client'
import { formatCalendarDate } from '@/lib/format/locale'
import { statusLabel } from '@/lib/status/presentation'

type SubscriptionResponse = { subscription?: OrganizationSubscription; canManage?: boolean; error?: string }

export default function SubscriptionRequiredPage() {
  const router = useRouter()
  const [subscription, setSubscription] = useState<OrganizationSubscription | null>(null)
  const [plan, setPlan] = useState<SubscriptionPlan>('business')
  const [canManage, setCanManage] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    queueMicrotask(() => {
      void (async () => {
        try {
          const result = await apiRequest<SubscriptionResponse>('/api/billing/subscription')
          if (!result.subscription) throw new Error('Abonnement konnte nicht geladen werden.')
          if (cancelled) return
          setSubscription(result.subscription)
          setCanManage(Boolean(result.canManage))
          setPlan(result.subscription.plan)
          if (result.subscription.status === 'active') router.replace('/dashboard')
        } catch (cause) {
          if (!cancelled) setError(cause instanceof Error ? cause.message : 'Abonnement konnte nicht geladen werden.')
        } finally {
          if (!cancelled) setLoading(false)
        }
      })()
    })
    return () => { cancelled = true }
  }, [router])

  async function startCheckout() {
    if (submitting || plan === 'enterprise') return
    setSubmitting(true)
    setError('')
    try {
      const result = await apiRequest<{ url?: string }>('/api/billing/checkout', {
        method: 'POST',
        body: jsonBody({ plan }),
      })
      if (!result.url) throw new Error('Checkout konnte nicht gestartet werden.')
      window.location.assign(result.url)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Checkout konnte nicht gestartet werden.')
      setSubmitting(false)
    }
  }

  if (loading) return null

  return (
    <main className="auth-page product-auth-page">
      <section className="auth-card apple-auth-card product-auth-card" aria-labelledby="subscription-title">
        <header className="product-auth-brand"><BinsoLogo /><span className="product-auth-name">One</span></header>
        <div className="product-auth-copy">
          <p className="product-auth-eyebrow">Abonnement</p>
          <h1 id="subscription-title">Zugriff fortsetzen</h1>
          <p className="product-auth-lead">Dein Testzugang oder Abonnement erlaubt aktuell keinen Zugriff auf die Geschäftsdaten. Als Inhaber kannst du hier ein Abonnement aktivieren.</p>
        </div>
        {subscription ? <div className="public-form">
          <label><span>Plan</span>
            <Select value={plan} onChange={(event) => setPlan(event.target.value as SubscriptionPlan)}>
              {planDefinitions.map((item) => <option key={item.id} value={item.id}>{item.name}{item.monthlyPriceChf ? ` · CHF ${item.monthlyPriceChf}/Monat` : ''}</option>)}
            </Select>
          </label>
          <small>Status: {statusLabel(subscription.status)}{subscription.trialUntil ? ` · Testphase bis ${formatCalendarDate(subscription.trialUntil)}` : ''}</small>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          {!canManage ? <p className="form-error">Nur der Inhaber der Organisation kann das Abonnement aktivieren. Bitte wende dich an den Inhaber.</p> : plan === 'enterprise'
            ? <a className="button primary" href="mailto:info@binso.ch?subject=Binso%20One%20Enterprise">Enterprise anfragen</a>
            : <button className="button primary" type="button" disabled={submitting} onClick={() => void startCheckout()}>{submitting ? 'Checkout wird geöffnet…' : 'Abonnement aktivieren'}</button>}
        </div> : <div className="public-form">
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button className="button secondary" type="button" onClick={() => router.push('/pricing')}>Preise ansehen</button>
        </div>}
      </section>
    </main>
  )
}
