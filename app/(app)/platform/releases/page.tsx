'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { useFeedback } from '@/components/ui/feedback'
import { formatDateTime } from '@/lib/format/locale'
import { apiRequest } from '@/lib/http/api-client'

type Release = { id: string; build_id: string; environment: string; status: string; commit_sha?: string; detail?: string; created_at: string }

export default function Page() {
  const [items, setItems] = useState<Release[]>([])
  const feedback = useFeedback()

  useEffect(() => {
    let cancelled = false
    void apiRequest<{ releases?: Release[] }>('/api/platform/releases')
      .then((result) => { if (!cancelled) setItems(result.releases ?? []) })
      .catch((error) => { if (!cancelled) feedback.error(error instanceof Error ? error.message : 'Releases konnten nicht geladen werden.') })
    return () => { cancelled = true }
  }, [feedback])

  return <section className="page apple-page"><PageHeader title="Releases" description="Deployment- und Health-Historie für Staging und Production."/><div className="data-list compact-overview-list">{items.map((item) => <div className="data-row" key={item.id}><span className="primary-cell"><strong>{item.build_id}</strong><small>{item.environment} · {item.commit_sha ?? '–'} · {formatDateTime(item.created_at)}</small></span><StatusBadge status={item.status}/></div>)}</div></section>
}
