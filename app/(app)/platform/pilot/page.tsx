import { PageHeader } from '@/components/ui/page-header'
import { requirePlatformRole } from '@/lib/auth/server'
import { listPlatformPilotCustomers } from '@/lib/db/repositories/platform-pilot'

function date(value?: string) { return value ? new Intl.DateTimeFormat('de-CH').format(new Date(value)) : '–' }

export default async function PlatformPilotPage() {
  await requirePlatformRole('platform_owner','platform_admin','platform_support','platform_auditor')
  const customers = await listPlatformPilotCustomers()
  return (
    <section className="page apple-page">
      <PageHeader title="Pilot" description="Pilotkunden, Feedback und Blocker für den kontrollierten Produktstart." />
      <div className="data-list compact-overview-list">
        {customers.length ? customers.map(customer => (
          <div className="data-row compact-overview-row" key={customer.organizationId}>
            <span className="primary-cell"><strong>{customer.companyName}</strong><small>{customer.pilotGroup ?? 'Pilot'} · {customer.pilotStatus ?? 'aktiv'}</small></span>
            <span>Start {date(customer.startedAt)}</span>
            <span>{customer.openCases} offen · {customer.feedbackCases} Feedback · {customer.blockers} Blocker</span>
          </div>
        )) : <div className="list-empty">Noch keine Pilotkunden markiert.</div>}
      </div>
    </section>
  )
}
