'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { SettingsSection, SettingsValueRow } from '@/components/settings/settings-row'
import { useFeedback } from '@/components/ui/feedback'
import { formatChf } from '@/lib/format/locale'
import { apiRequest } from '@/lib/http/api-client'

type Data = { summary?: { active_orgs: string; trial_orgs: string; pilot_orgs: string; mrr: string; events_30d: string; converted_30d: string; churn_30d: string }; milestones?: Array<{ milestone: string; organizations: number }> }

export default function Page() {
  const feedback = useFeedback()
  const [data, setData] = useState<Data>({})
  useEffect(() => {
    let active = true
    void apiRequest<Data>('/api/platform/analytics').then((result) => { if (active) setData(result) }).catch((error) => { if (active) feedback.error(error instanceof Error ? error.message : 'Analytics konnten nicht geladen werden.') })
    return () => { active = false }
  }, [feedback])
  const summary = data.summary
  return <section className="page apple-page"><PageHeader title="Analytics" description="Datensparsame Produkt- und Geschäftskennzahlen. Demo-Organisationen sind ausgeschlossen." /><div className="customer-kpi-row" aria-label="Plattformkennzahlen"><div><span>Aktiv</span><strong>{summary?.active_orgs ?? '–'}</strong></div><div><span>MRR</span><strong>{summary ? formatChf(Number(summary.mrr)) : '–'}</strong></div><div><span>Pilot</span><strong>{summary?.pilot_orgs ?? '–'}</strong></div></div><SettingsSection title="Letzte 30 Tage" description="Kompakte operative Kennzahlen ohne invasive Klicküberwachung."><SettingsValueRow title="Produkt-Ereignisse" value={summary?.events_30d ?? '–'} /><SettingsValueRow title="Pilot → konvertiert" value={summary?.converted_30d ?? '–'} /><SettingsValueRow title="Kündigungen" value={summary?.churn_30d ?? '–'} /></SettingsSection><SettingsSection title="Time-to-Value Meilensteine" description="Erste produktive Schritte pro Organisation.">{data.milestones?.map((milestone) => <SettingsValueRow key={milestone.milestone} title={milestone.milestone} value={String(milestone.organizations)} />)}</SettingsSection></section>
}
