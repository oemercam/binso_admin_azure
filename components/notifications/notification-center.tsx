"use client";
import {useCallback,useEffect,useState} from "react";
import Link from "next/link";
import {Bell,CheckCircle2} from "lucide-react";
import {apiFetch,isProductionMode} from "@/lib/client/runtime";
import ToggleSwitch from "@/components/ui/toggle-switch";
import {Button} from "@/components/ui/button";
import {PageHeader} from "@/components/ui/page-header";
import {StatePanel} from "@/components/ui/state-panel";

type Item={id:string;kind:string;title:string;message:string;href?:string;readAt?:string|null;createdAt:string};
type Preference={kind:string;inApp:boolean;email:boolean;push:boolean};
const kinds=["security","billing","support","workflow","system","general"] as const;
const kindLabels:Record<string,string>={security:"Sicherheit",billing:"Abrechnung",support:"Support",workflow:"Prozesse",system:"System",general:"Allgemein"};

export default function NotificationCenter(){
 const [items,setItems]=useState<Item[]>([]);const [unread,setUnread]=useState(0);const [preferences,setPreferences]=useState<Preference[]>([]);const [loading,setLoading]=useState(true);
 const load=useCallback(async()=>{if(!isProductionMode()){setItems([]);setLoading(false);return}try{const [n,p]=await Promise.all([apiFetch<{items:Item[];unread:number}>("/api/notifications"),apiFetch<{items:Preference[]}>("/api/notification-preferences")]);setItems(n.items);setUnread(n.unread);setPreferences(p.items)}catch{setItems([]);setUnread(0)}finally{setLoading(false)}},[]);
 useEffect(()=>{const t=window.setTimeout(()=>void load(),0);return()=>window.clearTimeout(t)},[load]);
 async function read(id:string){await apiFetch("/api/notifications",{method:"PATCH",body:JSON.stringify({id})});await load()}
 async function readAll(){await apiFetch("/api/notifications",{method:"PATCH",body:JSON.stringify({all:true})});await load()}
 function pref(kind:string):Preference{return preferences.find(x=>x.kind===kind)||{kind,inApp:true,email:true,push:false}}
 async function setPref(kind:string,key:"inApp"|"email"|"push",value:boolean){const next={...pref(kind),[key]:value};setPreferences(xs=>[...xs.filter(x=>x.kind!==kind),next]);try{await apiFetch("/api/notification-preferences",{method:"PATCH",body:JSON.stringify(next)})}catch{await load()}}
 return <div className="page notification-page"><PageHeader eyebrow="Konto" title="Benachrichtigungen" description="Wichtige Hinweise zu Aufgaben, Support, Sicherheit und Abrechnung." actions={unread>0?<Button variant="secondary" onClick={readAll}>Alle als gelesen markieren</Button>:undefined}/>
  <section className="notification-layout"><div className="workspace-card notification-list">{loading?<StatePanel kind="loading" title="Benachrichtigungen werden geladen"/>:items.length?items.map(x=><article className={x.readAt?"read":"unread"} key={x.id}><div className="notification-icon"><Bell size={18}/></div><div><strong>{x.title}</strong><p>{x.message}</p><small>{new Date(x.createdAt).toLocaleString("de-CH")}</small></div><div className="notification-actions">{x.href&&<Link href={x.href}>Öffnen</Link>}{!x.readAt&&<button onClick={()=>read(x.id)}><CheckCircle2 size={16}/>Gelesen</button>}</div></article>):<StatePanel kind="empty" title="Keine Benachrichtigungen" text="Hier erscheinen relevante Hinweise für dein Konto."/>}</div>
  <aside className="ui-card notification-preferences"><h2>Benachrichtigungskanäle</h2><p>Lege pro Kategorie fest, wie du Hinweise erhalten möchtest.</p>{kinds.map(kind=>{const p=pref(kind);return <div className="notification-pref-row" key={kind}><strong>{kindLabels[kind]}</strong><label>In-App <ToggleSwitch checked={p.inApp} onChange={v=>void setPref(kind,"inApp",v)} showStatus={false}/></label><label>E-Mail <ToggleSwitch checked={p.email} onChange={v=>void setPref(kind,"email",v)} showStatus={false}/></label><label>Push <ToggleSwitch checked={p.push} onChange={v=>void setPref(kind,"push",v)} showStatus={false}/></label></div>})}</aside></section>
 </div>;
}
