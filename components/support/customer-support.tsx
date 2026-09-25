'use client'

import { useCallback, useEffect, useState } from 'react'
import { Input, Select, Textarea } from '@/components/ui/form-controls'
import type { SupportCase, SupportCaseCategory, SupportCaseType, SupportMessage } from '@/types/domain'

type Thread = { case: SupportCase; messages: SupportMessage[] }

const labels: Record<SupportCaseCategory, string> = {
  usage: 'Frage zur Nutzung',
  technical: 'Technisches Problem',
  billing: 'Abrechnung und Abo',
  account: 'Konto und Anmeldung',
  other: 'Andere Frage',
}

const typeLabels: Record<SupportCaseType, string> = {
  support: 'Support',
  feedback: 'Feedback',
  feature_request: 'Funktionswunsch',
  billing: 'Abrechnung und Abo',
}

export function CustomerSupport() {
  const [cases, setCases] = useState<SupportCase[]>([])
  const [selected, setSelected] = useState<Thread | null>(null)
  const [caseType, setCaseType] = useState<SupportCaseType>('support')
  const [category, setCategory] = useState<SupportCaseCategory>('usage')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const loadCases = useCallback(async () => {
    const response = await fetch('/api/support/cases', { cache: 'no-store' })
    const payload = (await response.json()) as { cases?: SupportCase[]; error?: string }
    if (response.ok) setCases(payload.cases ?? [])
    else setError(payload.error ?? 'Support konnte nicht geladen werden.')
  }, [])

  const openCase = useCallback(async (id: string) => {
    const response = await fetch(`/api/support/cases?caseId=${encodeURIComponent(id)}`, { cache: 'no-store' })
    const payload = (await response.json()) as Thread & { error?: string }
    if (response.ok) setSelected(payload)
    else setError(payload.error ?? 'Supportfall konnte nicht geladen werden.')
  }, [])

  useEffect(() => {
    let active = true

    void fetch('/api/support/cases', { cache: 'no-store' })
      .then(async (response) => ({
        response,
        payload: (await response.json()) as { cases?: SupportCase[]; error?: string },
      }))
      .then(({ response, payload }) => {
        if (!active) return
        if (response.ok) setCases(payload.cases ?? [])
        else setError(payload.error ?? 'Support konnte nicht geladen werden.')
      })

    return () => {
      active = false
    }
  }, [])

  async function create(event: React.FormEvent) {
    event.preventDefault()
    if (sending) return
    setSending(true)
    setError('')
    try {
      const response = await fetch('/api/support/cases', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          caseType,
          category,
          subject,
          message,
          currentPage: window.location.pathname,
          buildVersion: process.env.NEXT_PUBLIC_BUILD_ID ?? 'unknown',
          browser: navigator.userAgent,
        }),
      })
      const payload = (await response.json()) as { case?: SupportCase; error?: string }
      if (!response.ok || !payload.case) {
        throw new Error(payload.error || 'Supportfall konnte nicht erstellt werden.')
      }
      setSubject('')
      setMessage('')
      await loadCases()
      await openCase(payload.case.id)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Supportfall konnte nicht erstellt werden.')
    } finally {
      setSending(false)
    }
  }

  async function reply() {
    if (!selected || !message.trim() || sending) return
    setSending(true)
    try {
      const response = await fetch('/api/support/cases', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ caseId: selected.case.id, message }),
      })
      const payload = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(payload.error || 'Nachricht konnte nicht gesendet werden.')
      setMessage('')
      await openCase(selected.case.id)
      await loadCases()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Nachricht konnte nicht gesendet werden.')
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="public-main public-main-narrow customer-support-v73">
      <div className="section-title">
        <div>
          <span className="eyebrow">Support</span>
          <h1>Wie können wir helfen?</h1>
          <p>Support direkt in Binso One. Keine Passwörter oder Zugangsdaten senden.</p>
        </div>
      </div>

      <div className="support-layout-v73">
        <section>
          <h2>Neues Anliegen</h2>
          <form onSubmit={create} className="support-form-v73">
            <label>
              <span>Anliegen</span>
              <Select value={caseType} onChange={(event) => setCaseType(event.target.value as SupportCaseType)}>
                {Object.entries(typeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </label>
            <label>
              <span>Kategorie</span>
              <Select value={category} onChange={(event) => setCategory(event.target.value as SupportCaseCategory)}>
                {Object.entries(labels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </label>
            <label>
              <span>Betreff</span>
              <Input value={subject} maxLength={160} onChange={(event) => setSubject(event.target.value)} required />
            </label>
            <label>
              <span>Nachricht</span>
              <Textarea value={message} maxLength={5000} onChange={(event) => setMessage(event.target.value)} required rows={5} />
            </label>
            <button type="submit" className="button primary" disabled={sending}>
              {sending ? 'Wird gesendet…' : 'Anliegen senden'}
            </button>
          </form>
        </section>

        <section>
          <h2>Meine Anliegen</h2>
          <div className="data-list compact-overview-list">
            {cases.length ? cases.map((supportCase) => (
              <button
                type="button"
                className="data-row compact-overview-row"
                key={supportCase.id}
                onClick={() => void openCase(supportCase.id)}
              >
                <span className="primary-cell">
                  <strong>{supportCase.caseNumber} · {supportCase.subject}</strong>
                  <small>{typeLabels[supportCase.caseType]} · {labels[supportCase.category]} · {supportCase.status}</small>
                </span>
                <span className="row-disclosure">›</span>
              </button>
            )) : <div className="list-empty">Noch keine Anliegen.</div>}
          </div>
        </section>
      </div>

      {selected && (
        <section className="support-thread-v73">
          <div className="section-title">
            <div>
              <h2>{selected.case.caseNumber} · {selected.case.subject}</h2>
              <p>Status: {selected.case.status}</p>
            </div>
          </div>
          {selected.messages.map((item) => (
            <div key={item.id} className={`support-message ${item.authorType}`}>
              <strong>{item.authorType === 'operator' ? 'Binso Support' : 'Du'}</strong>
              <p>{item.message}</p>
            </div>
          ))}
          <div className="support-reply">
            <Textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={3} placeholder="Antwort schreiben" />
            <button className="button primary" onClick={() => void reply()} disabled={sending}>Antwort senden</button>
          </div>
        </section>
      )}

      {error && <p className="form-error" role="alert">{error}</p>}
    </main>
  )
}
