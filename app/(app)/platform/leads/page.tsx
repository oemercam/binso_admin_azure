'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Input, Select, Textarea } from '@/components/ui/form-controls'
import { StatusBadge } from '@/components/ui/status-badge'
import { useFeedback } from '@/components/ui/feedback'
import type { PlatformLead } from '@/lib/db/repositories/platform-leads'
import { apiRequest, jsonBody } from '@/lib/http/api-client'

export default function Page() {
  const feedback = useFeedback()
  const [leads, setLeads] = useState<PlatformLead[]>([])
  const [selected, setSelected] = useState<PlatformLead | null>(null)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<PlatformLead['status']>('new')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const result = await apiRequest<{ leads?: PlatformLead[] }>('/api/platform/leads')
      setLeads(result.leads ?? [])
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : 'Anfragen konnten nicht geladen werden.')
    }
  }, [feedback])

  useEffect(() => { queueMicrotask(() => { void load() }) }, [load])

  const filtered = useMemo(() => leads.filter((lead) => `${lead.name} ${lead.company ?? ''} ${lead.email} ${lead.topic} ${lead.status}`.toLowerCase().includes(q.trim().toLowerCase())), [leads, q])

  function open(lead: PlatformLead) {
    setSelected(lead)
    setStatus(lead.status)
    setNotes(lead.internalNotes ?? '')
  }

  async function save() {
    if (!selected || saving) return
    setSaving(true)
    try {
      await apiRequest('/api/platform/leads', { method: 'PATCH', body: jsonBody({ id: selected.id, status, internalNotes: notes }) })
      feedback.success('Anfrage wurde aktualisiert.')
      await load()
      setSelected(null)
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : 'Anfrage konnte nicht gespeichert werden.')
    } finally {
      setSaving(false)
    }
  }

  return <section className="page apple-page">
    <PageHeader title="Anfragen" description="Kontakt-, Pilot- und Vertriebsanfragen mit einfachem Qualifizierungsprozess." />
    <div className="module-toolbar"><label className="search-field"><Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Firma, Name oder E-Mail suchen" /></label><span className="toolbar-meta">{filtered.length} Anfragen</span></div>
    <div className="data-list compact-overview-list">{filtered.map((lead) => <button type="button" className="data-row compact-overview-row" key={lead.id} onClick={() => open(lead)}><span className="primary-cell"><strong>{lead.company ? `${lead.company} · ` : ''}{lead.name}</strong><small>{lead.email} · {lead.topic}</small></span><StatusBadge status={lead.status} /><span className="row-disclosure">›</span></button>)}</div>
    {selected && <div className="settings-section"><h2>{selected.company ?? selected.name}</h2><p>{selected.message}</p><label><span>Status</span><Select value={status} onChange={(event) => setStatus(event.target.value as PlatformLead['status'])}><option value="new">Neu</option><option value="contacted">Kontaktiert</option><option value="qualified">Qualifiziert</option><option value="pilot">Pilot</option><option value="converted">Konvertiert</option><option value="closed">Geschlossen</option></Select></label><label><span>Interne Notiz</span><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} /></label><div className="module-toolbar"><button className="button secondary" onClick={() => setSelected(null)}>Schliessen</button><button className="button primary" disabled={saving} onClick={() => void save()}>{saving ? 'Speichern…' : 'Speichern'}</button></div></div>}
  </section>
}
