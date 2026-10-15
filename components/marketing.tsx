"use client";

import {LocalizedText,LocalizedElement} from "@/lib/client/locale";
import Link from "next/link";
import {LocaleSwitcher} from "./locale-switcher";
import { useEffect, useRef, useState } from "react";
import { Button, Icon, Logo } from "./ui";
import {PrivacySettingsButton} from "./privacy-consent";

export function MarketingHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    const body = document.body;
    const root = document.documentElement;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
      rootOverflow: root.style.overflow,
    };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";
    root.style.overflow = "hidden";
    return () => {
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.width = previous.width;
      body.style.overflow = previous.overflow;
      root.style.overflow = previous.rootOverflow;
      window.scrollTo({ top: scrollY, left: 0, behavior: "auto" });
    };
  }, [open]);

  return <>
    <header className="marketing-header">
      <div className="marketing-nav">
        <Link href="/" onClick={() => setOpen(false)}><Logo /></Link>
        <nav>
          <Link href="/produkt"><LocalizedText>{"Produkt"}</LocalizedText></Link>
          <Link href="/#funktionen"><LocalizedText>{"Funktionen"}</LocalizedText></Link>
          <Link href="/preise"><LocalizedText>{"Preise"}</LocalizedText></Link>
        </nav>
        <div className="marketing-actions"><LocaleSwitcher compact/>
          <Link href="/login"><LocalizedText>{"Anmelden"}</LocalizedText></Link>
          <Button href="/registrieren"><LocalizedText>{"14 Tage kostenlos testen"}</LocalizedText></Button>
          <LocalizedElement as="button" className="marketing-menu-button" type="button" aria-label={open ? "Menü schliessen" : "Menü öffnen"} onClick={() => setOpen(!open)}>
            <span className={`menu-morph ${open ? "is-open" : ""}`} aria-hidden="true"><i/><i/><i/></span>
          </LocalizedElement>
        </div>
      </div>
    </header>

    {open && <div className="marketing-mobile-menu">
      <nav>
        <Link href="/produkt" onClick={() => setOpen(false)}><LocalizedText>{"Produkt "}</LocalizedText><Icon name="arrow"/></Link>
        <Link href="/#funktionen" onClick={() => setOpen(false)}><LocalizedText>{"Funktionen "}</LocalizedText><Icon name="arrow"/></Link>
        <Link href="/preise" onClick={() => setOpen(false)}><LocalizedText>{"Preise "}</LocalizedText><Icon name="arrow"/></Link>
      </nav>
      <div className="marketing-mobile-actions"><LocaleSwitcher/>
        <Button href="/login" variant="secondary"><LocalizedText>{"Anmelden"}</LocalizedText></Button>
        <Button href="/registrieren"><LocalizedText>{"14 Tage kostenlos testen"}</LocalizedText></Button>
        <Button href="/demo" variant="ghost"><LocalizedText>{"Demo starten"}</LocalizedText></Button>
      </div>
      <LocalizedElement as="div" className="marketing-mobile-social" aria-label="Binso Social Media">
        <LocalizedElement as="a" href="https://ch.linkedin.com/company/binsogmbh" target="_blank" rel="noreferrer" aria-label="Binso auf LinkedIn"><span aria-hidden="true"><LocalizedText>{"in"}</LocalizedText></span></LocalizedElement>
        <LocalizedElement as="span" className="marketing-social-placeholder" aria-label="Instagram Profil folgt">◎</LocalizedElement>
        <LocalizedElement as="span" className="marketing-social-placeholder marketing-social-xing" aria-label="XING Profil folgt"><LocalizedText>{"X"}</LocalizedText></LocalizedElement>
      </LocalizedElement>
      <small className="marketing-mobile-copyright">© 2026 <a href="https://binso.ch" target="_blank" rel="noreferrer"><LocalizedText>{"Binso GmbH"}</LocalizedText></a></small>
    </div>}
  </>;
}

export function MarketingFooter() {
  return <footer className="marketing-footer">
    <div><Logo/><LocaleSwitcher/><p><LocalizedText>{"Business-Software für Schweizer KMU."}</LocalizedText></p></div>
    <div className="footer-links">
      <Link href="/produkt"><LocalizedText>{"Produkt"}</LocalizedText></Link>
      <Link href="/preise"><LocalizedText>{"Preise"}</LocalizedText></Link>
      <Link href="/demo"><LocalizedText>{"Demo"}</LocalizedText></Link>
      <Link href="/login"><LocalizedText>{"Anmelden"}</LocalizedText></Link>
      <Link href="/impressum"><LocalizedText>{"Impressum"}</LocalizedText></Link>
      <Link href="/datenschutz"><LocalizedText>{"Datenschutz"}</LocalizedText></Link>
      <Link href="/agb"><LocalizedText>{"AGB"}</LocalizedText></Link>
      <Link href="/auftragsbearbeitung"><LocalizedText>{"DPA"}</LocalizedText></Link>
      <Link href="/unterauftragsbearbeiter"><LocalizedText>{"Unterauftragsbearbeiter"}</LocalizedText></Link>
      <LocalizedElement as="a" href="https://ch.linkedin.com/company/binsogmbh" target="_blank" rel="noreferrer" aria-label="Binso auf LinkedIn"><LocalizedText>{"LinkedIn"}</LocalizedText></LocalizedElement>
      <PrivacySettingsButton/>
    </div>
    <small>© 2026 <a href="https://binso.ch" target="_blank" rel="noreferrer"><LocalizedText>{"Binso GmbH"}</LocalizedText></a><LocalizedText>{" · Weissbadstrasse 8b · 9050 Appenzell · Schweiz · CHE-173.401.068"}</LocalizedText></small>
  </footer>;
}

