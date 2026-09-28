'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { Input, Select } from '@/components/ui/form-controls'
import { selfServicePlanDefinitions } from '@/lib/data/plans'
import { customerSignInUrl } from '@/lib/auth/urls'
import { PublicShell } from '@/components/public/public-shell'
import type { AppUser, OrganizationMembership, SignupMode, SignupRequest, SubscriptionPlan } from '@/types/domain'
import { apiRequest, jsonBody } from '@/lib/http/api-client'
import { ApiError } from '@/lib/http/errors'
import { TRIAL_DAYS } from '@/lib/config/product'

type RegistrationState = {
  authenticated: boolean
  user?: AppUser
  memberships?: OrganizationMembership[]
  signup?: SignupRequest | null
}

function requestedSignupMode(value: string | null): SignupMode {
  if (value === 'demo') return 'demo'
  if (value === 'subscription') return 'subscription'
  return 'trial'
}

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedMode = requestedSignupMode(searchParams.get('mode'))
  const requestedPlan = searchParams.get('plan') as SubscriptionPlan | null
  const initialPlan: SubscriptionPlan = requestedMode === 'demo'
    ? 'business'
    : selfServicePlanDefinitions.some((item) => item.id === requestedPlan) ? requestedPlan as SubscriptionPlan : 'business'
  const [companyName, setCompanyName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [email, setEmail] = useState('')
  const [plan, setPlan] = useState<SubscriptionPlan>(initialPlan)
  const [sessionState, setSessionState] = useState<RegistrationState | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const mode: SignupMode = sessionState?.signup?.mode ?? requestedMode
  const demoMode = mode === 'demo'
  const subscriptionMode = mode === 'subscription'

  useEffect(() => {
    let cancelled = false
    queueMicrotask(() => {
      void (async () => {
        try {
          let result: RegistrationState
          try {
            result = await apiRequest<RegistrationState>('/api/registration', { retry: 0 })
          } catch (error) {
            if (error instanceof ApiError && error.status === 401) {
              if (!cancelled) setSessionState({ authenticated: false })
              return
            }
            throw error
          }
          if (cancelled) return
          setSessionState(result)
          if (result.signup) {
            setCompanyName(result.signup.companyName)
            setOwnerName(result.signup.ownerName)
            setEmail(result.signup.email)
            setPlan(result.signup.mode === 'demo' ? 'business' : result.signup.plan)
          } else if (result.user) {
            setOwnerName(result.user.name)
            setEmail(result.user.email)
            if (requestedMode === 'demo') setCompanyName('Mein Demo-Unternehmen')
          }
        } catch (cause) {
          if (!cancelled) setError(cause instanceof Error ? cause.message : 'Registrierung konnte nicht geladen werden.')
        } finally {
          if (!cancelled) setLoading(false)
        }
      })()
    })
    return () => { cancelled = true }
  }, [requestedMode])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError('')
    try {
      const result = await apiRequest<{ signup?: SignupRequest; organizationId?: string }>('/api/registration', {
        method: 'POST',
        body: jsonBody({ companyName, ownerName, email, plan: demoMode ? 'business' : plan, mode }),
      })
      if (result.organizationId) {
        router.push(subscriptionMode ? '/subscription-required' : '/dashboard')
        return
      }
      router.push('/onboarding')
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Registrierung konnte nicht gespeichert werden.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <PublicShell light>
        <main className="public-main register-entry register-entry-v706" aria-busy="true">
          <section className="register-loading-state" aria-label="Registrierung wird geladen">
            <span className="public-eyebrow">Binso One</span>
            <h1>Registrierung wird vorbereitet.</h1>
          </section>
        </main>
      </PublicShell>
    )
  }

  if (!sessionState?.authenticated) {
    const query = new URLSearchParams()
    query.set('mode', mode)
    if (!demoMode) query.set('plan', plan)
    const returnTo = `/register?${query.toString()}`
    return (
      <PublicShell light>
        <main className="public-main register-entry register-entry-v706">
          <section className="register-start-layout">
            <div className="register-start-copy">
              <span className="public-eyebrow">{demoMode ? 'Produktdemo' : subscriptionMode ? 'Abo abschliessen' : 'Kostenlos testen'}</span>
              <h1>{demoMode ? 'Binso One mit Beispieldaten ausprobieren.' : subscriptionMode ? 'Konto erstellen und Abo aktivieren.' : 'Einfach starten. Den Rest später ergänzen.'}</h1>
              <p>{demoMode ? 'Registriere dich mit deiner E-Mail-Adresse. Nach der Bestätigung erhältst du einen isolierten Demo-Arbeitsbereich mit fiktiven Daten.' : subscriptionMode ? 'Registriere dich mit E-Mail und Passwort. Deine E-Mail-Adresse wird mit einem Bestätigungscode verifiziert. Nach der Einrichtung aktivierst du dein gewähltes Abo im sicheren Checkout.' : `Registriere dich mit E-Mail und Passwort. Deine E-Mail-Adresse wird mit einem Bestätigungscode verifiziert. Danach kannst du Binso One ${TRIAL_DAYS} Tage kostenlos testen.`}</p>
              <div className="register-start-facts" aria-label={demoMode ? 'Eigenschaften der Produktdemo' : subscriptionMode ? 'Eigenschaften des Abonnements' : 'Vorteile der Testphase'}>
                {demoMode ? <><span>Fiktive Beispieldaten</span><span>Keine Abrechnung</span><span>24 Stunden verfügbar</span></> : subscriptionMode ? <><span>E-Mail wird verifiziert</span><span>Plan vor Zahlung sichtbar</span><span>Aktiv nach Checkout</span></> : <><span>{TRIAL_DAYS} Tage kostenlos testen</span><span>Keine Zahlungsdaten beim Start</span><span>Desktop, Mobile und PWA</span></>}
              </div>
            </div>
            <div className="register-start-flow">
              <div className="register-start-step"><b>01</b><span><strong>E-Mail bestätigen</strong><small>Microsoft Entra External ID sendet beim Erstellen des Kontos einen Bestätigungscode an deine E-Mail-Adresse. Danach legst du dein Passwort fest.</small></span></div>
              <div className="register-start-step"><b>02</b><span><strong>{demoMode ? 'Demo kurz einrichten' : 'Unternehmen bestätigen'}</strong><small>{demoMode ? 'Wir übernehmen nur die nötigen Angaben und erstellen deinen persönlichen Demo-Bereich.' : 'Firmenname, Kontakt und bestätigte E-Mail genügen für den Einstieg.'}</small></span></div>
              <div className="register-start-step"><b>03</b><span><strong>{subscriptionMode ? 'Abo aktivieren' : 'Binso One starten'}</strong><small>{demoMode ? 'Du erhältst einen isolierten Arbeitsbereich mit fiktiven Kunden, Auftrag, Zeiten und Rechnung.' : subscriptionMode ? 'Nach der Einrichtung bestätigst du AGB und AVV und schliesst das gewählte Abo über Stripe ab.' : 'Dein Testzugang wird erstellt und du kannst sofort mit Binso One arbeiten.'}</small></span></div>
              <a className="button primary register-entry-primary" href={customerSignInUrl(returnTo)}>{demoMode ? 'Demo registrieren' : subscriptionMode ? 'Konto erstellen und Abo starten' : 'Kostenlos registrieren'}</a>
              <p className="auth-register-prompt">Bereits registriert? <a href="/sign-in">Anmelden</a></p>
              <small className="register-privacy-note">Mit der Registrierung bestätigst du, dass du die <a href="/legal/privacy">Datenschutzerklärung</a> zur Kenntnis genommen hast. AGB und AVV werden vor einem kostenpflichtigen Abo separat bestätigt.</small>
            </div>
          </section>
        </main>
      </PublicShell>
    )
  }

  return (
    <PublicShell light>
      <main className="public-main register-entry register-entry-v706">
        <section className="register-form-layout">
          <div className="register-start-copy">
            <span className="public-eyebrow">{demoMode ? 'Produktdemo' : subscriptionMode ? 'Abo abschliessen' : 'Kostenlos testen'}</span>
            <h1>{demoMode ? 'Nur kurz bestätigen.' : 'Nur drei Angaben für den Start.'}</h1>
            <p>{demoMode ? 'Diese Angaben gehören nur zu deinem isolierten Demo-Arbeitsbereich. Alle Geschäftsdaten darin sind fiktiv.' : 'Deine E-Mail wurde durch den Identity Provider bestätigt. Alles Weitere kannst du später ergänzen.'}</p>
          </div>
          <div className="register-form-panel">
            <form className="public-form" onSubmit={submit}>
              <label><span>{demoMode ? 'Name des Demo-Bereichs *' : 'Unternehmen *'}</span><Input autoComplete="organization" value={companyName} onChange={(event) => setCompanyName(event.target.value)} required /></label>
              <label><span>Vor- und Nachname *</span><Input autoComplete="name" value={ownerName} onChange={(event) => setOwnerName(event.target.value)} required /></label>
              <label><span>Bestätigte E-Mail *</span><Input type="email" autoComplete="email" value={email} readOnly required /><small>Diese Adresse stammt aus deinem verifizierten Kundenkonto.</small></label>
              {demoMode ? <div className="public-form-readonly"><span>Demo-Umfang</span><strong>Business-Funktionen · 24 Stunden</strong><small>Keine Zahlung und keine externen Aktionen.</small></div> : <label><span>Plan</span><Select value={plan} onChange={(event) => setPlan(event.target.value as SubscriptionPlan)}>{selfServicePlanDefinitions.map((item) => <option key={item.id} value={item.id}>{item.name}{item.monthlyPriceChf ? ` · CHF ${item.monthlyPriceChf}/Monat` : ''}</option>)}</Select></label>}
              {error ? <p className="form-error" role="alert">{error}</p> : null}
              <button className="button primary" type="submit" disabled={submitting}>{submitting ? 'Wird gespeichert…' : 'Weiter zur Einrichtung'}</button>
              <small>{demoMode ? 'Der Demo-Bereich enthält ausschliesslich fiktive Beispieldaten und kann nicht kostenpflichtig werden.' : subscriptionMode ? 'Noch keine Belastung. Die Zahlung erfolgt erst nach der Einrichtung im Stripe Checkout.' : `Keine Zahlungsdaten beim Start. Der Testzugang läuft ${TRIAL_DAYS} Tage.`}</small>
            </form>
          </div>
        </section>
      </main>
    </PublicShell>
  )
}

function RegisterLoadingShell() {
  return (
    <PublicShell light>
      <main className="public-main register-entry register-entry-v706" aria-busy="true">
        <section className="register-loading-state" aria-label="Registrierung wird geladen">
          <span className="public-eyebrow">Binso One</span>
          <h1>Registrierung wird vorbereitet.</h1>
        </section>
      </main>
    </PublicShell>
  )
}

export default function RegisterPage() {
  return <Suspense fallback={<RegisterLoadingShell />}><RegisterForm /></Suspense>
}
