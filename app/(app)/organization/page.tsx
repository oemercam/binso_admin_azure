'use client'

import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Input, Select } from '@/components/ui/form-controls'
import { StandardFormSheet } from '@/components/ui/sheet-system'
import { SettingsSection, SettingsValueRow } from '@/components/settings/settings-row'
import { useBusinessStore } from '@/components/state/business-store'
import { useCurrentUser } from '@/components/state/current-user'
import { useFeedback } from '@/components/ui/feedback'
import type { Role } from '@/types/domain'

export default function OrganizationPage() {
  const store = useBusinessStore()
  const user = useCurrentUser()
  const feedback = useFeedback()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('employee')

  const subscription = store.subscriptions[0]
  const entitlement = store.entitlements[0]
  const members = useMemo(() => store.memberships.filter((item) => item.status !== 'suspended'), [store.memberships])

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
        <SettingsValueRow title="Abonnement" value={subscription ? `${subscription.plan} · ${subscription.status}` : 'Kein Abonnement'} description={subscription ? `${subscription.seats} Benutzer` : undefined} />
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
