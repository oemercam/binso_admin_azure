"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, Icon, IconButton, Logo } from "./ui";

export function MarketingHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return <>
    <header className="marketing-header">
      <div className="marketing-nav">
        <Link href="/" onClick={() => setOpen(false)}><Logo /></Link>
        <nav>
          <Link href="/produkt">Produkt</Link>
          <Link href="/#funktionen">Funktionen</Link>
          <Link href="/preise">Preise</Link>
          <Link href="/#sicherheit">Sicherheit</Link>
        </nav>
        <div className="marketing-actions">
          <Link href="/login">Anmelden</Link>
          <Button href="/registrieren">30 Tage kostenlos testen</Button>
          <button className="marketing-menu-button" type="button" aria-label={open ? "Menü schliessen" : "Menü öffnen"} onClick={() => setOpen(!open)}>
            <Icon name={open ? "close" : "menu"} size={23}/>
          </button>
        </div>
      </div>
    </header>

    {open && <div className="marketing-mobile-menu">
      <nav>
        <Link href="/produkt" onClick={() => setOpen(false)}>Produkt <Icon name="arrow"/></Link>
        <Link href="/#funktionen" onClick={() => setOpen(false)}>Funktionen <Icon name="arrow"/></Link>
        <Link href="/preise" onClick={() => setOpen(false)}>Preise <Icon name="arrow"/></Link>
        <Link href="/#sicherheit" onClick={() => setOpen(false)}>Sicherheit <Icon name="arrow"/></Link>
      </nav>
      <div className="marketing-mobile-actions">
        <Button href="/login" variant="secondary">Anmelden</Button>
        <Button href="/registrieren">30 Tage kostenlos testen</Button>
        <Button href="/demo" variant="ghost">Demo ansehen</Button>
      </div>
      <small>Binso GmbH · Appenzell · Schweiz</small>
    </div>}
  </>;
}

export function MarketingFooter() {
  return <footer className="marketing-footer">
    <div><Logo/><p>Business-Software für Schweizer KMU.</p></div>
    <div className="footer-links">
      <Link href="/produkt">Produkt</Link>
      <Link href="/preise">Preise</Link>
      <Link href="/demo">Demo</Link>
      <Link href="/login">Anmelden</Link>
    </div>
    <small>© 2026 Binso GmbH · Weissbadstrasse 8b · 9050 Appenzell · Schweiz</small>
  </footer>;
}

export function ProductPreview() {
  return <div className="hero-preview">
    <div className="preview-window">
      <div className="preview-top"><Logo/><div className="fake-dots">•••</div></div>
      <div className="preview-body">
        <aside><span className="active">Übersicht</span><span>Kunden</span><span>Rechnungen</span><span>Zeiterfassung</span></aside>
        <main>
          <div className="preview-greeting"><div><small>Guten Morgen</small><h3>Thomas</h3></div><span className="avatar">TM</span></div>
          <div className="preview-metrics">
            <div><small>Umsatz</small><b>CHF 24’500</b></div>
            <div><small>Offene Rechnungen</small><b>8</b></div>
            <div><small>Kunden</small><b>42</b></div>
          </div>
          <div className="preview-chart"><div className="bars">{[38,58,44,77,64,88,70].map((h,i)=><i key={i} style={{height:`${h}%`}} />)}</div></div>
        </main>
      </div>
    </div>
    <div className="preview-phone">
      <div className="phone-top">9:41</div>
      <h4>Rechnungen</h4>
      {["Acme AG","Müller GmbH","Huber & Söhne"].map((x,i)=><div className="phone-row" key={x}><div><b>RE-2026-00{18-i}</b><span>{x}</span></div><strong>CHF {(2450-i*650).toLocaleString("de-CH")}.00</strong></div>)}
      <div className="phone-nav"><Icon name="home"/><Icon name="users"/><Icon name="receipt"/><Icon name="clock"/><Icon name="more"/></div>
    </div>
  </div>;
}