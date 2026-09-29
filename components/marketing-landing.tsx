"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Check, ChevronRight, Clock3, FileText, FolderKanban, ReceiptText, ShieldCheck, Sparkles, Users, WalletCards, X } from "lucide-react";
import { plans } from "@/lib/saas-store";

import { LanguageSwitcher } from "@/components/locale-provider";
import BrandLogo from "@/components/ui/brand-logo";
import MarketingMenuButton from "@/components/marketing/marketing-menu-button";
import {useMarketingReveal} from "@/components/marketing/use-marketing-reveal";
const featureGroups=[
 {icon:ReceiptText,title:"Verkauf und Finanzen",text:"Kunden, Offerten, Aufträge, Rechnungen, Zahlungen, Lieferanten und Eingangsrechnungen in einem Ablauf."},
 {icon:FolderKanban,title:"Projekte und Zeit",text:"Projekte, Aufgaben, Budgets, Zeiterfassung, Spesen und Weiterverrechnung ohne Medienbruch."},
 {icon:Users,title:"Personal und Organisation",text:"Mitarbeitende, Abwesenheiten, Dokumente, Rollen und ein nachvollziehbarer Audit-Verlauf."},
 {icon:WalletCards,title:"MWST und Übersicht",text:"MWST-Perioden, Buchhaltungsübersicht, Bankvorgänge und Berichte für die tägliche Unternehmenssteuerung."},
];

