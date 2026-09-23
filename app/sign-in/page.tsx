import { env } from '@/lib/config/env'
import { signInUrl } from '@/lib/auth/server'
import { BinsoLogo } from '@/components/ui/binso-logo'
import { AuthMethods } from '@/components/auth/auth-methods'

export default function SignInPage() {
  return (
    <main className="auth-page">
      <div className="auth-card apple-auth-card">
        <BinsoLogo />
        <h1>Anmelden</h1>
        <p className="muted">Mit E-Mail oder einem bestehenden Konto fortfahren.</p>
        {env.authMode === 'azure' ? (
          <>
            <AuthMethods />
            <a className="button primary" href={signInUrl('/post-login')}>Anmelden oder registrieren</a>
            <small className="auth-note">E-Mail-Verifikation und Passwort-Reset werden zentral und sicher verwaltet.</small>
          </>
        ) : (
          <a className="button primary" href="/post-login">Lokale Demo öffnen</a>
        )}
      </div>
    </main>
  )
}
