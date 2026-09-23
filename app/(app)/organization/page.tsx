'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Input, Select } from '@/components/ui/form-controls'
import { StandardFormSheet } from '@/components/ui/sheet-system'
import { SettingsSection, SettingsValueRow } from '@/components/settings/settings-row'
import { useBusinessStore } from '@/components/state/business-store'
import { useCurrentUser } from '@/components/state/current-user'
import { useFeedback } from '@/components/ui/feedback'
import type { AuditEvent, OrganizationMembership, Role, SubscriptionPlan } from '@/types/domain'
import { planDefinitions } from '@/lib/data/plans'

export default function OrganizationPage() {
  const store = useBusinessStore()
  const user = useCurrentUser()
  const feedback = useFeedback()
  const [members, setMembers] = useState<OrganizationMembership[]>(store.memberships)
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(store.auditEvents)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('employee')
  const [memberEditing, setMemberEditing] = useState<OrganizationMembership | null>(null)
  const [memberRole, setMemberRole] = useState<Role>('employee')
  const [memberStatus, setMemberStatus] = useState<'active' | 'suspended'>('active')
  const [memberSaving, setMemberSaving] = useState(false)
  const [subscriptionOpen, setSubscriptionOpen] = useState(false)
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan>('business')
  const [subscriptionSaving, setSubscriptionSaving] = useState(false)

  const subscription = store.subscriptions[0]
  const entitlement = store.entitlements[0]
  const visibleMembers = useMemo(() => members.filter((item) => item.status !== 'suspended'), [members])

  const loadMembers = useCallback(async () => {
    try {
      const response = await fetch(`/api/organization/members?organizationId=${encodeURIComponent(store.currentOrganization.id)}`, { cache: 'no-store' })
      if (response.status === 503) return
      const result = await response.json().catch(() => ({})) as { members?: OrganizationMembership[]; auditEvents?: AuditEvent[]; error?: { message?: string } }
      if (!response.ok) throw new Error(result.error?.message || 'Benutzer konnten nicht geladen werden.')
      if (result.members) setMembers(result.members)
      if (result.auditEvents) setAuditEvents(result.auditEvents)
    } catch (cause) {
      feedback.error(cause instanceof Error ? cause.message : 'Benutzer konnten nicht geladen werden.')
    }
  }, [feedback, store.currentOrganization.id])

  useEffect(() => {
    queueMicrotask(() => { void loadMembers() })
  }, [loadMembers])

  async function updateSubscription(action: 'change_plan' | 'cancel' | 'reactivate') {
    if (!subscription || subscriptionSaving || user.role !== 'owner') return
    setSubscriptionSaving(true)
    try {
      const response = await fetch('/api/billing/subscription', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action, plan: action === 'change_plan' ? subscriptionPlan : undefined }) })
      const result = await response.json().catch(() => ({})) as { error?: string; mode?: string }
      if (!response.ok) throw new Error(result.error || 'Abonnement konnte nicht aktualisiert werden.')
      feedback.success(action === 'cancel' ? 'Kündigung wurde vorgemerkt.' : action === 'reactivate' ? 'Kündigung wurde zurückgenommen.' : result.mode === 'immediate' ? 'Plan wurde aktualisiert.' : 'Planwechsel wurde vorgemerkt.')
      setSubscriptionOpen(false)
      window.location.reload()
    } catch (cause) { feedback.error(cause instanceof Error ? cause.message : 'Abonnement konnte nicht aktualisiert werden.') } finally { setSubscriptionSaving(false) }
  }

  async function startCheckout() {
    if (!subscription || subscriptionSaving || user.role !== 'owner') return
    setSubscriptionSaving(true)
    try {
      const response = await fetch('/api/billing/checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ plan: subscriptionPlan }) })
      const result = await response.json().catch(() => ({})) as { error?: string; url?: string }
      if (!response.ok || !result.url) throw new Error(result.error || 'Checkout konnte nicht gestartet werden.')
      window.location.assign(result.url)
    } catch (cause) { feedback.error(cause instanceof Error ? cause.message : 'Checkout konnte nicht gestartet werden.'); setSubscriptionSaving(false) }
  }

  async function openBillingPortal() {
    if (!subscription || subscriptionSaving || user.role !== 'owner') return
    setSubscriptionSaving(true)
    try {
      const response = await fetch('/api/billing/portal', { method: 'POST' })
      const result = await response.json().catch(() => ({})) as { error?: string; url?: string }
      if (!response.ok || !result.url) throw new Error(result.error || 'Abrechnungsportal konnte nicht geöffnet werden.')
      window.location.assign(result.url)
    } catch (cause) { feedback.error(cause instanceof Error ? cause.message : 'Abrechnungsportal konnte nicht geöffnet werden.'); setSubscriptionSaving(false) }
  }

  function openSubscription() { setSubscriptionPlan(subscription?.scheduledPlan ?? subscription?.plan ?? 'business'); setSubscriptionOpen(true) }

  async function invite(event: React.FormEvent) {
    event.preventDefault()
    const value = email.trim().toLowerCase()
    if (!value || !store.can('members.manage')) return
    setMemberSaving(true)
    try {
      const response = await fetch('/api/organization/members', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ organizationId: store.currentOrganization.id, email: value, role }) })
      if (response.status === 503) {
        const now = new Date().toISOString()
        store.addMembership({ id: `membership-${Date.now()}`, organizationId: store.currentOrganization.id, userId: `invited:${value}`, email: value, role, status: 'invited', createdAt: now, updatedAt: now })
      } else {
        const result = await response.json().catch(() => ({})) as { member?: OrganizationMembership; emailDelivery?: { delivered: boolean; provider: 'graph' | 'disabled' }; error?: { message?: string } }
        if (!response.ok) throw new Error(result.error?.message || 'Einladung konnte nicht erstellt werden.')
        if (result.emailDelivery?.delivered) feedback.success('Einladung wurde erstellt und per E-Mail versendet.')
        else feedback.success('Einladung wurde erstellt. Der Mailversand ist nicht aktiv oder war nicht verfügbar.')
      }
      setInviteOpen(false); setEmail(''); await loadMembers()
    } catch (cause) { feedback.error(cause instanceof Error ? cause.message : 'Einladung konnte nicht erstellt werden.') } finally { setMemberSaving(false) }
  }

  function openMember(member: OrganizationMembership) {
    if (!store.can('members.manage')) return
    setMemberEditing(member)
    setMemberRole(member.role)
    setMemberStatus(member.status === 'suspended' ? 'suspended' : 'active')
  }

  async function saveMember(event: React.FormEvent) {
    event.preventDefault()
    if (!memberEditing) return
    setMemberSaving(true)
    try {
      const response = await fetch('/api/organization/members', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ organizationId: store.currentOrganization.id, membershipId: memberEditing.id, role: memberRole, status: memberStatus }) })
      const result = await response.json().catch(() => ({})) as { member?: OrganizationMembership; error?: { message?: string } }
      if (!response.ok || !result.member) throw new Error(result.error?.message || 'Benutzer konnte nicht geändert werden.')
      setMemberEditing(null); feedback.success('Benutzer wurde aktualisiert.'); await loadMembers()
    } catch (cause) { feedback.error(cause instanceof Error ? cause.message : 'Benutzer konnte nicht geändert werden.') } finally { setMemberSaving(false) }
  }

  return (
    <section className="page apple-page settings-page">
      <PageHeader title="Organisation" description="Mandant, Benutzer, Abonnement und Produktzugriff verwalten." action={store.can('members.manage') ? <button className="button primary page-primary-action" onClick={() => setInviteOpen(true)}>Benutzer einladen</button> : undefined} />

      <SettingsSection title="Mandant" description="Aktive Organisation und Produktstatus.">
        <SettingsValueRow title="Organisation" value={store.currentOrganization.name} description={store.currentOrganization.slug} />
        <SettingsValueRow title="Land und Sprache" value={`${store.currentOrganization.country} · ${store.currentOrganization.locale}`} description={`Währung ${store.currentOrganization.currency}`} />
        <SettingsValueRow title="Abonnement" value={subscription ? `${subscription.plan} · ${subscription.status}` : 'Kein Abonnement'} description={subscription ? `${subscription.seats} Benutzer${subscription.cancelAtPeriodEnd ? ' · Kündigung vorgemerkt' : subscription.scheduledPlan ? ` · Wechsel zu ${subscription.scheduledPlan} vorgemerkt` : ''}` : undefined} />
        {subscription && user.role === 'owner' ? <div className="customer-quick-actions"><button type="button" className="button secondary" onClick={openSubscription}>Abonnement verwalten</button></div> : null}
        <SettingsValueRow title="Funktionen" value={`${entitlement?.features.length ?? 0} aktiviert`} description={entitlement ? `Max. ${entitlement.maxUsers} Benutzer` : 'Keine Limits definiert'} />
      </SettingsSection>

      <SettingsSection title="Benutzer" description="Rolle gilt innerhalb dieser Organisation. Einladungen werden beim ersten Login über die verifizierte E-Mail übernommen.">
        {visibleMembers.map((member) => <SettingsValueRow key={member.id} title={member.email} value={member.role} description={member.status} onClick={store.can('members.manage') ? () => openMember(member) : undefined} />)}
        {!visibleMembers.length && <div className="list-empty">Noch keine Benutzer vorhanden.</div>}
      </SettingsSection>

      <SettingsSection title="Audit" description="Letzte sicherheits- und geschäftsrelevante Aktionen.">
        {auditEvents.slice(0, 10).map((event) => <SettingsValueRow key={event.id} title={event.action} value={event.actorName} description={event.detail ?? event.entityType} />)}
        {!auditEvents.length && <div className="list-empty">Noch keine Audit-Ereignisse.</div>}
      </SettingsSection>

      {subscriptionOpen && subscription && <StandardFormSheet open title={<>Abonnement verwalten</>} description={<>{store.currentOrganization.name}</>} onClose={() => setSubscriptionOpen(false)} onSubmit={(event) => event.preventDefault()} formId="subscription-manage" footer={<><button type="button" className="button secondary" onClick={() => setSubscriptionOpen(false)}>Schliessen</button>{subscription.billingProvider === 'stripe' && subscription.billingCustomerId && subscription.billingSubscriptionId ? <button type="button" className="button primary" disabled={subscriptionSaving} onClick={() => void openBillingPortal()}>{subscriptionSaving ? 'Öffnen…' : 'Abrechnung verwalten'}</button> : <button type="button" className="button primary" disabled={subscriptionSaving || subscriptionPlan === 'enterprise'} onClick={() => void startCheckout()}>{subscriptionSaving ? 'Weiter…' : 'Zahlung einrichten'}</button>}</>}>
        <div className="form-grid"><label className="full"><span>Plan</span><Select value={subscriptionPlan} onChange={(event) => setSubscriptionPlan(event.target.value as SubscriptionPlan)}>{planDefinitions.map((item) => <option key={item.id} value={item.id}>{item.name}{item.monthlyPriceChf ? ` · CHF ${item.monthlyPriceChf}/Monat` : ''}</option>)}</Select></label><div className="full customer-overview-list"><div><span>Status</span><strong>{subscription.status}</strong></div><div><span>Benutzer</span><strong>{subscription.seats}</strong></div><div><span>Billing</span><strong>{subscription.billingProvider ?? 'manual'}</strong></div>{subscription.trialUntil ? <div><span>Trial bis</span><strong>{new Date(subscription.trialUntil).toLocaleDateString('de-CH')}</strong></div> : null}</div><div className="full customer-quick-actions">{subscription.billingProvider === 'stripe' && subscription.billingCustomerId && subscription.billingSubscriptionId ? <button type="button" className="button secondary" disabled={subscriptionSaving} onClick={() => void openBillingPortal()}>Zahlungsmethode und Rechnungen</button> : subscription.cancelAtPeriodEnd ? <button type="button" className="button secondary" disabled={subscriptionSaving} onClick={() => void updateSubscription('reactivate')}>Kündigung zurücknehmen</button> : <button type="button" className="button secondary" disabled={subscriptionSaving} onClick={() => void updateSubscription('cancel')}>Zum Periodenende kündigen</button>}</div></div>
      </StandardFormSheet>}

      {inviteOpen && <StandardFormSheet open title={<>Benutzer einladen</>} description={<>Zugriff auf {store.currentOrganization.name}</>} onClose={() => setInviteOpen(false)} onSubmit={invite} formId="invite-member" footer={<><button type="button" className="button secondary" onClick={() => setInviteOpen(false)}>Abbrechen</button><button type="submit" form="invite-member" className="button primary" disabled={memberSaving}>{memberSaving ? 'Einladen…' : 'Einladen'}</button></>}><div className="form-grid"><label className="full"><span>E-Mail *</span><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label className="full"><span>Rolle</span><Select value={role} onChange={(event) => setRole(event.target.value as Role)}><option value="employee">Mitarbeiter</option><option value="finance">Buchhaltung</option><option value="admin">Administrator</option>{user.role === 'owner' && <option value="owner">Inhaber</option>}</Select></label></div></StandardFormSheet>}

      {memberEditing && <StandardFormSheet open title={<>{memberEditing.email}</>} description={<>Rolle und Zugriff verwalten</>} onClose={() => setMemberEditing(null)} onSubmit={saveMember} formId="member-edit" footer={<><button type="button" className="button secondary" onClick={() => setMemberEditing(null)}>Abbrechen</button><button type="submit" form="member-edit" className="button primary" disabled={memberSaving}>{memberSaving ? 'Speichern…' : 'Speichern'}</button></>}><div className="form-grid"><label className="full"><span>Rolle</span><Select value={memberRole} onChange={(event) => setMemberRole(event.target.value as Role)}><option value="employee">Mitarbeiter</option><option value="finance">Buchhaltung</option><option value="admin">Administrator</option>{user.role === 'owner' && <option value="owner">Inhaber</option>}</Select></label><label className="full"><span>Status</span><Select value={memberStatus} onChange={(event) => setMemberStatus(event.target.value as 'active' | 'suspended')}><option value="active">Aktiv</option><option value="suspended">Gesperrt</option></Select></label></div></StandardFormSheet>}
    </section>
  )
}
