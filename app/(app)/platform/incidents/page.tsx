'use client'

import { useCallback, useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Input, Select, Textarea } from '@/components/ui/form-controls'
import { StatusBadge } from '@/components/ui/status-badge'
import { useFeedback } from '@/components/ui/feedback'
import { formatDateTime } from '@/lib/format/locale'
import { apiRequest, jsonBody } from '@/lib/http/api-client'

type Incident = { id: string; title: string; severity: 'minor' | 'major' | 'critical'; status: 'investigating' | 'identified' | 'monitoring' | 'resolved'; public_message?: string; internal_detail?: string; started_at: string }

const severityLabel = { minor: 'Klein', major: 'Erheblich', critical: 'Kritisch' } as const

export default function Page() {
  const feedback = useFeedback()
  const [items, setItems] = useState<Incident[]>([])
  const [title, setTitle] = useState('')
  const [severity, setSeverity] = useState<Incident['severity']>('minor')
  const [status, setStatus] = useState<Incident['status']>('investigating')
  const [publicMessage, setPublicMessage] = useState('')
  const [internalDetail, setInternalDetail] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const result = await apiRequest<{ incidents?: Incident[] }>('/api/platform/incidents')
      setItems(result.incidents ?? [])
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : 'Incidents konnten nicht geladen werden.')
    }
  }, [feedback])

  useEffect(() => { queueMicrotask(() => { void load() }) }, [load])

  async function save() {
    if (!title.trim() || saving) return
    setSaving(true)
    try {
      await apiRequest('/api/platform/incidents', { method: 'PUT', body: jsonBody({ title, severity, status, publicMessage, internalDetail }) })
      setTitle(''); setPublicMessage(''); setInternalDetail('')
      feedback.success('Incident wurde gespeichert.')
      await load()
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : 'Incident konnte nicht gespeichert werden.')
    } finally { setSaving(false) }
  }

  return <section className="page apple-page">
    <PageHeader title="Incidents" description="Betriebsstörungen mit internem Kontext und optionaler öffentlicher Statusmeldung." />
    <div className="settings-section"><h2>Incident erfassen</h2><Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Kurzer Titel" /><Select value={severity} onChange={(event) => setSeverity(event.target.value as Incident['severity'])}><option value="minor">Klein</option><option value="major">Erheblich</option><option value="critical">Kritisch</option></Select><Select value={status} onChange={(event) => setStatus(event.target.value as Incident['status'])}><option value="investigating">Untersuchung</option><option value="identified">Ursache erkannt</option><option value="monitoring">Beobachtung</option><option value="resolved">Gelöst</option></Select><Textarea value={publicMessage} onChange={(event) => setPublicMessage(event.target.value)} placeholder="Öffentliche Meldung optional" /><Textarea value={internalDetail} onChange={(event) => setInternalDetail(event.target.value)} placeholder="Interne Details" /><button className="button primary" disabled={saving} onClick={() => void save()}>{saving ? 'Speichern…' : 'Speichern'}</button></div>
    <div className="data-list compact-overview-list">{items.map((item) => <div className="data-row" key={item.id}><span className="primary-cell"><strong>{item.title}</strong><small>{formatDateTime(item.started_at)} · {severityLabel[item.severity]}</small></span><StatusBadge status={item.status} /></div>)}</div>
  </section>
}
