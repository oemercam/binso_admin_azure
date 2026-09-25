'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Input, Select, Textarea } from '@/components/ui/form-controls'
import { StatusBadge } from '@/components/ui/status-badge'
import { useFeedback } from '@/components/ui/feedback'
import { apiRequest, jsonBody } from '@/lib/http/api-client'
import type { SupportCase, SupportCaseClassification, SupportCasePriority, SupportCaseStatus, SupportCaseType, SupportMessage } from '@/types/domain'

type PlatformCase = SupportCase & { organizationName: string }
type Thread = { case: PlatformCase; messages: SupportMessage[] }

export function PlatformSupportView() {
  const feedback = useFeedback()
  const [cases, setCases] = useState<PlatformCase[]>([])
  const [thread, setThread] = useState<Thread | null>(null)
  const [message, setMessage] = useState('')
  const [internalNote, setInternalNote] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<SupportCaseStatus>('in_progress')
  const [caseType, setCaseType] = useState<SupportCaseType>('support')
  const [classification, setClassification] = useState<SupportCaseClassification | ''>('')
  const [priority, setPriority] = useState<SupportCasePriority>('normal')
  const [assignedToUserId, setAssignedToUserId] = useState('')
  const [saving, setSaving] = useState(false)

  const loadCases = useCallback(async () => {
    try {
      const payload = await apiRequest<{ cases?: PlatformCase[] }>('/api/platform/support')
      setCases(payload.cases ?? [])
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : 'Supportfälle konnten nicht geladen werden.')
    }
  }, [feedback])

  const openCase = useCallback(async (id: string) => {
    try {
      const payload = await apiRequest<Thread>(`/api/platform/support?caseId=${encodeURIComponent(id)}`)
      setThread(payload)
      setStatus(payload.case.status)
      setCaseType(payload.case.caseType)
      setClassification(payload.case.classification ?? '')
      setPriority(payload.case.priority)
      setAssignedToUserId(payload.case.assignedToUserId ?? '')
      setMessage('')
      setInternalNote('')
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : 'Supportfall konnte nicht geladen werden.')
    }
  }, [feedback])

  useEffect(() => { queueMicrotask(() => { void loadCases() }) }, [loadCases])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return cases
    return cases.filter((item) => `${item.caseNumber} ${item.subject} ${item.organizationName} ${item.caseType} ${item.status} ${item.priority}`.toLowerCase().includes(q))
  }, [cases, query])

  async function save() {
    if (!thread || saving) return
    setSaving(true)
    try {
      await apiRequest('/api/platform/support', { method: 'PATCH', body: jsonBody({ caseId: thread.case.id, message, internalNote, status, caseType, classification: classification || null, priority, assignedToUserId: assignedToUserId || null }) })
      feedback.success('Supportfall wurde aktualisiert.')
      await openCase(thread.case.id)
      await loadCases()
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : 'Supportfall konnte nicht gespeichert werden.')
    } finally { setSaving(false) }
  }

  return <section className="page apple-page"><PageHeader title="Support und Feedback" description="Support, Feedback und Funktionswünsche mit Priorität, Zuweisung, internen Notizen und nachvollziehbarem Verlauf." /><div className="module-toolbar"><label className="search-field"><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Fall, Firma oder Status suchen" /></label><span className="toolbar-meta">{filtered.length} Fälle</span></div><div className="support-layout-v73"><div className="data-list compact-overview-list">{filtered.map((supportCase) => <button type="button" className="data-row compact-overview-row" key={supportCase.id} onClick={() => void openCase(supportCase.id)}><span className="primary-cell"><strong>{supportCase.caseNumber} · {supportCase.subject}</strong><small>{supportCase.organizationName} · {supportCase.caseType} · {supportCase.priority}{supportCase.isPilotRelated ? ' · Pilot' : ''}</small></span><StatusBadge status={supportCase.status} /><span className="row-disclosure">›</span></button>)}</div>{thread && <div className="support-thread-v73"><h2>{thread.case.caseNumber}</h2><p>{thread.case.organizationName} · {thread.case.caseType}{thread.case.isPilotRelated ? ' · Pilot' : ''} · {thread.case.currentPage ?? 'Kein Seitenkontext'} · Build {thread.case.buildVersion ?? '–'}</p>{thread.messages.map((item) => <div key={item.id} className={`support-message ${item.authorType}`}><strong>{item.visibility === 'internal' ? 'Interne Notiz' : item.authorType === 'operator' ? 'Operator' : 'Kunde'}</strong><p>{item.message}</p></div>)}<label><span>Anliegen</span><Select value={caseType} onChange={(event) => setCaseType(event.target.value as SupportCaseType)}><option value="support">Support</option><option value="feedback">Feedback</option><option value="feature_request">Funktionswunsch</option><option value="billing">Abrechnung und Abo</option></Select></label><label><span>Pilot-Einordnung</span><Select value={classification} onChange={(event) => setClassification(event.target.value as SupportCaseClassification | '')}><option value="">Keine</option><option value="blocker">Blocker</option><option value="friction">Reibungspunkt</option><option value="request">Wunsch</option></Select></label><label><span>Priorität</span><Select value={priority} onChange={(event) => setPriority(event.target.value as SupportCasePriority)}><option value="low">Niedrig</option><option value="normal">Normal</option><option value="high">Hoch</option><option value="urgent">Dringend</option></Select></label><label><span>Status</span><Select value={status} onChange={(event) => setStatus(event.target.value as SupportCaseStatus)}><option value="open">Offen</option><option value="in_progress">In Bearbeitung</option><option value="waiting_for_customer">Wartet auf Kunde</option><option value="resolved">Gelöst</option><option value="closed">Geschlossen</option></Select></label><label><span>Zuweisung</span><Input value={assignedToUserId} onChange={(event) => setAssignedToUserId(event.target.value)} placeholder="Operator User-ID optional" /></label><Textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={4} placeholder="Optionale Antwort an den Kunden" /><Textarea value={internalNote} onChange={(event) => setInternalNote(event.target.value)} rows={3} placeholder="Interne Notiz – für Kunden unsichtbar" /><button className="button primary" disabled={saving} onClick={() => void save()}>{saving ? 'Speichern…' : 'Änderung speichern'}</button></div>}</div></section>
}
