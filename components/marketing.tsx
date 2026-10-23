"use client";

import {LocalizedText,LocalizedElement,useTranslation} from "@/lib/client/locale";
import Link from "next/link";
import Image from "next/image";
import captures from "@/public/product/captures.json";
import {LocaleSwitcher} from "./locale-switcher";
import { useEffect, useState } from "react";
import { Button, Icon, Logo } from "./ui";
import {DetailTabs} from "./binso-ux";
import {PrivacySettingsButton} from "./privacy-settings-button";

export function ProductCapabilities(){
 return <div className="reference-capabilities">{['Kunden & Kontakte','Angebote & Rechnungen','Aufträge & Zeit','Schweizer QR-Rechnung'].map(label=><span key={label}><LocalizedText>{label}</LocalizedText></span>)}</div>;
}

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
      <div className="marketing-mobile-actions">
        <Button href="/login" variant="secondary"><LocalizedText>{"Anmelden"}</LocalizedText></Button>
        <Button href="/registrieren"><LocalizedText>{"14 Tage kostenlos testen"}</LocalizedText></Button>
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
 return <footer className="marketing-footer"><div className="footer-links">
  <Link href="/impressum"><LocalizedText>Impressum</LocalizedText></Link>
  <Link href="/datenschutz"><LocalizedText>Datenschutz</LocalizedText></Link>
  <Link href="/agb"><LocalizedText>AGB</LocalizedText></Link>
  <PrivacySettingsButton/>
  <Link href="/impressum#kontakt"><LocalizedText>Kontakt</LocalizedText></Link>
 </div><small>© 2026 <LocalizedText>Binso GmbH</LocalizedText>{" · "}<a href="https://binso.ch" target="_blank" rel="noreferrer"><LocalizedText verbatim>{"binso.ch ↗"}</LocalizedText></a></small></footer>;
}

const productViews=[['dashboard','Übersicht'],['customers','Kunden'],['offers','Angebote'],['invoices','Rechnungen'],['payments','Zahlungen'],['time','Zeiterfassung']] as const;
type ProductView=typeof productViews[number][0];

/** The ZIP's three feature views, using real isolated product captures. */
export function ReferenceFeatures(){
 const [view,setView]=useState<ProductView>('customers');
 const options=[['customers','Kunden & Verkauf'],['invoices','Finanzen'],['time','Zeit & Team']] as const;
 const copy={customers:['Jede Kundenbeziehung im Zusammenhang.','Kontaktdaten, Angebote, Rechnungen und Aufträge an einem Ort. Öffne das Kundendossier und arbeite direkt weiter.','Kontakt → Angebot → Auftrag'],invoices:['Wissen, was offen ist.','Behalte Rechnungen, Zahlungseingänge und offene Forderungen im Blick und öffne die passenden Vorgänge direkt.','Rechnung → Zahlung → Überblick'],time:['Leistungen erfassen. Gemeinsam weiterkommen.','Ordne Arbeitszeit und Leistungen dem passenden Kunden oder Auftrag zu und übernimm sie in die Abrechnung.','Auftrag → Zeit → Abrechnung']} as const;
 const content=copy[view as keyof typeof copy]??copy.customers;
 return <><DetailTabs label="Funktionen" role="tablist" panelId="reference-feature-panel">{options.map(([key,label])=><button key={key} type="button" className={view===key?'active':''} onClick={()=>setView(key)}><LocalizedText>{label}</LocalizedText></button>)}</DetailTabs><div className="reference-feature-area" id="reference-feature-panel" role="tabpanel" aria-labelledby={'reference-feature-panel-tab-'+options.findIndex(([key])=>key===view)}><div><h3><LocalizedText>{content[0]}</LocalizedText></h3><p className="reference-muted"><LocalizedText>{content[1]}</LocalizedText></p><span className="reference-check"><LocalizedText>{content[2]}</LocalizedText></span></div><ProductPreview screen={view}/></div></>;
}

/** Actual application captures; the provenance manifest names their fixture/commit. */
export function ProductPreview({compact=false,screen="dashboard"}:{compact?:boolean;screen?:ProductView}={}) {
 const translate=useTranslation(),group=captures.screens[screen],capture=compact?group.mobile:group.desktop;
 const label=productViews.find(([key])=>key===screen)![1];
 return <div className={compact?"product-capture product-capture-mobile":"product-capture product-capture-desktop"}>
  <Image src={capture.src} width={capture.width} height={capture.height} sizes={compact?"(max-width: 760px) 85vw, 310px":"(max-width: 760px) 100vw, 640px"} alt={translate(label)+" · "+translate("Binso One mit Beispieldaten")} preload={!compact}/><small className="product-capture-caption"><LocalizedText>{"Produktansicht in Deutsch · Beispieldaten"}</LocalizedText></small>
 </div>;
}
