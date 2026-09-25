'use client'
import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
type Release={id:string;build_id:string;environment:string;status:string;commit_sha?:string;detail?:string;created_at:string}
export default function Page(){const[items,setItems]=useState<Release[]>([]);useEffect(()=>{void fetch('/api/platform/releases',{cache:'no-store'}).then(r=>r.json()).then(j=>setItems(j.releases??[]))},[]);return <section className="page apple-page"><PageHeader title="Releases" description="Deployment- und Health-Historie für Staging und Production."/><div className="data-list compact-overview-list">{items.map(i=><div className="data-row" key={i.id}><span className="primary-cell"><strong>{i.build_id}</strong><small>{i.environment} · {i.commit_sha??'–'} · {new Date(i.created_at).toLocaleString('de-CH')}</small></span><span>{i.status}</span></div>)}</div></section>}
