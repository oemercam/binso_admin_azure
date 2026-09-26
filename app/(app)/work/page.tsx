'use client'

import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import { Icon, type IconName } from '@/components/ui/icon'
import { useBusinessStore } from '@/components/state/business-store'
import { useCurrentUser } from '@/components/state/current-user'
import type { OrganizationFeature, Role } from '@/types/domain'

type WorkArea = {
  href: string
  title: string
  description: string
  icon: IconName
  roles: Role[]
  feature: OrganizationFeature
  count: (store: ReturnType<typeof useBusinessStore>) => number
}

const workAreas: WorkArea[] = [
  { href: '/quotes', title: 'Angebote', description: 'Angebote erstellen und bis zur Entscheidung begleiten.', icon: 'quotes', roles: ['owner', 'admin', 'finance'], feature: 'quotes', count: (store) => store.quotes.length },
  { href: '/orders', title: 'Aufträge', description: 'Laufende Arbeit, Budgets und Leistungen verwalten.', icon: 'orders', roles: ['owner', 'admin', 'finance', 'employee'], feature: 'orders', count: (store) => store.orders.length },
  { href: '/contracts', title: 'Verträge', description: 'Wiederkehrende Leistungen und Laufzeiten verwalten.', icon: 'contracts', roles: ['owner', 'admin', 'finance'], feature: 'contracts', count: (store) => store.contracts.length },
]

export default function WorkPage() {
  const store = useBusinessStore()
  const user = useCurrentUser()
  const enabled = new Set(store.entitlements.find((item) => item.organizationId === store.currentOrganizationId)?.features ?? [])
  const areas = workAreas.filter((area) => area.roles.includes(user.role) && enabled.has(area.feature))

  return (
    <section className="page apple-page simplicity-hub-page">
      <PageHeader title="Arbeit" description="Angebote, Aufträge und Verträge an einem Ort." />

      <div className="simplicity-hub-grid">
        {areas.map((area) => (
          <Link className="simplicity-hub-card" href={area.href} key={area.href}>
            <span className="simplicity-hub-icon"><Icon name={area.icon} size={20} /></span>
            <span className="simplicity-hub-copy">
              <strong>{area.title}</strong>
              <small>{area.description}</small>
            </span>
            <span className="simplicity-hub-count">{area.count(store)}</span>
            <Icon name="chevron" size={15} />
          </Link>
        ))}
      </div>

      {!areas.length ? <div className="list-empty">Für deine Rolle sind aktuell keine Arbeitsmodule freigeschaltet.</div> : null}
    </section>
  )
}
