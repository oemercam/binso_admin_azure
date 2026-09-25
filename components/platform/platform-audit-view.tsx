'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { useFeedback } from '@/components/ui/feedback'
import { formatDateTime } from '@/lib/format/locale'
import { apiRequest } from '@/lib/http/api-client'

type Event = { id: string; actor_email: string; action: string; tenant_id?: string; detail?: string; created_at: string }

export function PlatformAuditView() {
  const [events, setEvents] = useState<Event[]>([])
  const feedback = useFeedback()

  useEffect(() => {
    let cancelled = false
    void apiRequest<{ events?: Event[] }>('/api/platform/audit')
      .then((result) => { if (!cancelled) setEvents(result.events ?? []) })
      .catch((error) => { if (!cancelled) feedback.error(error instanceof Error ? error.message : 'Audit konnte nicht geladen werden.') })
    return () => { cancelled = true }
  }, [feedback])

  return <section className="page apple-page"><PageHeader title="Audit" description="Privilegierte Plattformaktionen, Gründe und Zeitpunkte."/><div className="data-list compact-overview-list"><div className="data-row data-head"><span>Aktion</span><span>Operator</span><span>Zeit</span><span>Detail</span></div>{events.map((event) => <div className="data-row" key={event.id}><span><strong>{event.action}</strong><small>{event.tenant_id ?? 'Plattform'}</small></span><span>{event.actor_email}</span><span>{formatDateTime(event.created_at)}</span><span>{event.detail ?? '–'}</span></div>)}</div></section>
}
