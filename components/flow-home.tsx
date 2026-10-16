"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {LocalizedText,useLocale} from "@/lib/client/locale";
import {localeTags} from "@/lib/locales/config";
import {usePageAccess} from "@/lib/client/page-access";
import {useApiQuery} from "@/lib/client/use-api-query";
import {Icon} from "./ui";
import {createReturnHref} from "@/config/create-actions";
import {sumMoney} from "@/lib/money";
import type {CashStatisticsData} from "@/lib/cash-statistics";

/** The approved Flow home uses the signed-in profile, not preview identities. */
export function FlowWelcome(){
 const {locale}=useLocale();
 const {data}=useApiQuery<{item?:{first_name?:string;display_name?:string}}>("/api/settings/profile");
 const [today,setToday]=useState<Date|null>(null);
 useEffect(()=>{const refresh=()=>setToday(new Date());refresh();const id=window.setInterval(refresh,60000);return()=>window.clearInterval(id)},[]);
 const name=data?.item?.first_name?.trim()||data?.item?.display_name?.trim().split(/\s+/)[0];
 const hour=today?Number(new Intl.DateTimeFormat('en-GB',{hour:'numeric',hourCycle:'h23',timeZone:'Europe/Zurich'}).format(today)):null;
 const greeting=hour===null?'Willkommen':hour<11?'Guten Morgen':hour<18?'Guten Tag':'Guten Abend';
 return <section className="flow-welcome">
  <div className="flow-date">{today?new Intl.DateTimeFormat(localeTags[locale],{weekday:'long',day:'numeric',month:'long',timeZone:'Europe/Zurich'}).format(today):<LocalizedText>{"Ihr Arbeitsbereich"}</LocalizedText>}</div>
  <h1><LocalizedText>{greeting}</LocalizedText>{name&&<>,<br/><span>{name}.</span></>}</h1>
  <p><LocalizedText>{"Was möchten Sie heute bewegen?"}</LocalizedText></p>
 </section>;
}

/** Access is consumed inside AppShell; read-only users never receive create links. */
export function FlowQuickActions(){
 const {canOpen}=usePageAccess();
 const actions=[
  {href:'/rechnungen/neu',icon:'receipt',title:'Rechnung erstellen',description:'Leistung abrechnen',tone:'primary'},
  {href:'/zeit',icon:'clock',title:'Zeit erfassen',description:'Direkt einem Projekt zuordnen',tone:'sand'},
  {href:'/kunden',icon:'users',title:'Kunden öffnen',description:'Kontakte und Vorgänge im Blick',tone:'sage'},
 ].filter(action=>canOpen(action.href));
 if(!actions.length)return null;
 return <nav className="flow-quick-actions" aria-label="Schnellaktionen">{actions.map(action=><Link href={action.href.endsWith('/neu')?createReturnHref(action.href,'/dashboard'):action.href} key={action.href} className={`flow-quick-action flow-tone-${action.tone}`}>
  <Icon name={action.icon} size={23}/><strong><LocalizedText>{action.title}</LocalizedText>{action.tone==='primary'&&<span aria-hidden="true"> ↗</span>}</strong>
  <small><LocalizedText>{action.description}</LocalizedText></small>
 </Link>)}</nav>;
}

/** Use all signed revenue events from the authoritative snapshot month, never the recent-invoice subset. */
export function FlowMonthSummary({data}:{data:CashStatisticsData}){
 const {locale}=useLocale();
 const financial=data.financial;
 if(!financial)return null;
 const period=financial.snapshot.as_of.slice(0,7);
 const amount=sumMoney(financial.revenueEvents.filter(event=>event.date.slice(0,7)===period).map(event=>event.amount));
 const month=new Intl.DateTimeFormat(localeTags[locale],{month:'long',timeZone:'Europe/Zurich'}).format(new Date(financial.snapshot.as_of+'T12:00:00Z'));
 const formatted=new Intl.NumberFormat(localeTags[locale],{style:'currency',currency:'CHF'}).format(amount);
 return <section className="flow-month-summary"><div><small><LocalizedText>{"Fakturierter Umsatz"}</LocalizedText><span> · {month}</span></small><strong>{formatted}</strong></div><span className="flow-month-symbol"><Icon name="chart" size={22}/></span></section>;
}
