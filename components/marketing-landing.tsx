"use client";

import Link from "next/link";
import {ArrowRight,Check,ChevronRight,Clock3,FileText,FolderKanban,ReceiptText,ShieldCheck,Sparkles,Users,WalletCards} from "lucide-react";
import PricingCarousel from "@/components/marketing/pricing-carousel";
import {useLocale} from "@/components/locale-provider";
import MarketingFrame from "@/components/marketing/marketing-frame";
import {useMarketingReveal} from "@/components/marketing/use-marketing-reveal";

const featureGroups=[
 {icon:ReceiptText,title:"Verkauf und Finanzen",text:"Kunden, Offerten, Aufträge, Rechnungen, Zahlungen, Lieferanten und Eingangsrechnungen in einem Ablauf."},
 {icon:FolderKanban,title:"Projekte und Zeit",text:"Projekte, Aufgaben, Budgets, Zeiterfassung, Spesen und Weiterverrechnung ohne Medienbruch."},
 {icon:Users,title:"Personal und Organisation",text:"Mitarbeitende, Abwesenheiten, Dokumente, Rollen und ein nachvollziehbarer Audit-Verlauf."},
 {icon:WalletCards,title:"MWST und Übersicht",text:"MWST-Perioden, Buchhaltungsübersicht, Bankvorgänge und Berichte für die tägliche Unternehmenssteuerung."},
];

