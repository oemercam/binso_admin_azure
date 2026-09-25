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
          <Link className="v80-login" href="/sign-in">Kundenlogin</Link>
          <Link className="v80-admin-link" href="/admin-access">Admin-Zugang</Link>
          <Link className="button primary v80-header-cta" href="/register">30 Tage kostenlos testen</Link>
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
  return (
    <section className="v812-page-intro">
      <span className="v80-eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </section>
  )
}

export function PublicCta() {
  return (
    <section className="v812-cta" aria-label="Binso One kostenlos testen">
      <div><span className="v80-eyebrow">Bereit für Binso One?</span><h2>Einfach starten. Erfolgreicher arbeiten.</h2><p>30 Tage kostenlos testen. Keine Zahlungsdaten beim Start.</p></div>
      <div className="v812-cta-actions"><Link className="button primary" href="/register">30 Tage kostenlos testen</Link><Link className="button secondary" href="/register?mode=demo">Demo ansehen</Link></div>
    </section>
  )
}
