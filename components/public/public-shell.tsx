import Link from 'next/link'
import type { ReactNode } from 'react'
import { PublicMobileMenu } from './public-mobile-menu'
import { BinsoLogo } from '@/components/ui/binso-logo'
import { appIdentity } from '@/lib/config/app-identity'
import { publicSite } from '@/lib/config/public-site'
import { CookieConsent, CookieSettingsButton } from './cookie-consent'

function BrandLink() {
  return (
    <Link className="public-brand" href="/" aria-label={`${appIdentity.name} Startseite`}>
      <BinsoLogo />
      <span className="public-product-name">ONE</span>
    </Link>
  )
}

export function PublicHeader() {
  return (
    <header className="public-header v78-public-header">
      <div className="public-header-inner">
        <BrandLink />
        <nav className="public-nav" aria-label="Hauptnavigation">
          {publicSite.primaryNavigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        </nav>
        <div className="public-header-actions">
          <Link className="public-login-link" href="/sign-in">Anmelden</Link>
          <Link className="button primary public-cta" href="/register">14 Tage testen</Link>
          <PublicMobileMenu />
        </div>
      </div>
    </header>
  )
}

export function PublicFooter() {
  return (
    <footer className="public-footer v78-public-footer v782-public-footer">
      <div className="public-footer-grid v782-footer-grid">
        <div className="public-footer-brand">
          <BrandLink />
          <p>{publicSite.footerDescription}</p>
          <small>Ein Produkt der {appIdentity.company}, {appIdentity.address.city}.</small>
        </div>
        <div><strong>Produkt</strong>{publicSite.productNavigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}</div>
        <div><strong>Hilfe</strong>{publicSite.helpNavigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}</div>
        <div><strong>Zugang</strong>{publicSite.accessNavigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}</div>
        <div><strong>Rechtliches</strong>{publicSite.legalNavigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}<CookieSettingsButton /></div>
      </div>
      <div className="public-footer-bottom v782-footer-bottom">
        <span>© {new Date().getFullYear()} {appIdentity.company}</span>
        <div>
          {publicSite.footerUtilityNavigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
          {publicSite.adminNavigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        </div>
      </div>
    </footer>
  )
}

export function PublicShell({ children, compact = false, light = true }: { children: ReactNode; compact?: boolean; light?: boolean }) {
  const classes = ['public-site', 'public-site-v78', 'public-site-v782', compact ? 'public-site-compact' : '', light ? 'public-site-light' : ''].filter(Boolean).join(' ')
  return <div className={classes}><PublicHeader />{children}<PublicFooter /><CookieConsent /></div>
}

export function PublicPageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="public-page-intro v78-page-intro"><span>{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>
}

export function PublicCta() {
  return (
    <section className="public-final-cta v78-final-cta">
      <div><span>Bereit für den nächsten Schritt?</span><h2>Teste Binso One 14 Tage und richte nur das ein, was du wirklich brauchst.</h2></div>
      <div className="public-final-cta-actions"><Link className="button primary" href="/register">14 Tage testen</Link><Link className="button secondary" href="/register?mode=demo">Produktdemo starten</Link><Link className="v79-final-pricing-link" href="/pricing">Preise ansehen →</Link></div>
    </section>
  )
}