export default function MarketingLanding(){
 const {t}=useLocale();
 useMarketingReveal();
 return <MarketingFrame>
   <section className="marketing-hero" data-reveal>
    <div className="hero-copy">
      <div className="eyebrow-pill"><Sparkles size={15}/>{t("Schweizer KMU-Plattform")}</div>
      <h1>{t("Dein Unternehmen. Ein System.")}</h1>
      <p>{t("Binso One verbindet Verkauf, Projekte, Zeit, Finanzen und Personal in einer klaren Oberfläche – für kleine und mittlere Unternehmen in der Schweiz.")}</p>
      <div className="hero-actions"><Link className="marketing-primary big" href="/portal/registrieren?trial=1">{t("14 Tage kostenlos testen")} <ArrowRight size={17}/></Link><Link className="marketing-secondary big" href="/demo">{t("Demo öffnen")}</Link></div>
      <div className="hero-proof"><span><Check size={15}/>{t("Keine Kreditkarte für die Demo")}</span><span><Check size={15}/>{t("Schweizer Prozesse")}</span><span><Check size={15}/>{t("Web, Mobile und PWA")}</span></div>
    </div>
    <div className="hero-product">
      <div className="hero-browser-bar"><span/><span/><span/><div>app.binso.ch/dashboard</div></div>
      <div className="hero-app-preview"><aside><strong>B</strong>{[1,2,3,4,5,6].map(i=><span key={i}/>)}</aside><div className="hero-preview-content"><div className="hero-preview-top"><div><small>{t("Übersicht")}</small><h3>{t("Unternehmensübersicht")}</h3></div><div className="hero-avatar">OC</div></div><div className="hero-kpis">{["CHF 128’450","CHF 24’300","612 h","CHF 7’820"].map((v,i)=><div key={v}><small>{t(["Umsatz","Offene Rechnungen","Arbeitsstunden","MWST"][i])}</small><strong>{v}</strong><span/></div>)}</div><div className="hero-preview-grid"><div className="hero-preview-card large"><small>{t("Heute wichtig")}</small>{["Offerte prüfen","MWST vorbereiten","Löhne freigeben","Spesen prüfen"].map(x=><p key={x}><i/><span>{t(x)}</span><em>›</em></p>)}</div><div className="hero-preview-card"><small>{t("Zeiterfassung")}</small><div className="hero-ring">28 h</div></div></div></div></div>
    </div>
   </section>
   <section className="marketing-strip" data-reveal>{["Verkauf","Projekte","Zeiterfassung","Rechnungen","MWST","Personal","Berichte"].map(x=><span key={x}>{t(x)}</span>)}</section>
   <section id="funktionen" className="marketing-section" data-reveal><div className="section-kicker">{t("Eine Plattform statt Einzellösungen")}</div><h2>{t("Alles, was dein Unternehmen täglich braucht.")}</h2><p className="section-lead">{t("Die Module greifen ineinander. Aus einer Offerte wird ein Auftrag, daraus ein Projekt, aus Zeit und Spesen eine Rechnung und daraus ein sauberer Zahlungseingang.")}</p><div className="marketing-feature-grid">{featureGroups.map(x=>{const Icon=x.icon;return <article key={x.title}><div className="marketing-icon"><Icon size={22}/></div><h3>{t(x.title)}</h3><p>{t(x.text)}</p><span>{t("Mehr erfahren")} <ChevronRight size={15}/></span></article>})}</div></section>
   <section className="workflow-band" data-reveal><div><div className="section-kicker">{t("Durchgängiger Prozess")}</div><h2>{t("Vom ersten Kontakt bis zur Zahlung.")}</h2></div><div className="workflow-steps">{["Kunde","Offerte","Auftrag","Projekt","Zeit und Spesen","Rechnung","Zahlung","MWST"].map((x,i)=><div key={x}><span>{String(i+1).padStart(2,"0")}</span><strong>{t(x)}</strong></div>)}</div></section>
   <section id="preise" className="marketing-section pricing-section" data-reveal><div className="section-kicker">{t("Transparent und skalierbar")}</div><h2>{t("Drei Pläne. Jederzeit wechselbar.")}</h2><p className="section-lead">{t("Alle Preise pro Firma und Monat, exkl. MWST. Jährliche Zahlung entspricht zwei kostenlosen Monaten.")}</p><PricingCarousel/></section>
   <section className="marketing-section marketing-faq-section" data-reveal><div className="section-kicker">{t("Kurz beantwortet")}</div><h2>{t("Was Unternehmen vor dem Start wissen wollen.")}</h2><div className="marketing-faq-grid"><article><h3>{t("Für wen ist Binso One gedacht?")}</h3><p>{t("Für Schweizer KMU, die Verkauf, Projekte, Zeit, Rechnungen und Administration in einer zentralen Plattform führen möchten.")}</p></article><article><h3>{t("Kann ich zuerst testen?")}</h3><p>{t("Ja. Die Demo funktioniert ohne Kreditkarte. Für eine eigene Testorganisation ist ein Trial-Flow vorbereitet.")}</p></article><article><h3>{t("Unterstützt Binso One mehrere Benutzer?")}</h3><p>{t("Ja. Rollen, Einladungen und Berechtigungen werden pro Organisation verwaltet.")}</p></article><article><h3>{t("Wie ist der Support organisiert?")}</h3><p>{t("Kunden können Tickets direkt in Binso One erstellen und freiwillig Diagnose, Screenshot oder Anhänge mitsenden.")}</p></article></div></section>
   <section id="sicherheit" className="marketing-section security-section" data-reveal><div className="security-copy"><div className="section-kicker">{t("Für Unternehmen entwickelt")}</div><h2>{t("Klar getrennte Firmen, Rollen und Prozesse.")}</h2><p>{t("Jede registrierte Organisation erhält ihren eigenen Mandanten. Rollen, serverseitige Berechtigungen, Audit-Verlauf und Einstellungen werden pro Firma getrennt verwaltet. Betreiberzugriffe und Kundenzugriffe sind zusätzlich voneinander getrennt.")}</p><div className="security-points"><span><ShieldCheck size={18}/>{t("Rollen und Berechtigungen")}</span><span><FileText size={18}/>{t("Audit und Dokumente")}</span><span><Clock3 size={18}/>{t("nachvollziehbare Workflows")}</span></div></div><div className="security-card"><strong>{t("Bereit für deinen Prozess?")}</strong><p>{t("Starte eine kostenlose Testorganisation oder öffne die vorkonfigurierte Demo.")}</p><Link className="marketing-primary big" href="/portal/registrieren?trial=1">{t("Jetzt testen")} <ArrowRight size={17}/></Link><Link className="marketing-secondary big" href="/demo">{t("Demo ansehen")}</Link></div></section>
 </MarketingFrame>;
}
