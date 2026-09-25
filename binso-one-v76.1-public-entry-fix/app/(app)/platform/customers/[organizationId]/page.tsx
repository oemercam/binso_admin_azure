import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import { SettingsSection, SettingsValueRow } from '@/components/settings/settings-row'
import { requirePlatformRole } from '@/lib/auth/server'
import { getPlatformCustomerDetail } from '@/lib/db/repositories/platform-customer-detail'
import { PlatformCustomerNoteForm } from '@/components/platform/platform-customer-note-form'

function value(v:unknown){return v==null||v===''?'–':String(v)}
export default async function Page({params}:{params:Promise<{organizationId:string}>}){
  await requirePlatformRole('platform_owner','platform_admin','platform_support','platform_billing','platform_auditor')
  const {organizationId}=await params
  const d=await getPlatformCustomerDetail(organizationId)
  if(!d)notFound()
  const o=d.organization
  return <section className="page apple-page">
    <PageHeader title={o.name} description="Kundenübersicht mit Benutzern, Abo, Support, Audit, Nutzung und internen Notizen."/>
    <div className="customer-kpi-row"><div><span>Status</span><strong>{value(o.platform_status)}</strong></div><div><span>Plan</span><strong>{value(o.plan)}</strong></div><div><span>Seats</span><strong>{value(o.seats)}</strong></div></div>
    <SettingsSection title="Übersicht" description="Kerninformationen des SaaS-Mandanten."><SettingsValueRow title="Owner" value={value(o.owner_name)} description={value(o.owner_email)}/><SettingsValueRow title="Billing" value={value(o.billing_provider)} description={`${value(o.subscription_status)} · CHF ${value(o.unit_amount_chf)}`}/><SettingsValueRow title="Letzte Aktivität" value={o.last_active_at?new Date(o.last_active_at).toLocaleString('de-CH'):'–'}/><SettingsValueRow title="Pilot" value={o.is_pilot_customer?'Ja':'Nein'} description={value(o.pilot_status)}/></SettingsSection>
    <SettingsSection title="Benutzer" description="Mitgliedschaften dieser Organisation.">{d.members.map(m=><SettingsValueRow key={m.id} title={m.email} value={`${m.role} · ${m.status}`}/>)}</SettingsSection>
    <SettingsSection title="Abo-Historie" description="Letzte Subscription-Ereignisse.">{d.subscriptionEvents.map(e=><SettingsValueRow key={e.id} title={e.event_type} value={new Date(e.created_at).toLocaleString('de-CH')} description={e.detail??undefined}/>)}</SettingsSection>
    <SettingsSection title="Support" description="Letzte Fälle.">{d.support.map(c=><SettingsValueRow key={c.id} title={`${c.case_number} · ${c.subject}`} value={`${c.priority} · ${c.status}`}/>)}</SettingsSection>
    <SettingsSection title="Interne Notizen" description="Nur für Binso-Operatoren sichtbar.">{d.notes.map(n=><SettingsValueRow key={n.id} title={n.author_email} value={new Date(n.created_at).toLocaleString('de-CH')} description={n.note}/>)}</SettingsSection>
    <PlatformCustomerNoteForm organizationId={organizationId}/>
    <SettingsSection title="Audit" description="Letzte Betreiberänderungen.">{d.audit.map(a=><SettingsValueRow key={a.id} title={a.action} value={new Date(a.created_at).toLocaleString('de-CH')} description={`${a.actor_email}${a.detail?` · ${a.detail}`:''}`}/>)}</SettingsSection>
  </section>
}
