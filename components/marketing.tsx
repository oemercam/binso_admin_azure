"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, Icon, Logo } from "./ui";

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
          <Link href="/produkt">Produkt</Link>
          <Link href="/#funktionen">Funktionen</Link>
          <Link href="/preise">Preise</Link>
        </nav>
        <div className="marketing-actions">
          <Link href="/portal/login">Anmelden</Link>
          <Button href="/registrieren">30 Tage kostenlos testen</Button>
          <button className="marketing-menu-button" type="button" aria-label={open ? "Menü schliessen" : "Menü öffnen"} onClick={() => setOpen(!open)}>
            <span className={`menu-morph ${open ? "is-open" : ""}`} aria-hidden="true"><i/><i/><i/></span>
          </button>
        </div>
      </div>
    </header>

    {open && <div className="marketing-mobile-menu">
      <nav>
        <Link href="/produkt" onClick={() => setOpen(false)}>Produkt <Icon name="arrow"/></Link>
        <Link href="/#funktionen" onClick={() => setOpen(false)}>Funktionen <Icon name="arrow"/></Link>
        <Link href="/preise" onClick={() => setOpen(false)}>Preise <Icon name="arrow"/></Link>
      </nav>
      <div className="marketing-mobile-actions">
        <Button href="/portal/login" variant="secondary">Anmelden</Button>
        <Button href="/registrieren">30 Tage kostenlos testen</Button>
        <Button href="/demo" variant="ghost">Demo starten</Button>
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
  return <div className="hero-product-preview" aria-label="Echte Binso One Produktansicht">
    <div className="hero-product-desktop"><img src="/product/binso-one-dashboard-mobile.jpg" alt="Binso One Dashboard in der aktuellen mobilen Oberfläche"/></div>
    <div className="hero-product-mobile"><img src="/product/binso-one-dashboard-mobile.jpg" alt="" aria-hidden="true"/></div>
  </div>;
}

const productScreens:Record<string,string>={
  "/preview/dashboard":"/product/binso-one-dashboard-mobile.jpg",
  "/preview/rechnungen":"/product/binso-one-dashboard-mobile.jpg",
  "/preview/zeit":"/product/binso-one-dashboard-mobile.jpg",
};

export function ProductScreen({route="/preview/dashboard",title,variant="desktop"}:{route?:string;title:string;variant?:"desktop"|"mobile"}) {
  return <figure className={`product-screen product-screen-${variant}`}>
    <img src={productScreens[route]??productScreens["/preview/dashboard"]} alt={title} loading="lazy" decoding="async"/>
  </figure>;
}
