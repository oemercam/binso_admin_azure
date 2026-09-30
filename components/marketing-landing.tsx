"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {useEffect,useRef,useState} from "react";
import {ArrowRight,Check,ChevronRight,Clock3,FileText,FolderKanban,ReceiptText,ShieldCheck,Sparkles,Users,WalletCards} from "lucide-react";
import PricingCarousel from "@/components/marketing/pricing-carousel";
import {LanguageSwitcher,useLocale} from "@/components/locale-provider";
import BrandLogo from "@/components/ui/brand-logo";
import MarketingMenuButton from "@/components/marketing/marketing-menu-button";
import {useMarketingReveal} from "@/components/marketing/use-marketing-reveal";
import MarketingFooter from "@/components/marketing/marketing-footer";

const featureGroups=[
 {icon:ReceiptText,title:"Verkauf und Finanzen",text:"Kunden, Offerten, AuftrÃ¤ge, Rechnungen, Zahlungen, Lieferanten und Eingangsrechnungen in einem Ablauf."},
 {icon:FolderKanban,title:"Projekte und Zeit",text:"Projekte, Aufgaben, Budgets, Zeiterfassung, Spesen und Weiterverrechnung ohne Medienbruch."},
 {icon:Users,title:"Personal und Organisation",text:"Mitarbeitende, Abwesenheiten, Dokumente, Rollen und ein nachvollziehbarer Audit-Verlauf."},
 {icon:WalletCards,title:"MWST und Ãœbersicht",text:"MWST-Perioden, BuchhaltungsÃ¼bersicht, BankvorgÃ¤nge und Berichte fÃ¼r die tÃ¤gliche Unternehmenssteuerung."},
];

