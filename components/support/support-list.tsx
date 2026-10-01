"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {Plus} from "lucide-react";
import {apiFetch,isProductionMode} from "@/lib/client/runtime";
import {listSupportTickets,type SupportTicket} from "@/lib/pilot-store";
import {useLocale} from "@/components/locale-provider";
import {supportCategoryLabel,supportPriorityLabel,supportStatusLabel} from "@/lib/support/labels";
import {ButtonLink} from "@/components/ui/button-link";
import ExpandableSearch from "@/components/ui/expandable-search";
export default function SupportList(){
 const {t}=useLocale();const [items,setItems]=useState<SupportTicket[]>([]);const [q,setQ]=useState("");
 useEffect(()=>{const load=async()=>{if(isProductionMode()){try{const r=await apiFetch<{items:SupportTicket[]}>("/api/support");setItems(r.items)}catch{setItems([])}}else setItems(listSupportTickets())};void load()},[]);
 const shown=items.filter(x=>`${x.number} ${x.subject} ${x.category} ${x.status}`.toLowerCase().includes(q.toLowerCase()));
 return <div className="page support-list-page"><section className="module-heading mobile-standard-heading"><div><h1>{t("Support")}</h1><p>{t("Fragen, Fehler und Sicherheitsmeldungen direkt mit dem Binso Support klären.")}</p></div><div className="module-heading-actions"><ButtonLink href="/support/neu" icon={<Plus size={17}/>}>{t("Ticket erstellen")}</ButtonLink></div><Link className="ui-icon-button mobile-page-action" aria-label={t("Ticket erstellen")} href="/support/neu"><Plus size={20}/></Link></section>
 <section className="workspace-card list-workspace-card"><div className="support-list-toolbar"><ExpandableSearch value={q} onChange={setQ} placeholder={t("Tickets suchen …")}/></div>{shown.length?<div className="support-table"><div className="support-row head"><span>{t("Ticket")}</span><span>{t("Betreff")}</span><span>{t("Kategorie")}</span><span>{t("Priorität")}</span><span>{t("Status")}</span></div>{shown.map(x=><Link className="support-row" href={`/support/${x.id}`} key={x.id}><strong>{x.number}</strong><span>{x.subject}</span><span className="support-row-category">{t(supportCategoryLabel(x.category))}</span><span className="support-row-priority">{t(supportPriorityLabel(x.priority))}</span><em>{t(supportStatusLabel(x.status))}</em></Link>)}</div>:<div className="empty-state compact-list-empty">{q.trim()?t("Keine Ergebnisse gefunden."):t("Noch keine Supporttickets")}</div>}</section></div>;
}
