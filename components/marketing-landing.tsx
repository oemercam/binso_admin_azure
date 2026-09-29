"use client";

import Link from "next/link";
import { ArrowRight, Check, ChevronRight, Clock3, FileText, FolderKanban, ReceiptText, ShieldCheck, Sparkles, Users, WalletCards } from "lucide-react";
import {plans} from "@/lib/plans";

import { LanguageSwitcher } from "@/components/locale-provider";
import BrandLogo from "@/components/ui/brand-logo";
const featureGroups=[
 {icon:ReceiptText,title:"Verkauf und Finanzen",text:"Kunden, Offerten, AuftrÃ¤ge, Rechnungen, Zahlungen, Lieferanten und Eingangsrechnungen in einem Ablauf."},
 {icon:FolderKanban,title:"Projekte und Zeit",text:"Projekte, Aufgaben, Budgets, Zeiterfassung, Spesen und Weiterverrechnung ohne Medienbruch."},
 {icon:Users,title:"Personal und Organisation",text:"Mitarbeitende, Abwesenheiten, Dokumente, Rollen und ein nachvollziehbarer Audit-Verlauf."},
 {icon:WalletCards,title:"MWST und Ãœbersicht",text:"MWST-Perioden, BuchhaltungsÃ¼bersicht, BankvorgÃ¤nge und Berichte fÃ¼r die tÃ¤gliche Unternehmenssteuerung."},
];

