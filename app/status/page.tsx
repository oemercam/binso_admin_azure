import Link from 'next/link'
import { PublicPageIntro, PublicShell } from '@/components/public/public-shell'
import { platformQuery } from '@/lib/db/client'
import { formatDateTime } from '@/lib/format/locale'

export const dynamic='force-dynamic'

type PublicIncident={id:string;title:string;severity:string;status:string;public_message:string|null;started_at:Date;resolved_at:Date|null}
export default async function StatusPage() {
  let incidents: PublicIncident[]=[]
  try{const r=await platformQuery<PublicIncident>(`select id,title,severity,status,public_message,started_at,resolved_at from platform_incidents where public_message is not null order by started_at desc limit 20`);incidents=r.rows}catch{}
  const active=incidents.filter(i=>i.status!=='resolved')
  return (
    <PublicShell>
      <main className="public-main public-main-narrow">
        <PublicPageIntro eyebrow="Systemstatus" title="Betrieb von Binso One." description={active.length?'Aktuell bestehen gemeldete Betriebsereignisse.':'Aktuell sind keine öffentlichen Betriebsstörungen gemeldet.'} />
        <section className="public-status-card"><i /><div><strong>{active.length?'Betriebsereignis aktiv':'Alle Systeme ohne gemeldete Störung'}</strong><p>Der technische Health-Endpunkt bleibt zusätzlich verfügbar.</p></div><Link href="/api/health">Health Check öffnen →</Link></section>
        {incidents.map(i=><section className="public-status-card" key={i.id}><div><strong>{i.title}</strong><p>{i.public_message}</p><small>{i.severity} · {i.status} · {formatDateTime(i.started_at)}</small></div></section>)}
      </main>
    </PublicShell>
  )
}
