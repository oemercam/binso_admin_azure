'use client'

import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Input, Select } from '@/components/ui/form-controls'
import { StandardFormSheet } from '@/components/ui/sheet-system'
import { SettingsSection, SettingsValueRow } from '@/components/settings/settings-row'
import { useBusinessStore } from '@/components/state/business-store'
import { useCurrentUser } from '@/components/state/current-user'
import { useFeedback } from '@/components/ui/feedback'
import type { Role, SubscriptionPlan } from '@/types/domain'
import { planDefinitions } from '@/lib/data/plans'

export default function OrganizationPage() {
  const store = useBusinessStore()
  const user = useCurrentUser()
  const feedback = useFeedback()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('employee')
  const [subscriptionOpen, setSubscriptionOpen] = useState(false)
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan>('business')
  const [subscriptionSaving, setSubscriptionSaving] = useState(false)

  const subscription = store.subscriptions[0]
  const entitlement = store.entitlements[0]
  const members = useMemo(() => store.memberships.filter((item) => item.status !== 'suspended'), [store.memberships])

  async function updateSubscription(action: 'change_plan' | 'cancel' | 'reactivate') {
    if (!subscription || subscriptionSaving || user.role !== 'owner') return
    setSubscriptionSaving(true)
    try {
      const response = await fetch('/api/billing/subscription', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action, plan: action === 'change_plan' ? subscriptionPlan : undefined }),
      })
      const result = await response.json().catch(() => ({})) as { error?: string; mode?: string }
      if (!response.ok) throw new Error(result.error || 'Abonnement konnte nicht aktualisiert werden.')
      feedback.success(action === 'cancel' ? 'Kündigung wurde vorgemerkt.' : action === 'reactivate' ? 'Kündigung wurde zurückgenommen.' : result.mode === 'immediate' ? 'Plan wurde aktualisiert.' : 'Planwechsel wurde vorgemerkt.')
      setSubscriptionOpen(false)
      window.location.reload()
    } catch (cause) {
      feedback.error(cause instanceof Error ? cause.message : 'Abonnement konnte nicht aktualisiert werden.')
    } finally {
      setSubscriptionSaving(false)
    }
  }

  async function startCheckout() {
    if (!subscription || subscriptionSaving || user.role !== 'owner') return
    setSubscriptionSaving(true)
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ plan: subscriptionPlan }),
      })
      const result = await response.json().catch(() => ({})) as { error?: string; url?: string }
      if (!response.ok || !result.url) throw new Error(result.error || 'Checkout konnte nicht gestartet werden.')
      window.location.assign(result.url)
    } catch (cause) {
      feedback.error(cause instanceof Error ? cause.message : 'Checkout konnte nicht gestartet werden.')
      setSubscriptionSaving(false)
    }
  }

  async function openBillingPortal() {
    if (!subscription || subscriptionSaving || user.role !== 'owner') return
    setSubscriptionSaving(true)
    try {
      const response = await fetch('/api/billing/portal', { method: 'POST' })
      const result = await response.json().catch(() => ({})) as { error?: string; url?: string }
      if (!response.ok || !result.url) throw new Error(result.error || 'Abrechnungsportal konnte nicht geöffnet werden.')
      window.location.assign(result.url)
    } catch (cause) {
      feedback.error(cause instanceof Error ? cause.message : 'Abrechnungsportal konnte nicht geöffnet werden.')
      setSubscriptionSaving(false)
    }
  }

  function openSubscription() {
    setSubscriptionPlan(subscription?.scheduledPlan ?? subscription?.plan ?? 'business')
    setSubscriptionOpen(true)
  }

  function invite(event: React.FormEvent) {
    event.preventDefault()
    const value = email.trim().toLowerCase()
    if (!value || !store.can('members.manage')) return
    const now = new Date().toISOString()
    store.addMembership({
      id: `membership-${Date.now()}`,
      organizationId: store.currentOrganization.id,
      userId: `invited:${value}`,
      email: value,
      role,
      status: 'invited',
      createdAt: now,
      updatedAt: now,
    })
    store.appendAuditEvent({
      actorUserId: user.id,
      actorName: user.name,
      action: 'member.invited',
      entityType: 'organization_membership',
      detail: `${value} · ${role}`,
    })
    setInviteOpen(false)
    setEmail('')
    feedback.success('Einladung wurde vorbereitet.')
  }

  return (
    <section className="page apple-page settings-page">
      <PageHeader
        title="Organisation"
        description="Mandant, Benutzer, Abonnement und Produktzugriff verwalten."
        action={store.can('members.manage') ? <button className="button primary page-primary-action" onClick={() => setInviteOpen(true)}>Benutzer einladen</button> : undefined}
      />

      <SettingsSection title="Mandant" description="Aktive Organisation und Produktstatus.">
        <SettingsValueRow title="Organisation" value={store.currentOrganization.name} description={store.currentOrganization.slug} />
        <SettingsValueRow title="Land und Sprache" value={`${store.currentOrganization.country} · ${store.currentOrganization.locale}`} description={`Währung ${store.currentOrganization.currency}`} />
        <SettingsValueRow title="Abonnement" value={subscription ? `${subscription.plan} · ${subscription.status}` : 'Kein Abonnement'} description={subscription ? `${subscription.seats} Benutzer${subscription.cancelAtPeriodEnd ? ' · Kündigung vorgemerkt' : subscription.scheduledPlan ? ` · Wechsel zu ${subscription.scheduledPlan} vorgemerkt` : ''}` : undefined} />
        {subscription && user.role === 'owner' ? <div className="customer-quick-actions"><button type="button" className="button secondary" onClick={openSubscription}>Abonnement verwalten</button></div> : null}
        <SettingsValueRow title="Funktionen" value={`${entitlement?.features.length ?? 0} aktiviert`} description={entitlement ? `Max. ${entitlement.maxUsers} Benutzer` : 'Keine Limits definiert'} />
      </SettingsSection>

      <SettingsSection title="Benutzer" description="Rolle gilt innerhalb dieser Organisation.">
        {members.map((member) => (
          <SettingsValueRow key={member.id} title={member.email} value={member.role} description={member.status} />
        ))}
      </SettingsSection>

      <SettingsSection title="Audit" description="Letzte sicherheits- und geschäftsrelevante Aktionen.">
        {store.auditEvents.slice(0, 10).map((event) => (
          <SettingsValueRow key={event.id} title={event.action} value={event.actorName} description={event.detail ?? event.entityType} />
        ))}
        {!store.auditEvents.length && <div className="list-empty">Noch keine Audit-Ereignisse.</div>}
      </SettingsSection>


      {subscriptionOpen && subscription && (
        <StandardFormSheet
          open
          title={<>Abonnement verwalten</>}
          description={<>{store.currentOrganization.name}</>}
          onClose={() => setSubscriptionOpen(false)}
          onSubmit={(event) => event.preventDefault()}
          formId="subscription-manage"
          footer={<><button type="button" className="button secondary" onClick={() => setSubscriptionOpen(false)}>Schliessen</button>{subscription.billingProvider === 'stripe' && subscription.billingCustomerId && subscription.billingSubscriptionId ? <button type="button" className="button primary" disabled={subscriptionSaving} onClick={() => void openBillingPortal()}>{subscriptionSaving ? 'Öffnen…' : 'Abrechnung verwalten'}</button> : <button type="button" className="button primary" disabled={subscriptionSaving || subscriptionPlan === 'enterprise'} onClick={() => void startCheckout()}>{subscriptionSaving ? 'Weiter…' : 'Zahlung einrichten'}</button>}</>}
        >
          <div className="form-grid">
            <label className="full"><span>Plan</span><Select value={subscriptionPlan} onChange={(event) => setSubscriptionPlan(event.target.value as SubscriptionPlan)}>{planDefinitions.map((item) => <option key={item.id} value={item.id}>{item.name}{item.monthlyPriceChf ? ` · CHF ${item.monthlyPriceChf}/Monat` : ''}</option>)}</Select></label>
            <div className="full customer-overview-list">
              <div><span>Status</span><strong>{subscription.status}</strong></div>
              <div><span>Benutzer</span><strong>{subscription.seats}</strong></div>
              <div><span>Billing</span><strong>{subscription.billingProvider ?? 'manual'}</strong></div>
              {subscription.trialUntil ? <div><span>Trial bis</span><strong>{new Date(subscription.trialUntil).toLocaleDateString('de-CH')}</strong></div> : null}
            </div>
            <div className="full customer-quick-actions">
              {subscription.billingProvider === 'stripe' && subscription.billingCustomerId && subscription.billingSubscriptionId ? (
                <button type="button" className="button secondary" disabled={subscriptionSaving} onClick={() => void openBillingPortal()}>Zahlungsmethode und Rechnungen</button>
              ) : subscription.cancelAtPeriodEnd ? (
                <button type="button" className="button secondary" disabled={subscriptionSaving} onClick={() => void updateSubscription('reactivate')}>Kündigung zurücknehmen</button>
              ) : (
                <button type="button" className="button secondary" disabled={subscriptionSaving} onClick={() => void updateSubscription('cancel')}>Zum Periodenende kündigen</button>
              )}
            </div>
          </div>
        </StandardFormSheet>
      )}

      {inviteOpen && (
        <StandardFormSheet
          open
          title={<>Benutzer einladen</>}
          description={<>{store.currentOrganization.name}</>}
          onClose={() => setInviteOpen(false)}
          onSubmit={invite}
          formId="organization-invite"
          footer={<><button type="button" className="button secondary" onClick={() => setInviteOpen(false)}>Abbrechen</button><button type="submit" form="organization-invite" className="button primary">Einladung vorbereiten</button></>}
        >
          <div className="form-grid">
            <label className="full"><span>E-Mail *</span><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
            <label className="full"><span>Rolle</span><Select value={role} onChange={(event) => setRole(event.target.value as Role)}><option value="employee">Mitarbeiter</option><option value="finance">Buchhaltung</option><option value="admin">Administrator</option><option value="owner">Inhaber</option></Select></label>
          </div>
        </StandardFormSheet>
      )}
    </section>
  )
}
