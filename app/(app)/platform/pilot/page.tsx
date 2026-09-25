'use client'

import { useCallback, useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Input, Select, Textarea } from '@/components/ui/form-controls'
import { StatusBadge } from '@/components/ui/status-badge'
import { useFeedback } from '@/components/ui/feedback'
import type { PlatformPilotCustomer } from '@/lib/db/repositories/platform-pilot'
import { apiRequest, jsonBody } from '@/lib/http/api-client'

export default function Page() {
  const feedback = useFeedback()
  const [items, setItems] = useState<PlatformPilotCustomer[]>([])
  const [selected, setSelected] = useState<PlatformPilotCustomer | null>(null)
  const [status, setStatus] = useState('active_pilot')
  const [goal, setGoal] = useState('')
  const [outcome, setOutcome] = useState('')
  const [group, setGroup] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const result = await apiRequest<{ customers?: PlatformPilotCustomer[] }>('/api/platform/pilot')
      setItems(result.customers ?? [])
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : 'Pilotkunden konnten nicht geladen werden.')
    }
  }, [feedback])

  useEffect(() => { queueMicrotask(() => { void load() }) }, [load])

  function open(item: PlatformPilotCustomer) {
    setSelected(item); setStatus(item.pilotStatus ?? 'active_pilot'); setGoal(item.pilotGoal ?? ''); setOutcome(item.pilotOutcome ?? ''); setGroup(item.pilotGroup ?? ''); setEndsAt(item.endsAt?.slice(0, 10) ?? '')
  }

  async function save() {
    if (!selected || saving) return
    setSaving(true)
    try {
      await apiRequest('/api/platform/pilot', { method: 'PATCH', body: jsonBody({ organizationId: selected.organizationId, pilotStatus: status, pilotGoal: goal, pilotOutcome: outcome, pilotGroup: group, endsAt: endsAt || null }) })
      feedback.success('Pilot wurde aktualisiert.')
      await load(); setSelected(null)
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : 'Pilot konnte nicht gespeichert werden.')
    } finally { setSaving(false) }
  }

  return <section className="page apple-page"><PageHeader title="Pilot" description="Pilotkunden, Ziele, Fortschritt, Feedback und Abschlussentscheidung." /><div className="data-list compact-overview-list">{items.map((item) => <button type="button" className="data-row compact-overview-row" key={item.organizationId} onClick={() => open(item)}><span className="primary-cell"><strong>{item.companyName}</strong><small>{item.pilotGroup ?? 'Pilot'} · {item.milestones}/7 Meilensteine</small></span><StatusBadge status={item.pilotStatus ?? 'active_pilot'} /><span>{item.openCases} offen · {item.feedbackCases} Feedback · {item.blockers} Blocker</span><span className="row-disclosure">›</span></button>)}</div>{selected && <div className="settings-section"><h2>{selected.companyName}</h2><label><span>Status</span><Select value={status} onChange={(event) => setStatus(event.target.value)}><option value="active_pilot">Aktiver Pilot</option><option value="pilot_review">Review</option><option value="extended">Verlängert</option><option value="pilot_completed">Abgeschlossen</option><option value="converted">Konvertiert</option><option value="not_converted">Nicht konvertiert</option></Select></label><label><span>Gruppe</span><Input value={group} onChange={(event) => setGroup(event.target.value)} /></label><label><span>Pilot bis</span><Input type="date" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} /></label><label><span>Ziel</span><Textarea value={goal} onChange={(event) => setGoal(event.target.value)} rows={3} /></label><label><span>Ergebnis</span><Textarea value={outcome} onChange={(event) => setOutcome(event.target.value)} rows={3} /></label><div className="module-toolbar"><button className="button secondary" onClick={() => setSelected(null)}>Schliessen</button><button className="button primary" disabled={saving} onClick={() => void save()}>{saving ? 'Speichern…' : 'Speichern'}</button></div></div>}</section>
}
