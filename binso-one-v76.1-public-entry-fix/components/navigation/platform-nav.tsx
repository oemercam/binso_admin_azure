'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { PlatformRole } from '@/types/domain'

const all: PlatformRole[]=['platform_owner','platform_admin','platform_support','platform_billing','platform_auditor']
const items: Array<{href:string;label:string;roles:PlatformRole[]}> = [
  {href:'/platform',label:'Übersicht',roles:all},
  {href:'/platform/customers',label:'Kunden',roles:all},
  {href:'/platform/subscriptions',label:'Abonnemente',roles:['platform_owner','platform_admin','platform_billing','platform_auditor']},
  {href:'/platform/registrations',label:'Registrierungen',roles:['platform_owner','platform_admin','platform_support']},
  {href:'/platform/leads',label:'Anfragen',roles:['platform_owner','platform_admin','platform_support']},
  {href:'/platform/pilot',label:'Pilot',roles:['platform_owner','platform_admin','platform_support','platform_auditor']},
  {href:'/platform/support',label:'Support & Feedback',roles:['platform_owner','platform_admin','platform_support']},
  {href:'/platform/help',label:'Help Center',roles:['platform_owner','platform_admin','platform_support','platform_auditor']},
  {href:'/platform/analytics',label:'Analytics',roles:all},
  {href:'/platform/operations',label:'Betrieb',roles:all},
  {href:'/platform/incidents',label:'Incidents',roles:['platform_owner','platform_admin','platform_support','platform_auditor']},
  {href:'/platform/releases',label:'Releases',roles:all},
  {href:'/platform/data-lifecycle',label:'Daten',roles:['platform_owner','platform_admin','platform_auditor']},
  {href:'/platform/audit',label:'Audit',roles:['platform_owner','platform_admin','platform_auditor']},
  {href:'/platform/operators',label:'Operatoren',roles:['platform_owner','platform_admin']},
  {href:'/platform/settings',label:'Einstellungen',roles:['platform_owner','platform_admin']},
]
export function PlatformNav({role}:{role:PlatformRole}){const path=usePathname();return <nav className="platform-subnav" aria-label="Plattform Navigation">{items.filter(i=>i.roles.includes(role)).map(i=><Link key={i.href} className={path===i.href||path.startsWith(`${i.href}/`)?'active':''} href={i.href}>{i.label}</Link>)}</nav>}
