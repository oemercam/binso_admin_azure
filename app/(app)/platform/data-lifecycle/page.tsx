'use client'

import { useCallback, useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Select } from '@/components/ui/form-controls'
import { useFeedback } from '@/components/ui/feedback'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatDateTime } from '@/lib/format/locale'
import { apiRequest, jsonBody } from '@/lib/http/api-client'

type RequestRow = { id: string; organization_name: string; request_type: string; status: string; reason?: string; retention_until?: string; created_at: string }

const requestTypeLabels: Record<string, string> = { export: 'Datenexport', cancel: 'Kündigung', delete: 'Datenlöschung' }

export default function Page() {
  const [items, setItems] = useState<RequestRow[]>([])
  const feedback = useFeedback()

  const load = useCallback(async () => {
    try {
      const result = await apiRequest<{ requests?: RequestRow[] }>('/api/platform/data-lifecycle')
      setItems(result.requests ?? [])
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : 'Daten-Lifecycle konnte nicht geladen werden.')
    }
  }, [feedback])

  useEffect(() => { queueMicrotask(() => { void load() }) }, [load])

  async function update(id: string, status: string) {
    try {
      await apiRequest('/api/platform/data-lifecycle', { method: 'PATCH', body: jsonBody({ id, status }) })
      await load()
      feedback.success('Status wurde aktualisiert.')
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : 'Status konnte nicht aktualisiert werden.')
    }
  }

  return <section className="page apple-page"><PageHeader title="Daten-Lifecycle" description="Export-, Kündigungs- und Löschanfragen als nachvollziehbarer Workflow."/><div className="data-list compact-overview-list">{items.map((item) => <div className="data-row" key={item.id}><span className="primary-cell"><strong>{item.organization_name} · {requestTypeLabels[item.request_type] ?? item.request_type}</strong><small>{item.reason ?? 'Kein Grund'} · {formatDateTime(item.created_at)}</small></span><StatusBadge status={item.status}/><Select value={item.status} aria-label={`Status für ${item.organization_name}`} onChange={(event) => void update(item.id, event.target.value)}><option value="requested">Angefragt</option><option value="approved">Freigegeben</option><option value="processing">In Verarbeitung</option><option value="completed">Abgeschlossen</option><option value="rejected">Abgelehnt</option><option value="cancelled">Abgebrochen</option></Select></div>)}</div></section>
}
