"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, Icon, Logo } from "./ui";

export function MarketingHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.removeAttribute("data-theme");
  }, []);

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
        <Button href="/demo" variant="ghost">Demo starten</Button>
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
  return <div className="hero-product-preview" aria-label="Binso One Produktvorschau">
    <div className="hero-product-desktop" aria-hidden="true">
      <iframe src="/preview/dashboard" title="Binso One Desktop Vorschau" tabIndex={-1}/>
    </div>
    <div className="hero-product-mobile" aria-hidden="true">
      <iframe src="/preview/dashboard" title="Binso One Mobile Vorschau" tabIndex={-1}/>
    </div>
  </div>;
}