export default function MarketingLanding(){
 return <div className="marketing-shell">
  <header className="marketing-header">
   <Link href="/" className="marketing-logo marketing-logo-image" aria-label="Binso One"><BrandLogo/></Link>
   <nav className="marketing-nav"><a href="#funktionen">Funktionen</a><a href="#preise">Preise</a><a href="#sicherheit">Sicherheit</a></nav>
   <div className="marketing-actions"><LanguageSwitcher compact /><Link href="/login">Anmelden</Link><Link className="marketing-primary" href="/registrieren">Kostenlos starten <ArrowRight size={16}/></Link></div>
  </header>
  <main>
   <section className="marketing-hero">
    <div className="hero-copy">
      <div className="eyebrow-pill"><Sparkles size={15}/> Schweizer KMU-Plattform</div>
      <h1>Dein Unternehmen.<br/>Ein System.</h1>
      <p>Binso One verbindet Verkauf, Projekte, Zeit, Finanzen und Personal in einer klaren OberflÃ¤che â€“ fÃ¼r kleine und mittlere Unternehmen in der Schweiz.</p>
      <div className="hero-actions"><Link className="marketing-primary big" href="/registrieren?trial=1">14 Tage kostenlos testen <ArrowRight size={17}/></Link><Link className="marketing-secondary big" href="/demo">Demo Ã¶ffnen</Link></div>
      <div className="hero-proof"><span><Check size={15}/> Keine Kreditkarte fÃ¼r die Demo</span><span><Check size={15}/> Schweizer Prozesse</span><span><Check size={15}/> Web, Mobile und PWA</span></div>
    </div>
    <div className="hero-product">
      <div className="hero-browser-bar"><span/><span/><span/><div>app.binso.ch/dashboard</div></div>
      <div className="hero-app-preview">
        <aside><strong>B</strong>{[1,2,3,4,5,6].map(i=><span key={i}/>)}</aside>
        <div className="hero-preview-content"><div className="hero-preview-top"><div><small>Ãœbersicht</small><h3>UnternehmensÃ¼bersicht</h3></div><div className="hero-avatar">OC</div></div><div className="hero-kpis">{["CHF 128â€™450","CHF 24â€™300","612 h","CHF 7â€™820"].map((v,i)=><div key={v}><small>{["Umsatz","Offene Rechnungen","Arbeitsstunden","MWST"][i]}</small><strong>{v}</strong><span/></div>)}</div><div className="hero-preview-grid"><div className="hero-preview-card large"><small>Heute wichtig</small>{["Offerte prÃ¼fen","MWST vorbereiten","LÃ¶hne freigeben","Spesen prÃ¼fen"].map(x=><p key={x}><i/><span>{x}</span><em>â€º</em></p>)}</div><div className="hero-preview-card"><small>Zeiterfassung</small><div className="hero-ring">28 h</div></div></div></div>
      </div>
    </div>
   </section>

   <section className="marketing-strip"><span>Verkauf</span><span>Projekte</span><span>Zeiterfassung</span><span>Rechnungen</span><span>MWST</span><span>Personal</span><span>Berichte</span></section>

   <section id="funktionen" className="marketing-section">
    <div className="section-kicker">Eine Plattform statt EinzellÃ¶sungen</div><h2>Alles, was dein Unternehmen tÃ¤glich braucht.</h2><p className="section-lead">Die Module greifen ineinander. Aus einer Offerte wird ein Auftrag, daraus ein Projekt, aus Zeit und Spesen eine Rechnung und daraus ein sauberer Zahlungseingang.</p>
    <div className="marketing-feature-grid">{featureGroups.map(x=>{const Icon=x.icon;return <article key={x.title}><div className="marketing-icon"><Icon size={22}/></div><h3>{x.title}</h3><p>{x.text}</p><span>Mehr erfahren <ChevronRight size={15}/></span></article>})}</div>
   </section>

   <section className="workflow-band">
    <div><div className="section-kicker">DurchgÃ¤ngiger Prozess</div><h2>Vom ersten Kontakt bis zur Zahlung.</h2></div>
    <div className="workflow-steps">{["Kunde","Offerte","Auftrag","Projekt","Zeit und Spesen","Rechnung","Zahlung","MWST"].map((x,i)=><div key={x}><span>{String(i+1).padStart(2,"0")}</span><strong>{x}</strong></div>)}</div>
   </section>

   <section id="preise" className="marketing-section pricing-section">
    <div className="section-kicker">Transparent und skalierbar</div><h2>Drei PlÃ¤ne. Jederzeit wechselbar.</h2><p className="section-lead">Alle Preise pro Firma und Monat, exkl. MWST. JÃ¤hrliche Zahlung entspricht zwei kostenlosen Monaten.</p>
    <div className="pricing-grid">{plans.map(p=><article key={p.id} className={p.popular?"pricing-card popular":"pricing-card"}>{p.popular&&<div className="popular-badge">Empfohlen</div>}<h3>{p.name}</h3><p>{p.description}</p><div className="price"><strong>CHF {p.monthly}</strong><span>/ Monat</span></div><Link className={p.popular?"marketing-primary plan-button":"marketing-secondary plan-button"} href={`/registrieren?plan=${p.id}`}>{p.name} wÃ¤hlen</Link><div className="plan-features">{p.features.map(f=><span key={f}><Check size={15}/>{f}</span>)}</div></article>)}</div>
   </section>

   <section id="sicherheit" className="marketing-section security-section">
     <div className="security-copy"><div className="section-kicker">FÃ¼r Unternehmen entwickelt</div><h2>Klar getrennte Firmen, Rollen und Prozesse.</h2><p>Jede registrierte Organisation erhÃ¤lt ihren eigenen Mandanten. Rollen, Berechtigungen, Audit-Verlauf und Einstellungen werden pro Firma verwaltet. Die lokale Version simuliert diese Architektur bereits fÃ¼r Tests.</p><div className="security-points"><span><ShieldCheck size={18}/> Rollen und Berechtigungen</span><span><FileText size={18}/> Audit und Dokumente</span><span><Clock3 size={18}/> nachvollziehbare Workflows</span></div></div>
     <div className="security-card"><strong>Bereit fÃ¼r deinen Prozess?</strong><p>Starte eine kostenlose Testorganisation oder Ã¶ffne die vorkonfigurierte Demo.</p><Link className="marketing-primary big" href="/registrieren?trial=1">Jetzt testen <ArrowRight size={17}/></Link><Link className="marketing-secondary big" href="/demo">Demo ansehen</Link></div>
   </section>
  </main>
  <footer className="marketing-footer"><div><BrandLogo/><span>KMU-Plattform fÃ¼r die Schweiz</span></div><div><Link href="/preise">Preise</Link><Link href="/kontakt">Kontakt</Link><Link href="/support">Support</Link><Link href="/status">Status</Link><Link href="/impressum">Impressum</Link><Link href="/agb">AGB</Link><Link href="/datenschutz">Datenschutz</Link><Link href="/cookies">Cookies</Link></div><small>Â© 2026 Binso GmbH</small></footer>
 </div>
}

