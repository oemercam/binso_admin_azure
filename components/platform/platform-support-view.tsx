'use client'

import { useCallback, useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Select, Textarea } from '@/components/ui/form-controls'
import type { SupportCase, SupportCaseClassification, SupportCaseStatus, SupportCaseType, SupportMessage } from '@/types/domain'

type PlatformCase = SupportCase & { organizationName: string }
type Thread = { case: PlatformCase; messages: SupportMessage[] }

export function PlatformSupportView() {
  const [cases, setCases] = useState<PlatformCase[]>([])
  const [thread, setThread] = useState<Thread | null>(null)
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<SupportCaseStatus>('in_progress')
  const [caseType, setCaseType] = useState<SupportCaseType>('support')
  const [classification, setClassification] = useState<SupportCaseClassification | ''>('')

  const loadCases = useCallback(async () => {
    const response = await fetch('/api/platform/support', { cache: 'no-store' })
    const payload = (await response.json()) as { cases?: PlatformCase[] }
    if (response.ok) setCases(payload.cases ?? [])
  }, [])

  const openCase = useCallback(async (id: string) => {
    const response = await fetch(`/api/platform/support?caseId=${encodeURIComponent(id)}`, { cache: 'no-store' })
    const payload = (await response.json()) as Thread
    if (response.ok) {
      setThread(payload)
      setStatus(payload.case.status)
      setCaseType(payload.case.caseType)
      setClassification(payload.case.classification ?? '')
    }
  }, [])

  useEffect(() => {
    let active = true

    void fetch('/api/platform/support', { cache: 'no-store' })
      .then(async (response) => ({ response, payload: (await response.json()) as { cases?: PlatformCase[] } }))
      .then(({ response, payload }) => {
        if (active && response.ok) setCases(payload.cases ?? [])
      })

    return () => {
      active = false
    }
  }, [])

  async function reply() {
    if (!thread) return
    const response = await fetch('/api/platform/support', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ caseId: thread.case.id, message, status, caseType, classification: classification || null }),
    })
    if (response.ok) {
      setMessage('')
      await openCase(thread.case.id)
      await loadCases()
    }
  }

  return (
    <section className="page apple-page">
      <PageHeader
        title="Support & Feedback"
        description="Support, Feedback und Funktionswünsche mit sicherem Diagnosekontext und nachvollziehbarem Verlauf."
      />
      <div className="support-layout-v73">
        <div className="data-list compact-overview-list">
          {cases.map((supportCase) => (
            <button
              type="button"
              className="data-row compact-overview-row"
              key={supportCase.id}
              onClick={() => void openCase(supportCase.id)}
            >
              <span className="primary-cell">
                <strong>{supportCase.caseNumber} · {supportCase.subject}</strong>
                <small>{supportCase.organizationName} · {supportCase.caseType} · {supportCase.category}{supportCase.isPilotRelated ? ' · Pilot' : ''}</small>
              </span>
              <span>{supportCase.status}</span>
              <span className="row-disclosure">›</span>
            </button>
          ))}
        </div>

        {thread && (
          <div className="support-thread-v73">
            <h2>{thread.case.caseNumber}</h2>
            <p>
              {thread.case.organizationName} · {thread.case.caseType}{thread.case.isPilotRelated ? ' · Pilot' : ''} · {thread.case.currentPage ?? 'Kein Seitenkontext'} · Build{' '}
              {thread.case.buildVersion ?? '–'}
            </p>
            {thread.messages.map((item) => (
              <div key={item.id} className={`support-message ${item.authorType}`}>
                <strong>{item.authorType === 'operator' ? 'Operator' : 'Kunde'}</strong>
                <p>{item.message}</p>
              </div>
            ))}
            <label>
              <span>Anliegen</span>
              <Select value={caseType} onChange={(event) => setCaseType(event.target.value as SupportCaseType)}>
                <option value="support">Support</option>
                <option value="feedback">Feedback</option>
                <option value="feature_request">Funktionswunsch</option>
                <option value="billing">Abrechnung und Abo</option>
              </Select>
            </label>
            <label>
              <span>Pilot-Einordnung</span>
              <Select value={classification} onChange={(event) => setClassification(event.target.value as SupportCaseClassification | '')}>
                <option value="">Keine</option>
                <option value="blocker">Blocker</option>
                <option value="friction">Friction</option>
                <option value="request">Request</option>
              </Select>
            </label>
            <label>
              <span>Status</span>
              <Select value={status} onChange={(event) => setStatus(event.target.value as SupportCaseStatus)}>
                <option value="open">Offen</option>
                <option value="in_progress">In Bearbeitung</option>
                <option value="waiting_for_customer">Warten auf Kunde</option>
                <option value="resolved">Gelöst</option>
                <option value="closed">Geschlossen</option>
              </Select>
            </label>
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={4}
              placeholder="Optionale Antwort an den Kunden"
            />
            <button className="button primary" onClick={() => void reply()}>
              Änderung speichern
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
