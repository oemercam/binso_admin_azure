'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BinsoLogo } from '@/components/ui/binso-logo'
import { Input, Select } from '@/components/ui/form-controls'
import { planDefinitions } from '@/lib/data/plans'
import type { OrganizationSubscription, SubscriptionPlan } from '@/types/domain'
import { apiRequest, jsonBody } from '@/lib/http/api-client'
import { formatCalendarDate } from '@/lib/format/locale'
import { statusLabel } from '@/lib/status/presentation'
import { DPA_VERSION, TERMS_VERSION } from '@/lib/legal/legal-config'

type SubscriptionResponse = { subscription?: OrganizationSubscription; canManage?: boolean; error?: string }

function SubscriptionRequiredContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const checkoutReturned = searchParams.get('billing') === 'success'
  const [subscription, setSubscription] = useState<OrganizationSubscription | null>(null)
  const [plan, setPlan] = useState<SubscriptionPlan>('business')
  const [canManage, setCanManage] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [legalAccepted, setLegalAccepted] = useState(false)

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let attempts = 0

    async function loadSubscription() {
      try {
        const result = await apiRequest<SubscriptionResponse>('/api/billing/subscription')
        if (!result.subscription) throw new Error('Abonnement konnte nicht geladen werden.')
        if (cancelled) return
        setSubscription(result.subscription)
        setCanManage(Boolean(result.canManage))
        setPlan(result.subscription.plan)
        if (result.subscription.status === 'active') {
          router.replace('/dashboard?welcome=1')
          return
        }
        attempts += 1
        if (checkoutReturned && attempts < 15) timer = setTimeout(() => void loadSubscription(), 2_000)
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Abonnement konnte nicht geladen werden.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    queueMicrotask(() => { void loadSubscription() })
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [checkoutReturned, router])

  async function startCheckout() {
    if (submitting || plan === 'enterprise' || !legalAccepted) return
    setSubmitting(true)
    setError('')
    try {
      const result = await apiRequest<{ url?: string }>('/api/billing/checkout', {
        method: 'POST',
        body: jsonBody({ plan, acceptedTermsVersion: TERMS_VERSION, acceptedDpaVersion: DPA_VERSION }),
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
          <p className="product-auth-lead">{checkoutReturned ? 'Deine Zahlung wurde zurückgegeben. Wir warten kurz auf die sichere Bestätigung von Stripe und schalten den Zugang danach automatisch frei.' : 'Dein Testzugang oder Abonnement erlaubt aktuell keinen Zugriff auf die Geschäftsdaten. Als Inhaber kannst du hier ein Abonnement aktivieren.'}</p>
        </div>
        {subscription ? <div className="public-form">
          <label><span>Plan</span>
            <Select value={plan} onChange={(event) => setPlan(event.target.value as SubscriptionPlan)}>
              {planDefinitions.map((item) => <option key={item.id} value={item.id}>{item.name}{item.monthlyPriceChf ? ` · CHF ${item.monthlyPriceChf}/Monat` : ''}</option>)}
            </Select>
          </label>
          <small>Status: {statusLabel(subscription.status)}{subscription.trialUntil ? ` · Testphase bis ${formatCalendarDate(subscription.trialUntil)}` : ''}</small>
          {canManage && plan !== 'enterprise' ? <label className="legal-acceptance"><Input type="checkbox" checked={legalAccepted} onChange={(event) => setLegalAccepted(event.target.checked)} /><span>Ich bestätige die <a href="/legal/terms" target="_blank" rel="noreferrer">AGB</a> und die <a href="/legal/dpa" target="_blank" rel="noreferrer">Auftragsbearbeitungsvereinbarung</a> in der aktuell ausgewiesenen Fassung.</span></label> : null}
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          {!canManage ? <p className="form-error">Nur der Inhaber der Organisation kann das Abonnement aktivieren. Bitte wende dich an den Inhaber.</p> : plan === 'enterprise'
            ? <a className="button primary" href="mailto:info@binso.ch?subject=Binso%20One%20Enterprise">Enterprise anfragen</a>
            : <button className="button primary" type="button" disabled={submitting || !legalAccepted} onClick={() => void startCheckout()}>{submitting ? 'Checkout wird geöffnet…' : 'Abonnement aktivieren'}</button>}
        </div> : <div className="public-form">
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button className="button secondary" type="button" onClick={() => router.push('/pricing')}>Preise ansehen</button>
        </div>}
      </section>
    </main>
  )
}

export default function SubscriptionRequiredPage() {
  return (
    <Suspense fallback={null}>
      <SubscriptionRequiredContent />
    </Suspense>
  )
}
