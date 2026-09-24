import Link from 'next/link'
import { redirect } from 'next/navigation'
import { env } from '@/lib/config/env'
import { getSession, signInUrl } from '@/lib/auth/server'
import { registerUrl } from '@/lib/auth/urls'
import { BinsoLogo } from '@/components/ui/binso-logo'

export const dynamic = 'force-dynamic'

export default async function SignInPage() {
  const session = await getSession()
  if (session) redirect('/post-login')

  return (
    <main className="auth-page product-auth-page">
      <aside className="auth-product-panel" aria-label="Binso One Produktinformation">
        <Link className="auth-back-home" href="/">← Zur Startseite</Link>
        <div className="auth-product-copy">
          <div className="product-auth-brand auth-product-brand">
            <BinsoLogo />
            <span className="product-auth-name">One</span>
          </div>
          <span className="public-eyebrow">Business-Plattform</span>
          <h1>Dein Unternehmen.<br />Eine Plattform.</h1>
          <p>Kunden, Angebote, Aufträge, Zeit und Rechnungen in einer klaren Arbeitsumgebung.</p>
          <div className="auth-product-points">
            <span>Durchgängige Geschäftsprozesse</span>
            <span>Für Desktop, Mobile und PWA</span>
            <span>Rollenbasierte Unternehmenszugriffe</span>
          </div>
        </div>
        <small>Binso One · Ein Produkt der Binso GmbH</small>
      </aside>

      <section className="auth-login-panel">
        <div className="auth-mobile-brand product-auth-brand">
          <BinsoLogo />
          <span className="product-auth-name">One</span>
        </div>
        <div className="auth-card product-auth-card" aria-labelledby="sign-in-title">
          <div className="product-auth-copy">
            <p className="product-auth-eyebrow">Willkommen zurück</p>
            <h2 id="sign-in-title">Bei Binso One anmelden</h2>
            <p className="product-auth-lead">Melde dich sicher an, um mit deinem Unternehmen weiterzuarbeiten.</p>
          </div>

          {env.authMode === 'azure' ? (
            <div className="product-auth-actions">
              <a className="button primary product-auth-primary" href={signInUrl('/post-login')}>Anmelden</a>
              <p className="auth-register-prompt">Noch kein Konto? <a href={registerUrl()}>Konto erstellen</a></p>
            </div>
          ) : (
            <a className="button primary product-auth-primary" href="/post-login">Lokale Demo öffnen</a>
          )}

          <div className="auth-login-meta">
            <Link href="/support">Hilfe bei der Anmeldung</Link>
            <span>·</span>
            <Link href="/legal/privacy">Datenschutz</Link>
          </div>
        </div>
        <small className="auth-app-caption">Binso One wird von Binso GmbH entwickelt und betrieben.</small>
      </section>
    </main>
  )
}
