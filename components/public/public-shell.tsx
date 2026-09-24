import Link from 'next/link'
import type { ReactNode } from 'react'
import { BinsoLogo } from '@/components/ui/binso-logo'
import { appIdentity } from '@/lib/config/app-identity'
import { publicSite } from '@/lib/config/public-site'
import { CookieConsent, CookieSettingsButton } from './cookie-consent'

function BrandLink() {
  return (
    <Link className="public-brand" href="/" aria-label={`${appIdentity.name} Startseite`}>
      <BinsoLogo />
    </Link>
  )
}

export function PublicHeader() {
  return (
    <header className="public-header">
      <div className="public-header-inner">
        <BrandLink />
        <nav className="public-nav" aria-label="Hauptnavigation">
          {publicSite.primaryNavigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        </nav>
        <div className="public-header-actions">
          <Link className="public-login-link" href="/sign-in">Anmelden</Link>
          <Link className="button primary public-cta" href="/register">Kostenlos starten</Link>
          <details className="public-mobile-menu">
            <summary aria-label="Navigation öffnen">Menü</summary>
            <nav aria-label="Mobile Navigation">
              {publicSite.primaryNavigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
              <Link href="/support">Support</Link>
              <Link href="/contact">Kontakt</Link>
              <Link href="/sign-in">Anmelden</Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  )
}

export function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="public-footer-grid">
        <div className="public-footer-brand">
          <BrandLink />
          <p>{publicSite.footerDescription}</p>
          <small>Ein Produkt der {appIdentity.company}, {appIdentity.address.city}.</small>
        </div>
        <div>
          <strong>Produkt</strong>
          {publicSite.productNavigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        </div>
        <div>
          <strong>Hilfe</strong>
          {publicSite.helpNavigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        </div>
        <div>
          <strong>Rechtliches</strong>
          {publicSite.legalNavigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
          <CookieSettingsButton />
        </div>
      </div>
      <div className="public-footer-bottom">
        <span>© {new Date().getFullYear()} {appIdentity.company}</span>
        <span>{appIdentity.name}</span>
      </div>
    </footer>
  )
}

export function PublicShell({ children, compact = false, light = false }: { children: ReactNode; compact?: boolean; light?: boolean }) {
  const classes = ['public-site', compact ? 'public-site-compact' : '', light ? 'public-site-light' : ''].filter(Boolean).join(' ')
  return (
    <div className={classes}>
      <PublicHeader />
      {children}
      <PublicFooter />
      <CookieConsent />
    </div>
  )
}

export function PublicPageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="public-page-intro">
      <span>{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  )
}

export function PublicCta() {
  return (
    <section className="public-final-cta">
      <div>
        <span>Bereit für den nächsten Schritt?</span>
        <h2>Starte mit Binso One und richte dein Unternehmen in wenigen Schritten ein.</h2>
      </div>
      <div className="public-final-cta-actions">
        <Link className="button primary" href="/register">Kostenlos starten</Link>
        <Link className="button secondary" href="/pricing">Preise ansehen</Link>
      </div>
    </section>
  )
}
