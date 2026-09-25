'use client'

import { useCallback, useEffect, useState } from 'react'
import { Input, Select, Textarea } from '@/components/ui/form-controls'
import { StatusBadge } from '@/components/ui/status-badge'
import { useFeedback } from '@/components/ui/feedback'
import type { SupportCase, SupportCaseCategory, SupportCaseType, SupportMessage } from '@/types/domain'
import { publicEnv } from '@/lib/config/public-env'
import { apiRequest, jsonBody } from '@/lib/http/api-client'


type Thread = { case: SupportCase; messages: SupportMessage[] }
type CasesResponse = { cases: SupportCase[] }
type CaseResponse = { case: SupportCase }

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
  const feedback = useFeedback()
  const [cases, setCases] = useState<SupportCase[]>([])
  const [selected, setSelected] = useState<Thread | null>(null)
  const [caseType, setCaseType] = useState<SupportCaseType>('support')
  const [category, setCategory] = useState<SupportCaseCategory>('usage')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadCases = useCallback(async () => {
    const payload = await apiRequest<CasesResponse>('/api/support/cases')
    setCases(payload.cases ?? [])
  }, [])

  const openCase = useCallback(async (id: string) => {
    const payload = await apiRequest<Thread>(`/api/support/cases?caseId=${encodeURIComponent(id)}`)
    setSelected(payload)
  }, [])

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const payload = await apiRequest<CasesResponse>('/api/support/cases')
        if (active) setCases(payload.cases ?? [])
      } catch (error) {
        if (active) feedback.error(error instanceof Error ? error.message : 'Support konnte nicht geladen werden.')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [feedback])

  async function create(event: React.FormEvent) {
    event.preventDefault()
    if (sending) return
    setSending(true)
    try {
      const payload = await apiRequest<CaseResponse>('/api/support/cases', {
        method: 'POST',
        body: jsonBody({
          caseType,
          category,
          subject,
          message,
          currentPage: window.location.pathname,
          buildVersion: publicEnv.buildId || 'unknown',
          browser: navigator.userAgent,
        }),
      })
      setSubject('')
      setMessage('')
      feedback.success('Anliegen wurde gesendet.')
      await loadCases()
      if (payload.case?.id) await openCase(payload.case.id)
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : 'Supportfall konnte nicht erstellt werden.')
    } finally {
      setSending(false)
    }
  }

  async function reply() {
    if (!selected || !message.trim() || sending) return
    setSending(true)
    try {
      await apiRequest('/api/support/cases', {
        method: 'PATCH',
        body: jsonBody({ caseId: selected.case.id, message }),
      })
      setMessage('')
      feedback.success('Antwort wurde gesendet.')
      await openCase(selected.case.id)
      await loadCases()
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : 'Nachricht konnte nicht gesendet werden.')
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="public-main public-main-narrow customer-support-v73">
      <div className="section-title"><div><span className="eyebrow">Support</span><h1>Wie können wir helfen?</h1><p>Support direkt in Binso One. Keine Passwörter oder Zugangsdaten senden.</p></div></div>

      <div className="support-layout-v73">
        <section>
          <h2>Neues Anliegen</h2>
          <form onSubmit={create} className="support-form-v73">
            <label><span>Anliegen</span><Select value={caseType} onChange={(event) => setCaseType(event.target.value as SupportCaseType)}>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></label>
            <label><span>Kategorie</span><Select value={category} onChange={(event) => setCategory(event.target.value as SupportCaseCategory)}>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></label>
            <label><span>Betreff</span><Input value={subject} maxLength={160} onChange={(event) => setSubject(event.target.value)} required /></label>
            <label><span>Nachricht</span><Textarea value={message} maxLength={5000} onChange={(event) => setMessage(event.target.value)} required rows={5} /></label>
            <button type="submit" className="button primary" disabled={sending}>{sending ? 'Wird gesendet…' : 'Anliegen senden'}</button>
          </form>
        </section>

        <section>
          <h2>Meine Anliegen</h2>
          <div className="data-list compact-overview-list" aria-busy={loading || undefined}>
            {cases.length ? cases.map((supportCase) => (
              <button type="button" className="data-row compact-overview-row" key={supportCase.id} onClick={() => void openCase(supportCase.id)}>
                <span className="primary-cell"><strong>{supportCase.caseNumber} · {supportCase.subject}</strong><small>{typeLabels[supportCase.caseType]} · {labels[supportCase.category]}</small></span>
                <StatusBadge status={supportCase.status} />
                <span className="row-disclosure">›</span>
              </button>
            )) : <div className="list-empty">{loading ? 'Wird geladen…' : 'Noch keine Anliegen.'}</div>}
          </div>
        </section>
      </div>

      {selected && (
        <section className="support-thread-v73">
          <div className="section-title"><div><h2>{selected.case.caseNumber} · {selected.case.subject}</h2><StatusBadge status={selected.case.status} /></div></div>
          {selected.messages.map((item) => <div key={item.id} className={`support-message ${item.authorType}`}><strong>{item.authorType === 'operator' ? 'Binso Support' : 'Du'}</strong><p>{item.message}</p></div>)}
          <div className="support-reply"><Textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={3} placeholder="Antwort schreiben" /><button className="button primary" onClick={() => void reply()} disabled={sending}>Antwort senden</button></div>
        </section>
      )}
    </main>
  )
}
