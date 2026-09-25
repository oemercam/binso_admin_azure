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

type RegistrationState = {
  authenticated: boolean
  user?: AppUser
  memberships?: OrganizationMembership[]
  signup?: SignupRequest | null
}

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedMode: SignupMode = searchParams.get('mode') === 'demo' ? 'demo' : 'trial'
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
        router.push('/dashboard')
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

  if (loading) return null

  if (!sessionState?.authenticated) {
    const query = new URLSearchParams()
    if (demoMode) query.set('mode', 'demo')
    else query.set('plan', plan)
    const returnTo = `/register?${query.toString()}`
    return (
      <PublicShell light>
        <main className="public-main register-entry register-entry-v706">
          <section className="register-start-layout">
            <div className="register-start-copy">
              <span className="public-eyebrow">{demoMode ? 'Produktdemo' : 'Konto erstellen'}</span>
              <h1>{demoMode ? 'Binso One mit Beispieldaten ausprobieren.' : 'Einfach starten. Den Rest später ergänzen.'}</h1>
              <p>{demoMode ? 'Melde dich mit deinem Kundenkonto an. Danach führen wir dich kurz durch die Einrichtung und öffnen einen isolierten Demo-Arbeitsbereich mit fiktiven Daten.' : 'Erstelle deinen Zugang und bestätige nur die wichtigsten Angaben. Die Einrichtung danach dauert nur wenige Minuten.'}</p>
              <div className="register-start-facts" aria-label={demoMode ? 'Eigenschaften der Produktdemo' : 'Vorteile der Testphase'}>
                {demoMode ? <><span>Fiktive Beispieldaten</span><span>Keine Abrechnung</span><span>24 Stunden verfügbar</span></> : <><span>30 Tage kostenlos testen</span><span>Keine Zahlungsdaten beim Start</span><span>Desktop, Mobile und PWA</span></>}
              </div>
            </div>
            <div className="register-start-flow">
              <div className="register-start-step"><b>01</b><span><strong>Kundenkonto öffnen</strong><small>Die Identität wird über den Kunden-Login bestätigt. Binso One speichert kein eigenes Passwort.</small></span></div>
              <div className="register-start-step"><b>02</b><span><strong>{demoMode ? 'Demo kurz einrichten' : 'Unternehmen bestätigen'}</strong><small>{demoMode ? 'Wir übernehmen nur die nötigen Angaben und erstellen deinen persönlichen Demo-Bereich.' : 'Firmenname, Kontakt und geschäftliche E-Mail genügen für den Einstieg.'}</small></span></div>
              <div className="register-start-step"><b>03</b><span><strong>Binso One starten</strong><small>{demoMode ? 'Du erhältst einen isolierten Arbeitsbereich mit fiktiven Kunden, Auftrag, Zeiten und Rechnung.' : 'Weitere Angaben kannst du später ergänzen, wenn du sie wirklich brauchst.'}</small></span></div>
              <a className="button primary register-entry-primary" href={customerSignInUrl(returnTo)}>{demoMode ? 'Demo starten' : 'Konto erstellen'}</a>
              <p className="auth-register-prompt">Bereits registriert? <a href="/sign-in">Anmelden</a></p>
              <small className="register-privacy-note">Mit dem Start gelten unsere <a href="/legal/terms">AGB</a> und die <a href="/legal/privacy">Datenschutzerklärung</a>.</small>
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
            <span className="public-eyebrow">{demoMode ? 'Produktdemo' : 'Konto erstellen'}</span>
            <h1>{demoMode ? 'Nur kurz bestätigen.' : 'Nur drei Angaben für den Start.'}</h1>
            <p>{demoMode ? 'Diese Angaben gehören nur zu deinem isolierten Demo-Arbeitsbereich. Alle Geschäftsdaten darin sind fiktiv.' : 'Wir übernehmen bereits bekannte Daten. Alles Weitere kannst du später ergänzen.'}</p>
          </div>
          <div className="register-form-panel">
            <form className="public-form" onSubmit={submit}>
              <label><span>{demoMode ? 'Name des Demo-Bereichs *' : 'Unternehmen *'}</span><Input autoComplete="organization" value={companyName} onChange={(event) => setCompanyName(event.target.value)} required /></label>
              <label><span>Vor- und Nachname *</span><Input autoComplete="name" value={ownerName} onChange={(event) => setOwnerName(event.target.value)} required /></label>
              <label><span>Geschäftliche E-Mail *</span><Input type="email" autoComplete="email" value={email} readOnly required /><small>Aus deinem bestätigten Kundenkonto.</small></label>
              {demoMode ? <div className="public-form-readonly"><span>Demo-Umfang</span><strong>Business-Funktionen · 24 Stunden</strong><small>Keine Zahlung und keine externen Aktionen.</small></div> : <label><span>Plan</span><Select value={plan} onChange={(event) => setPlan(event.target.value as SubscriptionPlan)}>{selfServicePlanDefinitions.map((item) => <option key={item.id} value={item.id}>{item.name}{item.monthlyPriceChf ? ` · CHF ${item.monthlyPriceChf}` : ''}</option>)}</Select></label>}
              {error ? <p className="form-error" role="alert">{error}</p> : null}
              <button className="button primary" type="submit" disabled={submitting}>{submitting ? 'Wird gespeichert…' : 'Weiter zur Einrichtung'}</button>
              <small>{demoMode ? 'Der Demo-Bereich enthält ausschliesslich fiktive Beispieldaten und kann nicht kostenpflichtig werden.' : 'Keine Zahlungsdaten beim Start. Du siehst die gewählten Konditionen, bevor eine kostenpflichtige Nutzung beginnt.'}</small>
            </form>
          </div>
        </section>
      </main>
    </PublicShell>
  )
}

export default function RegisterPage() {
  return <Suspense fallback={null}><RegisterForm /></Suspense>
}
