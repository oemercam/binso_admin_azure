'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { Input, Select } from '@/components/ui/form-controls'
import { planDefinitions } from '@/lib/data/plans'
import { signInUrl } from '@/lib/auth/urls'
import { PublicShell } from '@/components/public/public-shell'
import type { AppUser, OrganizationMembership, SignupRequest, SubscriptionPlan } from '@/types/domain'

type RegistrationState = {
  authenticated: boolean
  user?: AppUser
  memberships?: OrganizationMembership[]
  signup?: SignupRequest | null
}

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialPlan = (searchParams.get('plan') as SubscriptionPlan | null) ?? 'business'
  const [companyName, setCompanyName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [email, setEmail] = useState('')
  const [plan, setPlan] = useState<SubscriptionPlan>(initialPlan)
  const [sessionState, setSessionState] = useState<RegistrationState | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    queueMicrotask(() => {
      void (async () => {
        try {
          const response = await fetch('/api/registration', { cache: 'no-store' })
          if (response.status === 401) {
            if (!cancelled) setSessionState({ authenticated: false })
            return
          }
          const result = await response.json() as RegistrationState & { error?: string }
          if (!response.ok) throw new Error(result.error || 'Registrierung konnte nicht geladen werden.')
          if (cancelled) return
          setSessionState(result)
          if (result.memberships?.length) {
            router.replace('/dashboard')
            return
          }
          if (result.signup) {
            setCompanyName(result.signup.companyName)
            setOwnerName(result.signup.ownerName)
            setEmail(result.signup.email)
            setPlan(result.signup.plan)
          } else if (result.user) {
            setOwnerName(result.user.name)
            setEmail(result.user.email)
          }
        } catch (cause) {
          if (!cancelled) setError(cause instanceof Error ? cause.message : 'Registrierung konnte nicht geladen werden.')
        } finally {
          if (!cancelled) setLoading(false)
        }
      })()
    })
    return () => { cancelled = true }
  }, [router])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError('')
    try {
      const response = await fetch('/api/registration', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ companyName, ownerName, email, plan }),
      })
      const result = await response.json() as { signup?: SignupRequest; organizationId?: string; error?: string }
      if (!response.ok) {
        if (result.organizationId) {
          router.push('/dashboard')
          return
        }
        throw new Error(result.error || 'Registrierung konnte nicht gespeichert werden.')
      }
      router.push('/onboarding')
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Registrierung konnte nicht gespeichert werden.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return null

  if (!sessionState?.authenticated) {
    const returnTo = `/register?plan=${encodeURIComponent(plan)}`
    return (
      <PublicShell compact>
        <main className="public-main public-main-narrow register-entry">
          <section className="public-form-shell register-entry-shell">
            <div className="public-product-head">
              <span>Registrierung</span>
              <h1>In wenigen Schritten zu Binso One.</h1>
              <p>Starte mit einer sicheren Anmeldung. Danach richtest du dein Unternehmen mit den wichtigsten Angaben ein.</p>
            </div>
            <div className="register-entry-steps">
              <div><b>01</b><span><strong>Sicher anmelden</strong><small>E-Mail und Identität werden über den Anmeldedienst bestätigt.</small></span></div>
              <div><b>02</b><span><strong>Unternehmen einrichten</strong><small>Nur die Angaben erfassen, die für den Start benötigt werden.</small></span></div>
              <div><b>03</b><span><strong>14 Tage testen</strong><small>Noch keine Zahlung bei der Registrierung.</small></span></div>
            </div>
            <a className="button primary register-entry-primary" href={signInUrl(returnTo)}>Registrierung starten</a>
            <p className="auth-register-prompt">Bereits registriert? <a href={signInUrl('/post-login')}>Anmelden</a></p>
            <small className="register-privacy-note">Mit dem Start gelten unsere <a href="/legal/terms">AGB</a> und die <a href="/legal/privacy">Datenschutzerklärung</a>.</small>
          </section>
        </main>
      </PublicShell>
    )
  }

  return (
    <PublicShell compact>
      <main className="public-main public-main-narrow register-entry">
        <section className="public-form-shell register-entry-shell">
          <div className="public-product-head"><span>Registrierung</span><h1>Unternehmen erstellen</h1><p>Nur die wichtigsten Angaben. Weitere Einstellungen folgen geführt im Onboarding.</p></div>
          <form className="public-form" onSubmit={submit}>
          <label><span>Firma *</span><Input value={companyName} onChange={(event) => setCompanyName(event.target.value)} required /></label>
          <label><span>Name *</span><Input value={ownerName} onChange={(event) => setOwnerName(event.target.value)} required /></label>
          <label><span>Geschäftliche E-Mail *</span><Input type="email" value={email} readOnly required /></label>
          <label><span>Plan</span><Select value={plan} onChange={(event) => setPlan(event.target.value as SubscriptionPlan)}>{planDefinitions.map((item) => <option key={item.id} value={item.id}>{item.name}{item.monthlyPriceChf ? ` · CHF ${item.monthlyPriceChf}` : ''}</option>)}</Select></label>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button className="button primary" type="submit" disabled={submitting}>{submitting ? 'Wird gespeichert…' : 'Weiter zum Onboarding'}</button>
          <small>Noch keine Zahlung. Der 14-tägige Testzugang wird erst im nächsten Schritt aktiviert.</small>
          </form>
        </section>
      </main>
    </PublicShell>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  )
}
