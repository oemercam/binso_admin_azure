'use client'

import { usePathname } from 'next/navigation'
import { useBusinessStore } from '@/components/state/business-store'
import { PageHeader } from '@/components/ui/page-header'
import type { OrganizationFeature } from '@/types/domain'

const routeFeatures: Array<{ prefix: string; anyOf: OrganizationFeature[] }> = [
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
      <PageHeader title="Modul nicht verfügbar" description="Dieses Modul ist in deinem aktuellen Binso-One-Plan nicht aktiviert." />
      <div className="list-empty">Den Produktzugriff kannst du als Inhaber unter Organisation und Abonnement prüfen.</div>
    </section>
  )
}
