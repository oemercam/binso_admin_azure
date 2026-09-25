import { PageHeader } from '@/components/ui/page-header'
import { requirePlatformRole } from '@/lib/auth/server'
import { listPlatformLeads } from '@/lib/db/repositories/platform-leads'

export default async function PlatformLeadsPage() {
  await requirePlatformRole('platform_owner','platform_admin','platform_support')
  const leads = await listPlatformLeads()
  return (
    <section className="page apple-page">
      <PageHeader title="Anfragen" description="Kontakt-, Pilot- und Vertriebsanfragen von der öffentlichen Website." />
      <div className="data-list compact-overview-list">
        {leads.length ? leads.map(lead => (
          <div className="data-row compact-overview-row" key={lead.id}>
            <span className="primary-cell"><strong>{lead.company ? `${lead.company} · ` : ''}{lead.name}</strong><small>{lead.email} · {lead.topic} · {lead.status}</small></span>
            <span>{new Intl.DateTimeFormat('de-CH').format(new Date(lead.createdAt))}</span>
          </div>
        )) : <div className="list-empty">Noch keine öffentlichen Anfragen.</div>}
      </div>
    </section>
  )
}
