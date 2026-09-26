'use client'

import { usePathname } from 'next/navigation'
import { useBusinessStore } from '@/components/state/business-store'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import type { OrganizationFeature } from '@/types/domain'

export const routeFeatures: Array<{ prefix: string; anyOf: OrganizationFeature[] }> = [
  { prefix: '/work', anyOf: ['quotes', 'orders', 'contracts'] },
  { prefix: '/contacts', anyOf: ['crm'] },
  { prefix: '/customers', anyOf: ['crm'] },
  { prefix: '/quotes', anyOf: ['quotes'] },
  { prefix: '/orders', anyOf: ['orders'] },
  { prefix: '/contracts', anyOf: ['contracts'] },
  { prefix: '/time', anyOf: ['time'] },
  { prefix: '/invoices', anyOf: ['invoices'] },
  { prefix: '/finance', anyOf: ['finance'] },
  { prefix: '/accounting', anyOf: ['accounting'] },
  { prefix: '/employees', anyOf: ['employees'] },
  { prefix: '/data', anyOf: ['imports', 'exports'] },
]

export function EntitlementGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const store = useBusinessStore()
  const rule = routeFeatures.find((item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`))
  if (!rule) return children

  const features = new Set(store.entitlements.find((item) => item.organizationId === store.currentOrganizationId)?.features ?? [])
  const allowed = rule.anyOf.some((feature) => features.has(feature))
  if (allowed) return children

  return (
    <section className="page apple-page">
      <PageHeader title="In deinem Abo nicht enthalten" description="Dieser Bereich gehört zu einem höheren Binso-One-Abo." />
      <div className="list-empty">
        <p>Deine sichtbare Navigation zeigt nur Funktionen, die in deinem aktuellen Abo enthalten sind.</p>
        <Link className="button secondary" href="/organization">Abo ansehen</Link>
      </div>
    </section>
  )
}