export default function MarketingLanding(){
 const [menuOpen,setMenuOpen]=useState(false);
 useMarketingReveal();
 useEffect(()=>{document.body.classList.toggle("marketing-menu-open",menuOpen);return()=>document.body.classList.remove("marketing-menu-open")},[menuOpen]);
 const close=()=>setMenuOpen(false);
 return <div className="marketing-shell">
  <header className="marketing-header">
   <Link href="/" className="marketing-logo marketing-logo-image" aria-label="Binso One"><BrandLogo priority/></Link>
   <nav className="marketing-nav"><Link href="/features">Funktionen</Link><Link href="/preise">Preise</Link><Link href="/sicherheit">Sicherheit</Link><Link href="/kontakt">Kontakt</Link></nav>
   <div className="marketing-actions"><LanguageSwitcher compact /><Link href="/portal/login">Anmelden</Link><Link className="marketing-primary" href="/portal/registrieren">Kostenlos starten <ArrowRight size={16}/></Link></div>
   <MarketingMenuButton open={menuOpen} onClick={()=>setMenuOpen(v=>!v)}/>
  </header>
  {menuOpen&&<div className="marketing-mobile-backdrop" onClick={close} aria-hidden="true"/>}
  <aside className={`marketing-mobile-menu ${menuOpen?"open":""}`} aria-hidden={!menuOpen}>
   <div className="marketing-mobile-menu-head"><strong>Navigation</strong><button type="button" aria-label="Navigation schliessen" onClick={close}><X size={20}/></button></div>
   <nav><Link href="/features" onClick={close}>Funktionen</Link><Link href="/preise" onClick={close}>Preise</Link><Link href="/sicherheit" onClick={close}>Sicherheit</Link><Link href="/kontakt" onClick={close}>Kontakt</Link></nav>
   <div className="marketing-mobile-language"><LanguageSwitcher /></div>
   <div className="marketing-mobile-actions"><Link href="/portal/login" className="marketing-secondary" onClick={close}>Anmelden</Link><Link href="/portal/registrieren?trial=1" className="marketing-primary" onClick={close}>14 Tage kostenlos testen</Link></div>
  </aside>
  <main>
   <section className="marketing-hero" data-reveal>
    <div className="hero-copy">
      <div className="eyebrow-pill"><Sparkles size={15}/> Schweizer KMU-Plattform</div>
      <h1>Dein Unternehmen.<br/>Ein System.</h1>
      <p>Binso One verbindet Verkauf, Projekte, Zeit, Finanzen und Personal in einer klaren Oberfläche – für kleine und mittlere Unternehmen in der Schweiz.</p>
      <div className="hero-actions"><Link className="marketing-primary big" href="/portal/registrieren?trial=1">14 Tage kostenlos testen <ArrowRight size={17}/></Link><Link className="marketing-secondary big" href="/demo">Demo öffnen</Link></div>
      <div className="hero-proof"><span><Check size={15}/> Keine Kreditkarte für die Demo</span><span><Check size={15}/> Schweizer Prozesse</span><span><Check size={15}/> Web, Mobile und PWA</span></div>
    </div>
    <div className="hero-product">
      <div className="hero-browser-bar"><span/><span/><span/><div>app.binso.ch/dashboard</div></div>
      <div className="hero-app-preview">
        <aside><strong>B</strong>{[1,2,3,4,5,6].map(i=><span key={i}/>)}</aside>
        <div className="hero-preview-content"><div className="hero-preview-top"><div><small>Übersicht</small><h3>Unternehmensübersicht</h3></div><div className="hero-avatar">OC</div></div><div className="hero-kpis">{["CHF 128’450","CHF 24’300","612 h","CHF 7’820"].map((v,i)=><div key={v}><small>{["Umsatz","Offene Rechnungen","Arbeitsstunden","MWST"][i]}</small><strong>{v}</strong><span/></div>)}</div><div className="hero-preview-grid"><div className="hero-preview-card large"><small>Heute wichtig</small>{["Offerte prüfen","MWST vorbereiten","Löhne freigeben","Spesen prüfen"].map(x=><p key={x}><i/><span>{x}</span><em>›</em></p>)}</div><div className="hero-preview-card"><small>Zeiterfassung</small><div className="hero-ring">28 h</div></div></div></div>
      </div>
    </div>
   </section>

   <section className="marketing-strip" data-reveal><span>Verkauf</span><span>Projekte</span><span>Zeiterfassung</span><span>Rechnungen</span><span>MWST</span><span>Personal</span><span>Berichte</span></section>

   <section id="funktionen" className="marketing-section" data-reveal>
    <div className="section-kicker">Eine Plattform statt Einzellösungen</div><h2>Alles, was dein Unternehmen täglich braucht.</h2><p className="section-lead">Die Module greifen ineinander. Aus einer Offerte wird ein Auftrag, daraus ein Projekt, aus Zeit und Spesen eine Rechnung und daraus ein sauberer Zahlungseingang.</p>
    <div className="marketing-feature-grid">{featureGroups.map(x=>{const Icon=x.icon;return <article key={x.title}><div className="marketing-icon"><Icon size={22}/></div><h3>{x.title}</h3><p>{x.text}</p><span>Mehr erfahren <ChevronRight size={15}/></span></article>})}</div>
   </section>

   <section className="workflow-band" data-reveal>
    <div><div className="section-kicker">Durchgängiger Prozess</div><h2>Vom ersten Kontakt bis zur Zahlung.</h2></div>
    <div className="workflow-steps">{["Kunde","Offerte","Auftrag","Projekt","Zeit und Spesen","Rechnung","Zahlung","MWST"].map((x,i)=><div key={x}><span>{String(i+1).padStart(2,"0")}</span><strong>{x}</strong></div>)}</div>
   </section>

   <section id="preise" className="marketing-section pricing-section" data-reveal>
    <div className="section-kicker">Transparent und skalierbar</div><h2>Drei Pläne. Jederzeit wechselbar.</h2><p className="section-lead">Alle Preise pro Firma und Monat, exkl. MWST. Jährliche Zahlung entspricht zwei kostenlosen Monaten.</p>
    <div className="pricing-grid">{plans.map(p=><article key={p.id} className={p.popular?"pricing-card popular":"pricing-card"}>{p.popular&&<div className="popular-badge">Empfohlen</div>}<h3>{p.name}</h3><p>{p.description}</p><div className="price"><strong>CHF {p.monthly}</strong><span>/ Monat</span></div><Link className={p.popular?"marketing-primary plan-button":"marketing-secondary plan-button"} href={`/portal/registrieren?plan=${p.id}`}>{p.name} wählen</Link><div className="plan-features">{p.features.map(f=><span key={f}><Check size={15}/>{f}</span>)}</div></article>)}</div>
   </section>


   <section className="marketing-section marketing-faq-section" data-reveal>
    <div className="section-kicker">Kurz beantwortet</div><h2>Was Unternehmen vor dem Start wissen wollen.</h2>
    <div className="marketing-faq-grid">
     <article><h3>Für wen ist Binso One gedacht?</h3><p>Für Schweizer KMU, die Verkauf, Projekte, Zeit, Rechnungen und Administration in einer zentralen Plattform führen möchten.</p></article>
     <article><h3>Kann ich zuerst testen?</h3><p>Ja. Die Demo funktioniert ohne Kreditkarte. Für eine eigene Testorganisation ist ein Trial-Flow vorbereitet.</p></article>
     <article><h3>Unterstützt Binso One mehrere Benutzer?</h3><p>Ja. Rollen, Einladungen und Berechtigungen werden pro Organisation verwaltet.</p></article>
     <article><h3>Wie ist der Support organisiert?</h3><p>Kunden können Tickets direkt in Binso One erstellen und freiwillig Diagnose, Screenshot oder Anhänge mitsenden.</p></article>
    </div>
   </section>

   <section id="sicherheit" className="marketing-section security-section" data-reveal>
     <div className="security-copy"><div className="section-kicker">Für Unternehmen entwickelt</div><h2>Klar getrennte Firmen, Rollen und Prozesse.</h2><p>Jede registrierte Organisation erhält ihren eigenen Mandanten. Rollen, serverseitige Berechtigungen, Audit-Verlauf und Einstellungen werden pro Firma getrennt verwaltet. Betreiberzugriffe und Kundenzugriffe sind zusätzlich voneinander getrennt.</p><div className="security-points"><span><ShieldCheck size={18}/> Rollen und Berechtigungen</span><span><FileText size={18}/> Audit und Dokumente</span><span><Clock3 size={18}/> nachvollziehbare Workflows</span></div></div>
     <div className="security-card"><strong>Bereit für deinen Prozess?</strong><p>Starte eine kostenlose Testorganisation oder öffne die vorkonfigurierte Demo.</p><Link className="marketing-primary big" href="/portal/registrieren?trial=1">Jetzt testen <ArrowRight size={17}/></Link><Link className="marketing-secondary big" href="/demo">Demo ansehen</Link></div>
   </section>
  </main>
  <footer className="marketing-footer"><div><BrandLogo/><span>KMU-Plattform für die Schweiz</span></div><div><Link href="/preise">Preise</Link><Link href="/kontakt">Kontakt</Link><Link href="/support">Support</Link><Link href="/status">Status</Link><Link href="/impressum">Impressum</Link><Link href="/agb">AGB</Link><Link href="/datenschutz">Datenschutz</Link><Link href="/cookies">Cookies</Link></div><small>© 2026 Binso GmbH</small></footer>
 </div>
}
