'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Input, Select } from '@/components/ui/form-controls'
import { StandardFormSheet } from '@/components/ui/sheet-system'
import { SettingsSection, SettingsValueRow } from '@/components/settings/settings-row'
import { formatChf, formatDateTime } from '@/lib/format/locale'
import type { PlatformTenant, SignupRequest, SubscriptionPlan } from '@/types/domain'
import { planDefinitions } from '@/lib/data/plans'
import { useFeedback } from '@/components/ui/feedback'


type PlatformHealth = {
  database: 'ok' | 'error' | 'not_configured'
  databaseLatencyMs?: number
  webhookFailures24h: number
  applicationErrors24h: number
  pendingSignups: number
  activeTenants: number
  measuredAt: string
}

type PlatformResponse = {
  tenants: PlatformTenant[]
  signups: SignupRequest[]
  canManage: boolean
  error?: string
}

export default function PlatformAdminPage() {
  const feedback = useFeedback()
  const [tenants, setTenants] = useState<PlatformTenant[]>([])
  const [signups, setSignups] = useState<SignupRequest[]>([])
  const [canManage, setCanManage] = useState(false)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<PlatformTenant | null>(null)
  const [plan, setPlan] = useState<SubscriptionPlan>('business')
  const [status, setStatus] = useState<PlatformTenant['status']>('active')
  const [saving, setSaving] = useState(false)
  const [health, setHealth] = useState<PlatformHealth | null>(null)

  const loadPlatform = useCallback(async () => {
    try {
      const [response, healthResponse] = await Promise.all([fetch('/api/platform/tenants', { cache: 'no-store' }), fetch('/api/platform/health', { cache: 'no-store' })])
      const result = await response.json() as PlatformResponse
      if (!response.ok) throw new Error(result.error || 'Plattformdaten konnten nicht geladen werden.')
      setTenants(result.tenants)
      setSignups(result.signups)
      setCanManage(result.canManage)
      const healthResult = await healthResponse.json().catch(() => null) as PlatformHealth | null
      if (healthResult) setHealth(healthResult)
    } catch (cause) {
      feedback.error(cause instanceof Error ? cause.message : 'Plattformdaten konnten nicht geladen werden.')
    } finally {
      setLoading(false)
    }
  }, [feedback])

  useEffect(() => {
    queueMicrotask(() => { void loadPlatform() })
  }, [loadPlatform])

  const metrics = useMemo(() => {
    const active = tenants.filter((item) => item.status === 'active')
    return {
      tenants: tenants.length,
      active: active.length,
      trials: tenants.filter((item) => item.status === 'trial').length,
      mrr: active.reduce((sum, item) => sum + item.monthlyRevenueChf, 0),
    }
  }, [tenants])

  const filtered = tenants.filter((tenant) =>
    `${tenant.companyName} ${tenant.ownerEmail} ${tenant.plan} ${tenant.status}`.toLowerCase().includes(query.trim().toLowerCase())
  )

  function openTenant(tenant: PlatformTenant) {
    setEditing(tenant)
    setPlan(tenant.plan)
    setStatus(tenant.status)
  }

  async function saveTenant(event: React.FormEvent) {
    event.preventDefault()
    if (!editing || saving || !canManage) return
    setSaving(true)
    try {
      const response = await fetch('/api/platform/tenants', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tenantId: editing.id, plan, status }),
      })
      const result = await response.json().catch(() => ({})) as { error?: string }
      if (!response.ok) throw new Error(result.error || 'Mandant konnte nicht aktualisiert werden.')
      await loadPlatform()
      setEditing(null)
      feedback.success('Abonnement wurde aktualisiert.')
    } catch (cause) {
      feedback.error(cause instanceof Error ? cause.message : 'Mandant konnte nicht aktualisiert werden.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="page apple-page mobile-standard-page">
      <PageHeader title="Plattform" description="SaaS-Kunden, Abonnemente, Nutzung und Betriebszustand verwalten." />

      <div className="customer-kpi-row" aria-label="Plattformkennzahlen">
        <div><span>Mandanten</span><strong>{metrics.tenants}</strong></div>
        <div><span>Aktiv</span><strong>{metrics.active}</strong></div>
        <div><span>MRR</span><strong>{formatChf(metrics.mrr, { maximumFractionDigits: 0 })}</strong></div>
      </div>

      <SettingsSection title="Betrieb" description="Live-Zustand der zentralen Plattformdienste aus Binso One.">
        <SettingsValueRow title="Web App" value="Betriebsbereit" description="Production" />
        <SettingsValueRow title="Datenbank" value={health?.database === 'ok' ? 'Verbunden' : health?.database === 'error' ? 'Fehler' : 'Nicht konfiguriert'} description={health?.databaseLatencyMs !== undefined ? `${health.databaseLatencyMs} ms Prüfzeit` : 'Azure Database for PostgreSQL'} />
        <SettingsValueRow title="Webhook-Fehler" value={`${health?.webhookFailures24h ?? 0}`} description="Letzte 24 Stunden" />
        <SettingsValueRow title="Anwendungsfehler" value={`${health?.applicationErrors24h ?? 0}`} description="Letzte 24 Stunden" />
        <SettingsValueRow title="Offene Registrierungen" value={`${health?.pendingSignups ?? 0}`} description="Noch nicht abgeschlossene Kontoeröffnungen" />
        <SettingsValueRow title="Billing" value="Stripe" description="Checkout, Portal und signaturgeprüfte Webhooks" />
      </SettingsSection>

      <section>
        <div className="section-title"><div><h2>Mandanten</h2><p>Produktive SaaS-Kunden und Testkonten aus PostgreSQL.</p></div></div>
        <div className="module-toolbar">
          <label className="search-field"><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Firma oder E-Mail suchen" /></label>
          <span className="toolbar-meta">{loading ? 'Wird geladen…' : `${filtered.length} Mandanten`}</span>
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

      <SettingsSection title="Registrierungen" description="Neue Registrierungen und Trial-Starts aus PostgreSQL.">
        {signups.map((signup) => <SettingsValueRow key={signup.id} title={signup.companyName} value={signup.status} description={`${signup.email} · ${signup.plan}`} />)}
      </SettingsSection>

      {editing && <StandardFormSheet open title={<>{editing.companyName}</>} description={<>{editing.ownerEmail}</>} onClose={() => setEditing(null)} onSubmit={saveTenant} formId="platform-tenant-edit" footer={<><button type="button" className="button secondary" onClick={() => setEditing(null)}>Abbrechen</button>{canManage ? <button type="submit" form="platform-tenant-edit" className="button primary" disabled={saving}>{saving ? 'Speichern…' : 'Speichern'}</button> : null}</>}>
        <div className="form-grid">
          <label><span>Plan</span><Select value={plan} onChange={(event) => setPlan(event.target.value as SubscriptionPlan)} disabled={!canManage}>{planDefinitions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></label>
          <label><span>Status</span><Select value={status} onChange={(event) => setStatus(event.target.value as PlatformTenant['status'])} disabled={!canManage}><option value="trial">Trial</option><option value="active">Aktiv</option><option value="past_due">Zahlung offen</option><option value="suspended">Gesperrt</option><option value="expired">Trial abgelaufen</option><option value="cancelled">Gekündigt</option></Select></label>
          <div className="full customer-overview-list">
            <div><span>Benutzer</span><strong>{editing.users} / {editing.seats}</strong></div>
            <div><span>Speicher</span><strong>{editing.storageMb} MB</strong></div>
            <div><span>MRR</span><strong>{formatChf(editing.monthlyRevenueChf)}</strong></div>
            <div><span>Billing</span><strong>{editing.billingProvider ?? 'manual'}</strong></div>
            <div><span>Trial bis</span><strong>{editing.trialUntil ? formatDateTime(editing.trialUntil) : '–'}</strong></div>
            <div><span>Zuletzt aktiv</span><strong>{formatDateTime(editing.lastActiveAt)}</strong></div>
          </div>
        </div>
      </StandardFormSheet>}
    </section>
  )
}
