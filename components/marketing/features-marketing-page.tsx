import Link from "next/link";
import {ArrowRight,Banknote,BriefcaseBusiness,Check,Clock3,FileText,FolderKanban,ReceiptText,ShieldCheck,Users} from "lucide-react";
import MarketingFrame from "@/components/marketing/marketing-frame";

const groups=[
 {icon:BriefcaseBusiness,title:"Verkauf",text:"Kunden, Offerten und Aufträge ohne doppelte Erfassung.",items:["CRM und Kontakte","Offerten mit Positionen","Aufträge aus angenommenen Offerten"]},
 {icon:FolderKanban,title:"Projekte",text:"Leistungen, Aufgaben, Budgets und Termine zentral steuern.",items:["Projektübersicht","Aufgaben und Meilensteine","Weiterverrechnung"]},
 {icon:Clock3,title:"Zeit und Spesen",text:"Arbeitszeit und Auslagen dort erfassen, wo sie entstehen.",items:["Mobile Zeiterfassung","Spesen mit Beleg","Freigaben und Projektbezug"]},
 {icon:ReceiptText,title:"Rechnungen",text:"Aus Leistungen werden nachvollziehbare Rechnungen und Zahlungen.",items:["Rechnungen und Gutschriften","Teilzahlungen und Mahnungen","Schweizer MWST-Grundlagen"]},
 {icon:Banknote,title:"Finanzen",text:"Offene Posten, Bank, MWST und Berichte in einer Übersicht.",items:["Zahlungszuordnung","MWST-Übersicht","Berichte und Exporte"]},
 {icon:Users,title:"Personal",text:"Mitarbeitende, Abwesenheiten, Dokumente und Rollen verwalten.",items:["Mitarbeiterstamm","Abwesenheiten","Berechtigungen"]},
];
export default function FeaturesMarketingPage(){return <MarketingFrame>
 <section className="marketing-subhero"><div className="section-kicker">Funktionen</div><h1>Ein Ablauf statt vieler Einzellösungen.</h1><p>Binso One verbindet die wichtigsten administrativen Prozesse eines Schweizer KMU. Module teilen Beziehungen, Status und Berechtigungen – ohne dass Informationen mehrfach gepflegt werden müssen.</p><div className="hero-actions"><Link className="marketing-primary big" href="/registrieren?trial=1">Kostenlos testen <ArrowRight size={17}/></Link><Link className="marketing-secondary big" href="/demo">Demo öffnen</Link></div></section>
 <section className="marketing-section compact-section"><div className="marketing-feature-grid feature-detail-grid">{groups.map(g=>{const Icon=g.icon;return <article key={g.title}><div className="marketing-icon"><Icon size={22}/></div><h2>{g.title}</h2><p>{g.text}</p><div className="plan-features">{g.items.map(x=><span key={x}><Check size={15}/>{x}</span>)}</div></article>})}</div></section>
 <section className="workflow-band"><div><div className="section-kicker">Durchgängig</div><h2>Vom Kunden bis zur Zahlung.</h2><p>Beziehungen bleiben erhalten, damit der nächste Schritt nicht wieder bei null beginnt.</p></div><div className="workflow-steps">{["Kunde","Offerte","Auftrag","Projekt","Zeit und Spesen","Rechnung","Zahlung","MWST"].map((x,i)=><div key={x}><span>{String(i+1).padStart(2,"0")}</span><strong>{x}</strong></div>)}</div></section>
 <section className="marketing-section security-section"><div className="security-copy"><div className="section-kicker">Sicherheit und Betrieb</div><h2>Für mehrere Benutzer und klare Verantwortungen.</h2><div className="security-points"><span><ShieldCheck size={18}/> Rollen und serverseitige Berechtigungen</span><span><FileText size={18}/> Auditierbare Aktionen</span><span><Users size={18}/> Getrennte Firmenmandanten</span></div></div><div className="security-card"><strong>Binso One selbst prüfen</strong><p>Öffne die Demo oder starte eine Testorganisation.</p><Link className="marketing-primary big" href="/demo">Demo ansehen <ArrowRight size={17}/></Link></div></section>
 </MarketingFrame>}