export function ProductPreview({compact=false}:{compact?:boolean}={}) {
 return <LocalizedElement as="div" className={compact?"hero-workspace landing-phone-canvas":"hero-workspace"} aria-label="Binso One mit Beispieldaten">
  <div className="workspace-preview-bar"><span className="workspace-preview-brand"><Logo/></span><span className="workspace-preview-tools app-glass"><Icon name="search" size={17}/><Icon name="bell" size={17}/><span className="workspace-preview-avatar"><LocalizedText>{"BC"}</LocalizedText></span></span></div>
  <div className="workspace-preview-body"><div className="workspace-preview-heading"><div><small><LocalizedText>{"DEIN ARBEITSTAG"}</LocalizedText></small><h2><LocalizedText>{"Alles im Blick."}</LocalizedText></h2></div></div>
   <div className="workspace-preview-metrics">{[["Monatsumsatz","CHF 24’850","+12.4 %"],["Zahlungen","CHF 18’420","Dieser Monat"],["Rechnungen","18","Diesen Monat"],["Kunden","124","Gesamt"]].map(([label,value,note])=><div key={label}><span><LocalizedText>{label}</LocalizedText></span><strong>{value}</strong><small><LocalizedText>{note}</LocalizedText></small></div>)}</div>
   <div className="workspace-preview-section"><b><LocalizedText>{"Als Nächstes"}</LocalizedText></b><Link href="/demo"><LocalizedText>{"Alle anzeigen "}</LocalizedText><Icon name="arrow" size={13}/></Link></div>
   <div className="workspace-preview-records">{[["RE-2026-1042","Atelier Nord AG","CHF 3’450","Offen"],["RE-2026-1041","Berg & Partner GmbH","CHF 1’280","Bezahlt"],["RE-2026-1040","Studio West","CHF 2’160","Teilbezahlt"]].map(([number,name,amount,status])=><Link href="/demo" key={number}><span className="workspace-preview-record-icon"><Icon name="receipt" size={19}/></span><span><b>{number}</b><small translate="no">{name}</small></span><span><b>{amount}</b><small className={status==='Bezahlt'?'workspace-preview-paid':''}><LocalizedText>{status}</LocalizedText></small></span></Link>)}</div>
   <Link href="/demo" className="workspace-preview-timer"><span><Icon name="clock" size={18}/><span><b><LocalizedText>{"Zeiterfassung"}</LocalizedText></b><small><LocalizedText>{"Projekt Website"}</LocalizedText></small></span></span><strong>01:24:36</strong><Icon name="arrow" size={15}/></Link>
  </div>
  <div className="workspace-preview-navigation"><LocalizedElement as="nav" className="workspace-preview-dock app-glass" aria-label="Demo entdecken">{[["home","Start"],["users","Kunden"],["wallet","Finanzen"],["clock","Zeit"],["more","Mehr"]].map(([icon,label])=><Link href="/demo" key={label}><Icon name={icon} size={18}/><span><LocalizedText>{label}</LocalizedText></span></Link>)}</LocalizedElement><Button href="/demo" variant="ghost" ariaLabel="Demo starten" className="workspace-preview-create"><Icon name="plus"/></Button></div><small className="workspace-preview-caption"><LocalizedText>{"Beispieldaten · Entdecke alle Funktionen in der Demo"}</LocalizedText></small>
 </LocalizedElement>;
}

export function ProductScreen({title,variant="desktop"}:{route?:string;title:string;variant?:"desktop"|"mobile"}) {
  return <LocalizedElement as="figure" className={`product-screen product-screen-${variant}`} aria-label={title}><ProductPreview compact={variant==='mobile'}/></LocalizedElement>;
}

export function MarketingFaq({children}:{children:React.ReactNode}) {
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const root=ref.current;
    if(!root)return;
    const closeOthers=(event:Event)=>{
      const opened=event.target;
      if(!(opened instanceof HTMLDetailsElement)||!opened.open)return;
      for(const detail of root.querySelectorAll("details")){if(detail!==opened)detail.open=false;}
    };
    root.addEventListener("toggle",closeOthers,true);
    return()=>root.removeEventListener("toggle",closeOthers,true);
  },[]);
  return <div className="faq-list" ref={ref}>{children}</div>;
}
