import Link from 'next/link'
import { PublicPageIntro, PublicShell } from '@/components/public/public-shell'
import { platformQuery } from '@/lib/db/client'
import { formatDateTime } from '@/lib/format/locale'

export const dynamic='force-dynamic'
type PublicIncident={id:string;title:string;severity:string;status:string;public_message:string|null;started_at:Date;resolved_at:Date|null}

export default async function StatusPage() {
  let incidents: PublicIncident[]=[]
  try { const r=await platformQuery<PublicIncident>(`select id,title,severity,status,public_message,started_at,resolved_at from platform_incidents where public_message is not null order by started_at desc limit 20`); incidents=r.rows } catch {}
  const active=incidents.filter(i=>i.status!=='resolved')
  return (
    <PublicShell>
      <main className="v80-main v812-page">
        <PublicPageIntro eyebrow="Systemstatus" title="Binso One Status." description={active.length?'Aktuell bestehen gemeldete Betriebsereignisse.':'Aktuell sind keine öffentlichen Betriebsstörungen gemeldet.'} />
        <section className={`v812-status-overview ${active.length ? 'has-incident' : ''}`}><div><span className="v812-status-dot"/><div><strong>{active.length?'Betriebsereignis aktiv':'Alle Systeme ohne gemeldete Störung'}</strong><p>Produktive Dienste und Health-Endpunkt werden überwacht.</p></div></div><Link className="v81-text-link" href="/api/health">Health Check öffnen →</Link></section>
        <section className="v812-status-list">{incidents.length ? incidents.map(i=><article key={i.id}><div><span className="v80-eyebrow">{i.severity} · {i.status}</span><h2>{i.title}</h2><p>{i.public_message}</p><small>{formatDateTime(i.started_at)}</small></div></article>) : <article><span className="v80-eyebrow">Verlauf</span><h2>Keine öffentlichen Ereignisse.</h2><p>Aktuell gibt es keine veröffentlichten Incident-Meldungen.</p></article>}</section>
      </main>
    </PublicShell>
  )
}
