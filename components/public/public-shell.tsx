import Link from 'next/link'
import type { ReactNode } from 'react'
import { BinsoLogo } from '@/components/ui/binso-logo'
import { CookieConsent, CookieSettingsButton } from './cookie-consent'

const primaryNavigation = [
  { href: '/features', label: 'Funktionen' },
  { href: '/how-it-works', label: 'So funktioniert es' },
  { href: '/pricing', label: 'Preise' },
  { href: '/security', label: 'Sicherheit' },
  { href: '/faq', label: 'FAQ' },
]

export function PublicHeader() {
  return (
    <header className="public-header">
      <div className="public-header-inner">
        <Link className="public-brand" href="/" aria-label="Binso One Startseite">
          <BinsoLogo />
          <span>One</span>
        </Link>
        <nav className="public-nav" aria-label="Hauptnavigation">
          {primaryNavigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        </nav>
        <div className="public-header-actions">
          <Link className="public-login-link" href="/sign-in">Anmelden</Link>
          <Link className="button primary public-cta" href="/register">Kostenlos starten</Link>
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
          <Link className="public-brand" href="/">
            <BinsoLogo />
            <span>One</span>
          </Link>
          <p>Die Business-Plattform für Kunden, Angebote, Aufträge, Zeit, Rechnungen und Zusammenarbeit.</p>
          <small>Ein Produkt der Binso GmbH, Appenzell.</small>
        </div>
        <div>
          <strong>Produkt</strong>
          <Link href="/features">Funktionen</Link>
          <Link href="/how-it-works">So funktioniert es</Link>
          <Link href="/pricing">Preise</Link>
          <Link href="/security">Sicherheit</Link>
          <Link href="/status">Systemstatus</Link>
        </div>
        <div>
          <strong>Hilfe</strong>
          <Link href="/faq">FAQ</Link>
          <Link href="/support">Support</Link>
          <Link href="/contact">Kontakt</Link>
          <Link href="/sign-in">Anmelden</Link>
          <Link href="/register">Registrieren</Link>
        </div>
        <div>
          <strong>Rechtliches</strong>
          <Link href="/legal/terms">AGB</Link>
          <Link href="/legal/privacy">Datenschutz</Link>
          <Link href="/legal/cookies">Cookies</Link>
          <Link href="/legal/imprint">Impressum</Link>
          <CookieSettingsButton />
        </div>
      </div>
      <div className="public-footer-bottom">
        <span>© {new Date().getFullYear()} Binso GmbH</span>
        <span>Binso One</span>
      </div>
    </footer>
  )
}

export function PublicShell({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  return (
    <div className={compact ? 'public-site public-site-compact' : 'public-site'}>
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
