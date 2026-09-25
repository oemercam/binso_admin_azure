'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { PlatformRole } from '@/types/domain'
import { PLATFORM_ROLE_GROUPS } from '@/lib/auth/platform-permissions'
import { ROUTES } from '@/lib/navigation/routes'

const items: Array<{href:string;label:string;roles:PlatformRole[]}> = [
  {href:ROUTES.platform.home,label:'Übersicht',roles:[...PLATFORM_ROLE_GROUPS.all]},
  {href:ROUTES.platform.customers,label:'Kunden',roles:[...PLATFORM_ROLE_GROUPS.all]},
  {href:ROUTES.platform.subscriptions,label:'Abonnemente',roles:[...PLATFORM_ROLE_GROUPS.billing]},
  {href:ROUTES.platform.registrations,label:'Registrierungen',roles:[...PLATFORM_ROLE_GROUPS.support]},
  {href:ROUTES.platform.leads,label:'Anfragen',roles:[...PLATFORM_ROLE_GROUPS.support]},
  {href:ROUTES.platform.pilot,label:'Pilot',roles:[...PLATFORM_ROLE_GROUPS.help]},
  {href:ROUTES.platform.support,label:'Support & Feedback',roles:[...PLATFORM_ROLE_GROUPS.support]},
  {href:ROUTES.platform.help,label:'Help Center',roles:[...PLATFORM_ROLE_GROUPS.help]},
  {href:ROUTES.platform.analytics,label:'Analytics',roles:[...PLATFORM_ROLE_GROUPS.all]},
  {href:ROUTES.platform.operations,label:'Betrieb',roles:[...PLATFORM_ROLE_GROUPS.all]},
  {href:ROUTES.platform.incidents,label:'Incidents',roles:[...PLATFORM_ROLE_GROUPS.help]},
  {href:ROUTES.platform.releases,label:'Releases',roles:[...PLATFORM_ROLE_GROUPS.all]},
  {href:ROUTES.platform.dataLifecycle,label:'Daten',roles:[...PLATFORM_ROLE_GROUPS.audit]},
  {href:ROUTES.platform.audit,label:'Audit',roles:[...PLATFORM_ROLE_GROUPS.audit]},
  {href:ROUTES.platform.operators,label:'Operatoren',roles:[...PLATFORM_ROLE_GROUPS.manage]},
  {href:ROUTES.platform.settings,label:'Einstellungen',roles:[...PLATFORM_ROLE_GROUPS.manage]},
]
export function PlatformNav({role}:{role:PlatformRole}){const path=usePathname();return <nav className="platform-subnav" aria-label="Plattform Navigation">{items.filter(i=>i.roles.includes(role)).map(i=><Link key={i.href} className={path===i.href||path.startsWith(`${i.href}/`)?'active':''} href={i.href}>{i.label}</Link>)}</nav>}
