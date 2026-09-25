'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Input } from '@/components/ui/form-controls'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { useFeedback } from '@/components/ui/feedback'
import type { PlatformTenant, SignupRequest } from '@/types/domain'
import { formatChf, formatDateTime } from '@/lib/format/locale'
import { apiRequest } from '@/lib/http/api-client'
import { statusLabel } from '@/lib/status/presentation'

export function PlatformTenantsView({ mode }: { mode: 'customers' | 'subscriptions' | 'registrations' }) {
  const [tenants, setTenants] = useState<PlatformTenant[]>([])
  const [signups, setSignups] = useState<SignupRequest[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const feedback = useFeedback()

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const result = await apiRequest<{ tenants?: PlatformTenant[]; signups?: SignupRequest[] }>('/api/platform/tenants')
        if (cancelled) return
        setTenants(result.tenants ?? [])
        setSignups(result.signups ?? [])
      } catch (error) {
        if (!cancelled) feedback.error(error instanceof Error ? error.message : 'Plattformdaten konnten nicht geladen werden.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [feedback])

  const filtered = useMemo(() => tenants.filter((tenant) => `${tenant.companyName} ${tenant.ownerEmail} ${tenant.plan} ${tenant.status}`.toLowerCase().includes(q.trim().toLowerCase())), [tenants, q])

  if (mode === 'registrations') return <section className="page apple-page"><PageHeader title="Registrierungen" description="Registrierungen, Trial-Starts und Onboarding-Fortschritt."/><div className="data-list compact-overview-list">{signups.map((signup) => <div className="data-row" key={signup.id}><span className="primary-cell"><strong>{signup.companyName}</strong><small>{signup.email}</small></span><span>{signup.plan}</span><span>{statusLabel(signup.status)}</span></div>)}</div></section>

  return <section className="page apple-page"><PageHeader title={mode === 'customers' ? 'Kunden' : 'Abonnemente'} description={mode === 'customers' ? 'SaaS-Kunden, Aktivität, Nutzung und Status.' : 'Pläne, Status, Benutzer und Abrechnungslebenszyklus.'}/><div className="module-toolbar"><label className="search-field"><Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Firma oder E-Mail suchen"/></label><span className="toolbar-meta">{loading ? 'Wird geladen…' : `${filtered.length} Einträge`}</span></div><div className="data-list compact-overview-list"><div className="data-row data-head"><span>Firma</span><span>{mode === 'customers' ? 'Aktivität' : 'Plan'}</span><span>Status</span><span>{mode === 'customers' ? 'Nutzung' : 'MRR'}</span></div>{filtered.map((tenant) => mode === 'customers' ? <Link href={`/platform/customers/${tenant.organizationId}`} className="data-row" key={tenant.id}><span className="primary-cell"><strong>{tenant.companyName}</strong><small>{tenant.ownerEmail}</small></span><span>{formatDateTime(tenant.lastActiveAt)}</span><StatusBadge status={tenant.status}/><span>{`${tenant.users}/${tenant.seats} Benutzer · ${tenant.storageMb} MB`}</span></Link> : <div className="data-row" key={tenant.id}><span className="primary-cell"><strong>{tenant.companyName}</strong><small>{tenant.ownerEmail}</small></span><span>{tenant.plan}</span><StatusBadge status={tenant.status}/><span>{formatChf(tenant.monthlyRevenueChf)}</span></div>)}</div></section>
}
