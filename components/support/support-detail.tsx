"use client";
import {useCallback,useEffect,useState} from "react";import Image from "next/image";import Link from "next/link";import {ArrowLeft,Download,Paperclip,Send} from "lucide-react";import {apiFetch,isProductionMode} from "@/lib/client/runtime";import {addSupportMessage,getSupportTicket,type SupportTicket} from "@/lib/pilot-store";import {notify} from "@/lib/notify";import SupportAccess from "@/components/support/support-access";
export default function SupportDetail({id}:{id:string}){
 const [item,setItem]=useState<SupportTicket|null>(null);const [text,setText]=useState("");
 const load=useCallback(async()=>{
  if(isProductionMode()){
   try{const r=await apiFetch<{item:SupportTicket}>(`/api/support/${id}`);setItem(r.item)}
   catch{setItem(null)}
  }else{
   setItem(getSupportTicket(id)||null);
  }
 },[id]);
 useEffect(()=>{
  const timer=window.setTimeout(()=>{void load()},0);
  return()=>window.clearTimeout(timer);
 },[load]);
 async function send(){if(!text.trim())return;try{if(isProductionMode())await apiFetch(`/api/support/${id}/messages`,{method:"POST",body:JSON.stringify({text})});else addSupportMessage(id,text);setText("");await load();notify("Nachricht gesendet.")}catch(e){notify(e instanceof Error?e.message:"Nachricht konnte nicht gesendet werden.","danger")}}
 if(!item)return <div className="page"><p>Ticket wird geladen oder wurde nicht gefunden.</p></div>;
 return <div className="page"><Link className="back-link" href="/support"><ArrowLeft size={17}/>Zurück</Link><section className="module-heading"><div><div className="eyebrow">{item.number}</div><h1>{item.subject}</h1><p>{item.category} · {item.priority}</p></div><span className="status-chip">{item.status}</span></section><section className="support-detail-grid"><article className="workspace-card"><h2>Beschreibung</h2><p className="support-description">{item.description}</p><div className="support-thread">{item.messages.map(m=><div key={m.id}><strong>{m.author}</strong><small>{new Date(m.createdAt).toLocaleString("de-CH")}</small><p>{m.text}</p></div>)}</div><div className="support-reply"><textarea rows={4} value={text} onChange={e=>setText(e.target.value)} placeholder="Antwort schreiben …"/><button className="primary-button" onClick={send}><Send size={16}/>Antwort senden</button></div></article><aside className="support-detail-side"><section className="workspace-card"><h2>Ticket</h2><dl className="support-meta"><div><dt>Status</dt><dd>{item.status}</dd></div><div><dt>Priorität</dt><dd>{item.priority}</dd></div><div><dt>Erstellt</dt><dd>{new Date(item.createdAt).toLocaleString("de-CH")}</dd></div><div><dt>Aktualisiert</dt><dd>{new Date(item.updatedAt).toLocaleString("de-CH")}</dd></div></dl></section>{item.diagnostics&&<section className="workspace-card support-diagnostic-summary"><h2>Diagnose</h2><dl className="support-meta"><div><dt>Route</dt><dd>{item.diagnostics.route}</dd></div><div><dt>Ansicht</dt><dd>{item.diagnostics.viewport.width} × {item.diagnostics.viewport.height}</dd></div><div><dt>PWA</dt><dd>{item.diagnostics.pwa?"Ja":"Nein"}</dd></div><div><dt>Online</dt><dd>{item.diagnostics.online?"Ja":"Nein"}</dd></div></dl></section>}<SupportAccess ticketId={id}/>{Boolean(item.attachments?.length)&&<section className="workspace-card support-ticket-files"><h2>Anhänge</h2><div className="support-file-list">{item.attachments?.map(a=><a key={a.id} href={a.href||a.dataUrl||"#"} target="_blank" rel="noreferrer"><Paperclip size={15}/><span><strong>{a.fileName}</strong><small>{Math.max(1,Math.round(a.sizeBytes/1024))} KB</small></span><Download size={14}/></a>)}</div></section>}{item.screenshot&&<section className="workspace-card support-ticket-screenshot"><h2>Screenshot</h2><Image src={item.screenshot} alt="Angehängter Screenshot" width={720} height={420} unoptimized/></section>}</aside></section></div>
}
