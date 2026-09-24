'use client'
import { useEffect,useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { formatDateTime } from '@/lib/format/locale'
type E={id:string;actor_email:string;action:string;tenant_id?:string;detail?:string;created_at:string}
export function PlatformAuditView(){const[events,setEvents]=useState<E[]>([]);useEffect(()=>{void(async()=>{const r=await fetch('/api/platform/audit',{cache:'no-store'});const j=await r.json() as {events?:E[]};if(r.ok)setEvents(j.events??[])})()},[]);return <section className="page apple-page"><PageHeader title="Audit" description="Privilegierte Plattformaktionen, Gründe und Zeitpunkte."/><div className="data-list compact-overview-list"><div className="data-row data-head"><span>Aktion</span><span>Operator</span><span>Zeit</span><span>Detail</span></div>{events.map(e=><div className="data-row" key={e.id}><span><strong>{e.action}</strong><small>{e.tenant_id??'Plattform'}</small></span><span>{e.actor_email}</span><span>{formatDateTime(e.created_at)}</span><span>{e.detail??'–'}</span></div>)}</div></section>}
