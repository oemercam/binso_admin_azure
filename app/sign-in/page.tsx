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
    <main className="auth-page">
      <div className="auth-card apple-auth-card">
        <BinsoLogo />
        <h1>Willkommen bei Binso</h1>
        <p className="muted">Melde dich an, um mit deiner Organisation weiterzuarbeiten.</p>
        {env.authMode === 'azure' ? (
          <>
            <a className="button primary" href={signInUrl('/post-login')}>Anmelden</a>
            <p className="auth-register-prompt">
              Noch kein Konto? <a href={registerUrl()}>Registrieren</a>
            </p>
            <small className="auth-note">Anmeldung, E-Mail-Verifikation und Kontosicherheit werden über den zentralen Binso-Anmeldedienst verwaltet.</small>
          </>
        ) : (
          <a className="button primary" href="/post-login">Lokale Demo öffnen</a>
        )}
      </div>
    </main>
  )
}
