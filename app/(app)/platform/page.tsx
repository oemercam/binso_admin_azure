'use client'

import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Input, Select } from '@/components/ui/form-controls'
import { StandardFormSheet } from '@/components/ui/sheet-system'
import { SettingsSection, SettingsValueRow } from '@/components/settings/settings-row'
import { usePlatformStore } from '@/components/state/platform-store'
import { formatChf, formatDateTime } from '@/lib/format/locale'
import type { PlatformTenant, SubscriptionPlan } from '@/types/domain'
import { planDefinitions } from '@/lib/data/plans'
import { useFeedback } from '@/components/ui/feedback'

export default function PlatformAdminPage() {
  const store = usePlatformStore()
  const feedback = useFeedback()
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<PlatformTenant | null>(null)
  const [plan, setPlan] = useState<SubscriptionPlan>('business')
  const [status, setStatus] = useState<PlatformTenant['status']>('active')

  const metrics = useMemo(() => {
    const active = store.tenants.filter((item) => item.status === 'active')
    return {
      tenants: store.tenants.length,
      active: active.length,
      trials: store.tenants.filter((item) => item.status === 'trial').length,
      mrr: active.reduce((sum, item) => sum + item.monthlyRevenueChf, 0),
    }
  }, [store.tenants])

  const filtered = store.tenants.filter((tenant) =>
    `${tenant.companyName} ${tenant.ownerEmail} ${tenant.plan} ${tenant.status}`.toLowerCase().includes(query.trim().toLowerCase())
  )

  function openTenant(tenant: PlatformTenant) {
    setEditing(tenant)
    setPlan(tenant.plan)
    setStatus(tenant.status)
  }

  function saveTenant(event: React.FormEvent) {
    event.preventDefault()
    if (!editing) return
    store.changePlan(editing.id, plan)
    store.updateTenant(editing.id, { status })
    setEditing(null)
    feedback.success('Mandant wurde aktualisiert.')
  }

  return (
    <section className="page apple-page mobile-standard-page">
      <PageHeader title="Plattform" description="SaaS-Kunden, Abonnemente, Nutzung und Betriebszustand verwalten." />

      <div className="customer-kpi-row" aria-label="Plattformkennzahlen">
        <div><span>Mandanten</span><strong>{metrics.tenants}</strong></div>
        <div><span>Aktiv</span><strong>{metrics.active}</strong></div>
        <div><span>MRR</span><strong>{formatChf(metrics.mrr, { maximumFractionDigits: 0 })}</strong></div>
      </div>

      <SettingsSection title="Betrieb" description="Demo-Monitoring der zentralen Plattformdienste.">
        <SettingsValueRow title="Web App" value="Betriebsbereit" description="Production" />
        <SettingsValueRow title="Datenbank" value="Vorbereitet" description="Produktive Verbindung noch nicht angeschlossen" />
        <SettingsValueRow title="E-Mail" value="Nicht verbunden" description="Provider-Konfiguration ausstehend" />
        <SettingsValueRow title="Billing" value="Nicht verbunden" description="Zahlungsanbieter ausstehend" />
        <SettingsValueRow title="Backups" value="Nicht verifiziert" description="Restore-Test vor Go-live erforderlich" />
      </SettingsSection>

      <section>
        <div className="section-title"><div><h2>Mandanten</h2><p>Alle SaaS-Kunden und Testkonten.</p></div></div>
        <div className="module-toolbar">
          <label className="search-field"><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Firma oder E-Mail suchen" /></label>
          <span className="toolbar-meta">{filtered.length} Mandanten</span>
        </div>
        <div className="data-list compact-overview-list">
          <div className="data-row data-head"><span>Firma</span><span>Abo</span><span>Status</span><span /></div>
          {filtered.map((tenant) => (
            <button type="button" className="data-row compact-overview-row" key={tenant.id} onClick={() => openTenant(tenant)}>
              <span className="primary-cell"><strong>{tenant.companyName}</strong><small className="mobile-row-summary">{tenant.ownerEmail}</small><small className="desktop-row-detail">{tenant.ownerEmail}</small></span>
              <span className="overview-desktop-cell">{tenant.plan}</span>
              <span className="overview-desktop-cell">{tenant.status}</span>
              <span className="row-disclosure">›</span>
            </button>
          ))}
        </div>
      </section>

      <SettingsSection title="Registrierungen" description="Neue Registrierungen und Trial-Starts.">
        {store.signups.map((signup) => <SettingsValueRow key={signup.id} title={signup.companyName} value={signup.status} description={`${signup.email} · ${signup.plan}`} />)}
      </SettingsSection>

      {editing && <StandardFormSheet open title={<>{editing.companyName}</>} description={<>{editing.ownerEmail}</>} onClose={() => setEditing(null)} onSubmit={saveTenant} formId="platform-tenant-edit" footer={<><button type="button" className="button secondary" onClick={() => setEditing(null)}>Abbrechen</button><button type="submit" form="platform-tenant-edit" className="button primary">Speichern</button></>}>
        <div className="form-grid">
          <label><span>Plan</span><Select value={plan} onChange={(event) => setPlan(event.target.value as SubscriptionPlan)}>{planDefinitions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></label>
          <label><span>Status</span><Select value={status} onChange={(event) => setStatus(event.target.value as PlatformTenant['status'])}><option value="trial">Trial</option><option value="active">Aktiv</option><option value="past_due">Zahlung offen</option><option value="suspended">Gesperrt</option><option value="cancelled">Gekündigt</option></Select></label>
          <div className="full customer-overview-list">
            <div><span>Benutzer</span><strong>{editing.users} / {editing.seats}</strong></div>
            <div><span>Speicher</span><strong>{editing.storageMb} MB</strong></div>
            <div><span>MRR</span><strong>{formatChf(editing.monthlyRevenueChf)}</strong></div>
            <div><span>Zuletzt aktiv</span><strong>{formatDateTime(editing.lastActiveAt)}</strong></div>
          </div>
        </div>
      </StandardFormSheet>}
    </section>
  )
}
