"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, Icon, Logo } from "./ui";
import { LanguageSwitcher } from "./language-switcher";
import { useI18n } from "@/lib/i18n/provider";

export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  const {messages:m}=useI18n();

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
          <Link href="/produkt">{m.nav.products}</Link>
          <Link href="/#funktionen">{m.nav.features}</Link>
          <Link href="/preise">{m.nav.pricing}</Link>
        </nav>
        <div className="marketing-actions"><LanguageSwitcher compact/>
          <Link href="/portal/login">{m.nav.login}</Link>
          <Button href="/registrieren">{m.marketing.trial}</Button>
          <button className="marketing-menu-button" type="button" aria-label={open ? "Menü schliessen" : "Menü öffnen"} onClick={() => setOpen(!open)}>
            <span className={`menu-morph ${open ? "is-open" : ""}`} aria-hidden="true"><i/><i/><i/></span>
          </button>
        </div>
      </div>
    </header>

    {open && <div className="marketing-mobile-menu">
      <nav>
        <Link href="/produkt" onClick={() => setOpen(false)}>{m.nav.products} <Icon name="arrow"/></Link>
        <Link href="/#funktionen" onClick={() => setOpen(false)}>{m.nav.features} <Icon name="arrow"/></Link>
        <Link href="/preise" onClick={() => setOpen(false)}>{m.nav.pricing} <Icon name="arrow"/></Link>
      </nav>
      <div className="marketing-mobile-actions"><LanguageSwitcher/>
        <Button href="/portal/login" variant="secondary">{m.nav.login}</Button>
        <Button href="/registrieren">30 Tage kostenlos testen</Button>
        <Button href="/demo" variant="ghost">{m.marketing.demo}</Button>
      </div>
      <div className="marketing-mobile-social" aria-label="Binso Social Media">
        <a href="https://ch.linkedin.com/company/binsogmbh" target="_blank" rel="noreferrer" aria-label="Binso auf LinkedIn"><span aria-hidden="true">in</span></a>
        <span className="marketing-social-placeholder" aria-label="Instagram Profil folgt">◎</span>
        <span className="marketing-social-placeholder marketing-social-xing" aria-label="XING Profil folgt">X</span>
      </div>
      <div className="marketing-mobile-secondary">
        <Link href="/operator" onClick={() => setOpen(false)}>Admin</Link>
      </div>
      <small className="marketing-mobile-copyright">© 2026 <a href="https://binso.ch" target="_blank" rel="noreferrer">Binso GmbH</a></small>
    </div>}
  </>;
}

export function MarketingFooter() {
  return <footer className="marketing-footer">
    <div><Logo/><p>Business-Software für Schweizer KMU.</p></div>
    <div className="footer-links">
      <Link href="/produkt">Produkt</Link>
      <Link href="/preise">Preise</Link>
      <Link href="/#sicherheit">Sicherheit</Link>
      <Link href="/demo">Demo</Link>
      <Link href="/portal">Kundenportal</Link>
      <Link href="/portal/login">Anmelden</Link>
      <Link href="/operator">Admin</Link>
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
