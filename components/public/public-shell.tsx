import Link from 'next/link'
import type { ReactNode } from 'react'
import { PublicMobileMenu } from './public-mobile-menu'
import { BinsoLogo } from '@/components/ui/binso-logo'
import { appIdentity } from '@/lib/config/app-identity'
import { publicSite } from '@/lib/config/public-site'
import { CookieConsent, CookieSettingsButton } from './cookie-consent'

function BrandLink() {
  return (
    <Link className="v80-brand" href="/" aria-label={`${appIdentity.name} Startseite`}>
      <BinsoLogo />
      <span>ONE</span>
    </Link>
  )
}

export function PublicHeader() {
  return (
    <header className="v80-header">
      <div className="v80-header-inner">
        <BrandLink />
        <nav className="v80-desktop-nav" aria-label="Hauptnavigation">
          {publicSite.primaryNavigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        </nav>
        <div className="v80-header-actions">
          <Link className="v80-login" href="/sign-in">Anmelden</Link>
          <Link className="button primary v80-header-cta" href="/register">14 Tage testen</Link>
          <PublicMobileMenu />
        </div>
      </div>
    </header>
  )
}

export function PublicFooter() {
  return (
    <footer className="v80-footer">
      <div className="v80-footer-main">
        <div className="v80-footer-brand">
          <BrandLink />
          <p>{publicSite.footerDescription}</p>
          <small>{appIdentity.company} · {appIdentity.address.city}</small>
        </div>
        <nav className="v80-footer-group" aria-label="Produkt"><strong>Produkt</strong>{publicSite.productNavigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}</nav>
        <nav className="v80-footer-group" aria-label="Hilfe"><strong>Hilfe</strong>{publicSite.helpNavigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}</nav>
        <nav className="v80-footer-group" aria-label="Zugang"><strong>Zugang</strong>{publicSite.accessNavigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}{publicSite.adminNavigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}</nav>
        <nav className="v80-footer-group" aria-label="Rechtliches"><strong>Rechtliches</strong>{publicSite.legalNavigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}<CookieSettingsButton /></nav>
      </div>
      <div className="v80-footer-bottom">
        <span>© {new Date().getFullYear()} {appIdentity.company}</span>
        <div>{publicSite.footerUtilityNavigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}</div>
      </div>
    </footer>
  )
}

export function PublicShell({ children, compact = false }: { children: ReactNode; compact?: boolean; light?: boolean }) {
  const classes = ['public-site-v80', compact ? 'public-site-v80-compact' : ''].filter(Boolean).join(' ')
  return <div className={classes}><PublicHeader />{children}<PublicFooter /><CookieConsent /></div>
}

export function PublicPageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="v80-page-intro"><span className="v80-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>
}

export function PublicCta() {
  return (
    <section className="v80-final-cta">
      <div><span className="v80-eyebrow">Bereit für den nächsten Schritt?</span><h2>Starte schlank und ergänze nur, was dein Team wirklich braucht.</h2><p>14 Tage testen, ohne beim Einstieg unnötige Angaben auszufüllen.</p></div>
      <div className="v80-final-cta-actions"><Link className="button primary" href="/register">14 Tage testen</Link><Link className="v80-text-link" href="/pricing">Preise ansehen →</Link></div>
    </section>
  )
}