export default function MarketingLanding(){
 const [menuOpen,setMenuOpen]=useState(false);
 const menuRef=useRef<HTMLElement|null>(null);
 const pathname=usePathname();
 const {t}=useLocale();
 useMarketingReveal();
 useEffect(()=>{
  document.body.classList.toggle("marketing-menu-open",menuOpen);
  if(!menuOpen)return()=>document.body.classList.remove("marketing-menu-open");
  const previousOverflow=document.documentElement.style.overflow;
  document.documentElement.style.overflow="hidden";
  const onKey=(event:KeyboardEvent)=>{if(event.key==="Escape")setMenuOpen(false)};
  window.addEventListener("keydown",onKey);
  window.requestAnimationFrame(()=>menuRef.current?.querySelector<HTMLAnchorElement>("nav a")?.focus());
  return()=>{document.body.classList.remove("marketing-menu-open");document.documentElement.style.overflow=previousOverflow;window.removeEventListener("keydown",onKey)};
 },[menuOpen]);
 useEffect(()=>{window.scrollTo({top:0,left:0,behavior:"auto"})},[pathname]);
 const close=()=>setMenuOpen(false);
 return <div className="marketing-shell">
  <header className="marketing-header">
   <Link href="/" className="marketing-logo marketing-logo-image" aria-label="Binso One"><BrandLogo priority/></Link>
   <nav className="marketing-nav"><Link href="/features">{t("Funktionen")}</Link><Link href="/preise">{t("Preise")}</Link><Link href="/sicherheit">{t("Sicherheit")}</Link><Link href="/kontakt">{t("Kontakt")}</Link></nav>
   <div className="marketing-actions"><LanguageSwitcher compact/><Link href="/portal/login">{t("Anmelden")}</Link><Link className="marketing-primary" href="/portal/registrieren">{t("Kostenlos starten")} <ArrowRight size={16}/></Link></div>
   <MarketingMenuButton open={menuOpen} onClick={()=>setMenuOpen(v=>!v)}/>
  </header>
  <aside id="marketing-mobile-navigation" ref={menuRef} className={`marketing-mobile-menu ${menuOpen?"open":""}`} aria-hidden={!menuOpen} aria-modal={menuOpen?true:undefined} role="dialog">
   <div className="marketing-mobile-menu-head"><strong>{t("Navigation")}</strong></div>
   <nav><Link href="/features" onClick={close}>{t("Funktionen")}</Link><Link href="/preise" onClick={close}>{t("Preise")}</Link><Link href="/sicherheit" onClick={close}>{t("Sicherheit")}</Link><Link href="/kontakt" onClick={close}>{t("Kontakt")}</Link></nav>
   <div className="marketing-mobile-language"><LanguageSwitcher/></div>
   <div className="marketing-mobile-actions"><Link href="/portal/login" className="marketing-secondary" onClick={close}>{t("Anmelden")}</Link><Link href="/portal/registrieren?trial=1" className="marketing-primary" onClick={close}>{t("14 Tage kostenlos testen")}</Link></div>
  </aside>
  <main>
   <section className="marketing-hero" data-reveal>
    <div className="hero-copy">
      <div className="eyebrow-pill"><Sparkles size={15}/>{t("Schweizer KMU-Plattform")}</div>
      <h1>{t("Dein Unternehmen. Ein System.")}</h1>
      <p>{t("Binso One verbindet Verkauf, Projekte, Zeit, Finanzen und Personal in einer klaren OberflÃ¤che â€“ fÃ¼r kleine und mittlere Unternehmen in der Schweiz.")}</p>
      <div className="hero-actions"><Link className="marketing-primary big" href="/portal/registrieren?trial=1">{t("14 Tage kostenlos testen")} <ArrowRight size={17}/></Link><Link className="marketing-secondary big" href="/demo">{t("Demo Ã¶ffnen")}</Link></div>
      <div className="hero-proof"><span><Check size={15}/>{t("Keine Kreditkarte fÃ¼r die Demo")}</span><span><Check size={15}/>{t("Schweizer Prozesse")}</span><span><Check size={15}/>{t("Web, Mobile und PWA")}</span></div>
    </div>
    <div className="hero-product">
      <div className="hero-browser-bar"><span/><span/><span/><div>app.binso.ch/dashboard</div></div>
      <div className="hero-app-preview"><aside><strong>B</strong>{[1,2,3,4,5,6].map(i=><span key={i}/>)}</aside><div className="hero-preview-content"><div className="hero-preview-top"><div><small>{t("Ãœbersicht")}</small><h3>{t("UnternehmensÃ¼bersicht")}</h3></div><div className="hero-avatar">OC</div></div><div className="hero-kpis">{["CHF 128â€™450","CHF 24â€™300","612 h","CHF 7â€™820"].map((v,i)=><div key={v}><small>{t(["Umsatz","Offene Rechnungen","Arbeitsstunden","MWST"][i])}</small><strong>{v}</strong><span/></div>)}</div><div className="hero-preview-grid"><div className="hero-preview-card large"><small>{t("Heute wichtig")}</small>{["Offerte prÃ¼fen","MWST vorbereiten","LÃ¶hne freigeben","Spesen prÃ¼fen"].map(x=><p key={x}><i/><span>{t(x)}</span><em>â€º</em></p>)}</div><div className="hero-preview-card"><small>{t("Zeiterfassung")}</small><div className="hero-ring">28 h</div></div></div></div></div>
    </div>
   </section>
   <section className="marketing-strip" data-reveal>{["Verkauf","Projekte","Zeiterfassung","Rechnungen","MWST","Personal","Berichte"].map(x=><span key={x}>{t(x)}</span>)}</section>
   <section id="funktionen" className="marketing-section" data-reveal><div className="section-kicker">{t("Eine Plattform statt EinzellÃ¶sungen")}</div><h2>{t("Alles, was dein Unternehmen tÃ¤glich braucht.")}</h2><p className="section-lead">{t("Die Module greifen ineinander. Aus einer Offerte wird ein Auftrag, daraus ein Projekt, aus Zeit und Spesen eine Rechnung und daraus ein sauberer Zahlungseingang.")}</p><div className="marketing-feature-grid">{featureGroups.map(x=>{const Icon=x.icon;return <article key={x.title}><div className="marketing-icon"><Icon size={22}/></div><h3>{t(x.title)}</h3><p>{t(x.text)}</p><span>{t("Mehr erfahren")} <ChevronRight size={15}/></span></article>})}</div></section>
   <section className="workflow-band" data-reveal><div><div className="section-kicker">{t("DurchgÃ¤ngiger Prozess")}</div><h2>{t("Vom ersten Kontakt bis zur Zahlung.")}</h2></div><div className="workflow-steps">{["Kunde","Offerte","Auftrag","Projekt","Zeit und Spesen","Rechnung","Zahlung","MWST"].map((x,i)=><div key={x}><span>{String(i+1).padStart(2,"0")}</span><strong>{t(x)}</strong></div>)}</div></section>
   <section id="preise" className="marketing-section pricing-section" data-reveal><div className="section-kicker">{t("Transparent und skalierbar")}</div><h2>{t("Drei PlÃ¤ne. Jederzeit wechselbar.")}</h2><p className="section-lead">{t("Alle Preise pro Firma und Monat, exkl. MWST. JÃ¤hrliche Zahlung entspricht zwei kostenlosen Monaten.")}</p><PricingCarousel/></section>
   <section className="marketing-section marketing-faq-section" data-reveal><div className="section-kicker">{t("Kurz beantwortet")}</div><h2>{t("Was Unternehmen vor dem Start wissen wollen.")}</h2><div className="marketing-faq-grid"><article><h3>{t("FÃ¼r wen ist Binso One gedacht?")}</h3><p>{t("FÃ¼r Schweizer KMU, die Verkauf, Projekte, Zeit, Rechnungen und Administration in einer zentralen Plattform fÃ¼hren mÃ¶chten.")}</p></article><article><h3>{t("Kann ich zuerst testen?")}</h3><p>{t("Ja. Die Demo funktioniert ohne Kreditkarte. FÃ¼r eine eigene Testorganisation ist ein Trial-Flow vorbereitet.")}</p></article><article><h3>{t("UnterstÃ¼tzt Binso One mehrere Benutzer?")}</h3><p>{t("Ja. Rollen, Einladungen und Berechtigungen werden pro Organisation verwaltet.")}</p></article><article><h3>{t("Wie ist der Support organisiert?")}</h3><p>{t("Kunden kÃ¶nnen Tickets direkt in Binso One erstellen und freiwillig Diagnose, Screenshot oder AnhÃ¤nge mitsenden.")}</p></article></div></section>
   <section id="sicherheit" className="marketing-section security-section" data-reveal><div className="security-copy"><div className="section-kicker">{t("FÃ¼r Unternehmen entwickelt")}</div><h2>{t("Klar getrennte Firmen, Rollen und Prozesse.")}</h2><p>{t("Jede registrierte Organisation erhÃ¤lt ihren eigenen Mandanten. Rollen, serverseitige Berechtigungen, Audit-Verlauf und Einstellungen werden pro Firma getrennt verwaltet. Betreiberzugriffe und Kundenzugriffe sind zusÃ¤tzlich voneinander getrennt.")}</p><div className="security-points"><span><ShieldCheck size={18}/>{t("Rollen und Berechtigungen")}</span><span><FileText size={18}/>{t("Audit und Dokumente")}</span><span><Clock3 size={18}/>{t("nachvollziehbare Workflows")}</span></div></div><div className="security-card"><strong>{t("Bereit fÃ¼r deinen Prozess?")}</strong><p>{t("Starte eine kostenlose Testorganisation oder Ã¶ffne die vorkonfigurierte Demo.")}</p><Link className="marketing-primary big" href="/portal/registrieren?trial=1">{t("Jetzt testen")} <ArrowRight size={17}/></Link><Link className="marketing-secondary big" href="/demo">{t("Demo ansehen")}</Link></div></section>
  </main>
  <MarketingFooter/>
 </div>;
}

