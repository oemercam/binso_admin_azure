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
      <section className="auth-card apple-auth-card product-auth-card" aria-labelledby="sign-in-title">
        <header className="product-auth-brand">
          <BinsoLogo />
          <span className="product-auth-name">One</span>
        </header>

        <div className="product-auth-copy">
          <p className="product-auth-eyebrow">Business-Plattform</p>
          <h1 id="sign-in-title">Willkommen bei Binso One</h1>
          <p className="product-auth-lead">Melde dich an, um deine Organisation zu verwalten.</p>
        </div>

        {env.authMode === 'azure' ? (
          <div className="product-auth-actions">
            <a className="button primary product-auth-primary" href={signInUrl('/post-login')}>Anmelden</a>
            <p className="auth-register-prompt">
              Noch kein Konto? <a href={registerUrl()}>Konto erstellen</a>
            </p>
          </div>
        ) : (
          <a className="button primary product-auth-primary" href="/post-login">Lokale Demo öffnen</a>
        )}

        <footer className="product-auth-footer">
          <span>Binso One</span> wird von Binso GmbH entwickelt und betrieben.
        </footer>
      </section>
    </main>
  )
}
