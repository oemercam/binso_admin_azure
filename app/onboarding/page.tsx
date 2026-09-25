'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BinsoLogo } from '@/components/ui/binso-logo'
import { Input } from '@/components/ui/form-controls'
import type { OrganizationMembership, SignupRequest } from '@/types/domain'
import { apiRequest, jsonBody } from '@/lib/http/api-client'

type Signup = SignupRequest & {
  onboardingStatus: 'not_started' | 'in_progress' | 'completed' | 'skipped'
  onboardingStep: number
  onboardingCompletedSteps: number[]
  onboardingModulePreferences: string[]
  onboardingBusinessSettings: Record<string, string | number | boolean>
}

type State = { signup: Signup | null; memberships: OrganizationMembership[] }
type Settings = { address: string; zip: string; city: string; uid: string }

const steps = ['Angaben prüfen', 'Unternehmen ergänzen', 'Fertig'] as const

export default function OnboardingPage() {
  const router = useRouter()
  const [state, setState] = useState<State | null>(null)
  const [ready, setReady] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)
  const [settings, setSettings] = useState<Settings>({ address: '', zip: '', city: '', uid: '' })

  const signup = state?.signup ?? null
  const demoMode = signup?.mode === 'demo'
  const existing = state?.memberships?.[0]
  const progress = useMemo(() => Math.round((step / steps.length) * 100), [step])

  useEffect(() => {
    let cancelled = false
    queueMicrotask(() => {
      void (async () => {
        try {
          const result = await apiRequest<State>('/api/onboarding')
          if (cancelled) return
          setState(result)
          if (result.signup) {
            setStep(Math.min(Math.max(result.signup.onboardingStep || 1, 1), steps.length))
            const saved = result.signup.onboardingBusinessSettings || {}
            setSettings({
              address: typeof saved.address === 'string' ? saved.address : '',
              zip: typeof saved.zip === 'string' ? saved.zip : '',
              city: typeof saved.city === 'string' ? saved.city : '',
              uid: typeof saved.uid === 'string' ? saved.uid : '',
            })
          }
        } catch (cause) {
          if (!cancelled) setError(cause instanceof Error ? cause.message : 'Einrichtung konnte nicht geladen werden.')
        } finally {
          if (!cancelled) setReady(true)
        }
      })()
    })
    return () => { cancelled = true }
  }, [])

  async function saveStep(nextStep: number) {
    if (!signup) return null
    setSaving(true)
    setError('')
    try {
      const completedSteps = Array.from(new Set([...(signup.onboardingCompletedSteps || []), step])).filter((value) => value < steps.length)
      const result = await apiRequest<{ signup?: Signup }>('/api/onboarding', {
        method: 'PATCH',
        body: jsonBody({
          signupId: signup.id,
          step: nextStep,
          completedSteps,
          modulePreferences: [],
          businessSettings: settings,
          status: 'in_progress',
        }),
      })
      if (!result.signup) throw new Error('Schritt konnte nicht gespeichert werden.')
      setState((current) => current ? { ...current, signup: result.signup! } : current)
      setStep(nextStep)
      return result.signup
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Schritt konnte nicht gespeichert werden.')
      return null
    } finally {
      setSaving(false)
    }
  }

  async function finish() {
    if (!signup || saving) return
    setSaving(true)
    setError('')
    try {
      const saved = await apiRequest<{ signup?: Signup }>('/api/onboarding', {
        method: 'PATCH',
        body: jsonBody({
          signupId: signup.id,
          step: steps.length,
          completedSteps: [1, 2],
          modulePreferences: [],
          businessSettings: settings,
          status: 'in_progress',
        }),
      })
      if (!saved.signup) throw new Error('Angaben konnten nicht gespeichert werden.')

      const created = await apiRequest<{ organizationId?: string }>('/api/onboarding', {
        method: 'POST',
        body: jsonBody({ signupId: signup.id }),
      })
      if (!created.organizationId) throw new Error('Binso One konnte nicht eingerichtet werden.')
      router.push('/dashboard?welcome=1')
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Binso One konnte nicht eingerichtet werden.')
    } finally {
      setSaving(false)
    }
  }

  if (!ready) {
    return <main className="onboarding-entry-page"><div className="onboarding-entry-loading" aria-label="Einrichtung wird geladen" /></main>
  }

  if (existing) {
    return (
      <main className="onboarding-entry-page">
        <section className="onboarding-entry-shell compact">
          <div className="onboarding-entry-brand"><BinsoLogo /><span>ONE</span></div>
          <div className="onboarding-entry-done"><span>Bereit</span><h1>Dein Unternehmen ist bereits eingerichtet.</h1><p>Du kannst direkt zu Binso One wechseln.</p><button className="button primary" onClick={() => router.push('/dashboard')}>Zum Dashboard</button></div>
        </section>
      </main>
    )
  }

  if (!signup) {
    return (
      <main className="onboarding-entry-page">
        <section className="onboarding-entry-shell compact">
          <div className="onboarding-entry-brand"><BinsoLogo /><span>ONE</span></div>
          <div className="onboarding-entry-done"><h1>Keine offene Registrierung gefunden.</h1><p>{error || 'Starte die Registrierung erneut.'}</p><Link className="button primary" href="/register">Zur Registrierung</Link></div>
        </section>
      </main>
    )
  }

  return (
    <main className="onboarding-entry-page">
      <section className="onboarding-entry-shell">
        <header className="onboarding-entry-header">
          <Link className="onboarding-entry-brand" href="/" aria-label="Binso One Startseite"><BinsoLogo /><span>ONE</span></Link>
          <span>{demoMode ? 'Demo einrichten' : 'Einrichtung'}</span>
        </header>

        <div className="onboarding-entry-layout">
          <aside className="onboarding-entry-context">
            <span className="public-eyebrow">{demoMode ? 'Produktdemo' : 'Schnell startklar'}</span>
            <h1>{demoMode ? 'Kurz einrichten. Dann direkt ausprobieren.' : 'Nur das Nötigste für den Start.'}</h1>
            <p>{demoMode ? 'Der Demo-Arbeitsbereich wird mit fiktiven Beispieldaten gefüllt. Optionale Angaben kannst du einfach überspringen.' : 'Du kannst nichts kaputtmachen. Alle Angaben lassen sich später in Binso One ergänzen oder ändern.'}</p>
            <div className="onboarding-entry-step-list" aria-label="Schritte der Einrichtung">
              {steps.map((label, index) => {
                const number = index + 1
                return <span key={label} className={number === step ? 'active' : number < step ? 'done' : ''}><b>{number < step ? '✓' : number}</b>{label}</span>
              })}
            </div>
          </aside>

          <div className="onboarding-entry-card">
            <div className="onboarding-entry-progress">
              <div><span>Schritt {step} von {steps.length}</span><strong>{steps[step - 1]}</strong></div>
              <i><b style={{ width: `${progress}%` }} /></i>
            </div>

            <div className="onboarding-entry-content">
              {step === 1 ? (
                <>
                  <span className="onboarding-entry-kicker">Bereits übernommen</span>
                  <h2>Stimmen diese Angaben?</h2>
                  <p>Sie stammen aus deiner Registrierung. Falls etwas nicht stimmt, kannst du zur Registrierung zurückgehen.</p>
                  <dl className="onboarding-entry-summary">
                    <div><dt>Unternehmen</dt><dd>{signup.companyName}</dd></div>
                    <div><dt>Kontakt</dt><dd>{signup.ownerName}</dd></div>
                    <div><dt>E-Mail</dt><dd>{signup.email}</dd></div>
                    <div><dt>{demoMode ? 'Zugang' : 'Plan'}</dt><dd>{demoMode ? 'Produktdemo · Business-Umfang' : signup.plan}</dd></div>
                  </dl>
                  <Link className="onboarding-entry-edit" href={`/register?plan=${signup.plan}`}>Angaben ändern</Link>
                </>
              ) : null}

              {step === 2 ? (
                <>
                  <span className="onboarding-entry-kicker">Optional</span>
                  <h2>Unternehmen ergänzen</h2>
                  <p>Diese Angaben helfen später bei Dokumenten. Du kannst sie überspringen und jederzeit nachtragen.</p>
                  <div className="onboarding-entry-form">
                    <label className="full"><span>Adresse</span><Input autoComplete="street-address" value={settings.address} onChange={(event) => setSettings((current) => ({ ...current, address: event.target.value }))} placeholder="Strasse und Hausnummer" /></label>
                    <label><span>PLZ</span><Input autoComplete="postal-code" inputMode="numeric" value={settings.zip} onChange={(event) => setSettings((current) => ({ ...current, zip: event.target.value }))} placeholder="9050" /></label>
                    <label><span>Ort</span><Input autoComplete="address-level2" value={settings.city} onChange={(event) => setSettings((current) => ({ ...current, city: event.target.value }))} placeholder="Appenzell" /></label>
                    <label className="full"><span>UID / MWST-Nr.</span><Input value={settings.uid} onChange={(event) => setSettings((current) => ({ ...current, uid: event.target.value }))} placeholder="CHE-123.456.789" /></label>
                  </div>
                  <small className="onboarding-entry-note">Kein Pflichtfeld in diesem Schritt.</small>
                </>
              ) : null}

              {step === 3 ? (
                <>
                  <span className="onboarding-entry-kicker">Fertig</span>
                  <h2>{demoMode ? 'Deine Produktdemo ist bereit.' : 'Binso One ist bereit.'}</h2>
                  <p>{demoMode ? 'Wir erstellen jetzt deinen isolierten Demo-Arbeitsbereich mit fiktiven Kunden, Angebot, Auftrag, Zeiten und Rechnung. Externe Aktionen und Abrechnung bleiben deaktiviert.' : 'Wir erstellen jetzt deinen Arbeitsbereich. Danach kannst du direkt den ersten Kunden erfassen. Bankverbindung, Logo, Vorlagen und weitere Einstellungen folgen erst, wenn du sie brauchst.'}</p>
                  <div className="onboarding-entry-ready-list">
                    <span><b>✓</b>{demoMode ? 'Isolierter Demo-Arbeitsbereich' : 'Unternehmen und Zugang'}</span>
                    <span><b>✓</b>{demoMode ? 'Fiktive Beispieldaten' : '14-tägiger Testzugang'}</span>
                    <span><b>✓</b>{demoMode ? 'Keine Abrechnung oder externen Aktionen' : 'Einstellungen später änderbar'}</span>
                  </div>
                </>
              ) : null}
            </div>

            {error ? <p className="form-error onboarding-entry-error" role="alert">{error}</p> : null}

            <footer className="onboarding-entry-actions">
              <button className="button secondary" type="button" disabled={saving || step === 1} onClick={() => void saveStep(step - 1)}>Zurück</button>
              <span>Deine Eingaben werden beim Weitergehen gespeichert.</span>
              {step < steps.length ? (
                <button className="button primary" type="button" disabled={saving} onClick={() => void saveStep(step + 1)}>{saving ? 'Wird gespeichert…' : step === 2 ? 'Weiter' : 'Bestätigen und weiter'}</button>
              ) : (
                <button className="button primary" type="button" disabled={saving} onClick={() => void finish()}>{saving ? 'Wird eingerichtet…' : demoMode ? 'Produktdemo öffnen' : 'Binso One starten'}</button>
              )}
            </footer>
          </div>
        </div>
      </section>
    </main>
  )
}
