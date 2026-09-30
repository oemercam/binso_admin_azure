"use client";
import Link from "next/link";
import {ArrowRight,Banknote,BriefcaseBusiness,Check,Clock3,FileText,FolderKanban,ReceiptText,ShieldCheck,Users} from "lucide-react";
import MarketingFrame from "@/components/marketing/marketing-frame";
import {useLocale} from "@/components/locale-provider";

const groups=[
 {icon:BriefcaseBusiness,title:"Verkauf",text:"Kunden, Offerten und Aufträge ohne doppelte Erfassung.",items:["CRM und Kontakte","Offerten mit Positionen","Aufträge aus angenommenen Offerten"]},
 {icon:FolderKanban,title:"Projekte",text:"Leistungen, Aufgaben, Budgets und Termine zentral steuern.",items:["Projektübersicht","Aufgaben und Meilensteine","Weiterverrechnung"]},
 {icon:Clock3,title:"Zeit und Spesen",text:"Arbeitszeit und Auslagen dort erfassen, wo sie entstehen.",items:["Mobile Zeiterfassung","Spesen mit Beleg","Freigaben und Projektbezug"]},
 {icon:ReceiptText,title:"Rechnungen",text:"Aus Leistungen werden nachvollziehbare Rechnungen und Zahlungen.",items:["Rechnungen und Gutschriften","Teilzahlungen und Mahnungen","Schweizer MWST-Grundlagen"]},
 {icon:Banknote,title:"Finanzen",text:"Offene Posten, Bank, MWST und Berichte in einer Übersicht.",items:["Zahlungszuordnung","MWST-Übersicht","Berichte und Exporte"]},
 {icon:Users,title:"Personal",text:"Mitarbeitende, Abwesenheiten, Dokumente und Rollen verwalten.",items:["Mitarbeiterstamm","Abwesenheiten","Berechtigungen"]},
];
export default function FeaturesMarketingPage(){const {t}=useLocale();return <MarketingFrame>
 <section className="marketing-subhero"><div className="section-kicker">{t("Funktionen")}</div><h1>{t("Ein Ablauf statt vieler Einzellösungen.")}</h1><p>{t("Binso One verbindet die wichtigsten administrativen Prozesse eines Schweizer KMU. Informationen werden zwischen den Modulen weiterverwendet, statt mehrfach erfasst.")}</p><div className="hero-actions"><Link className="marketing-primary big" href="/portal/registrieren?trial=1">{t("Kostenlos testen")} <ArrowRight size={17}/></Link><Link className="marketing-secondary big" href="/demo?start=1">{t("Demo öffnen")}</Link></div></section>
 <section className="marketing-section compact-section"><div className="marketing-feature-grid feature-detail-grid">{groups.map(g=>{const Icon=g.icon;return <article key={g.title}><div className="marketing-icon"><Icon size={22}/></div><h2>{t(g.title)}</h2><p>{t(g.text)}</p><div className="plan-features">{g.items.map(x=><span key={x}><Check size={15}/>{t(x)}</span>)}</div></article>})}</div></section>
 <section className="workflow-band"><div><div className="section-kicker">{t("Durchgängiger Prozess")}</div><h2>{t("Vom Kunden bis zur Zahlung.")}</h2><p>{t("Kunden, Dokumente und Leistungen bleiben miteinander verknüpft, damit der nächste Schritt auf vorhandenen Daten aufbaut.")}</p></div><div className="workflow-steps">{["Kunde","Offerte","Auftrag","Projekt","Zeit und Spesen","Rechnung","Zahlung","MWST"].map((x,i)=><div key={x}><span>{String(i+1).padStart(2,"0")}</span><strong>{t(x)}</strong></div>)}</div></section>
 <section className="marketing-section security-section"><div className="security-copy"><div className="section-kicker">{t("Sicherheit und Betrieb")}</div><h2>{t("Rollen und Zugriffe klar steuern.")}</h2><div className="security-points"><span><ShieldCheck size={18}/>{t("Rollen und serverseitige Berechtigungen")}</span><span><FileText size={18}/>{t("Nachvollziehbare Aktionen")}</span><span><Users size={18}/>{t("Getrennte Firmenmandanten")}</span></div></div><div className="security-card"><strong>{t("Binso One selbst prüfen")}</strong><p>{t("Öffne die Demo oder starte eine eigene Testorganisation.")}</p><Link className="marketing-primary big" href="/demo?start=1">{t("Demo ansehen")} <ArrowRight size={17}/></Link></div></section>
 </MarketingFrame>}
