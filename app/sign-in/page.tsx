import { env } from '@/lib/config/env'
import { signInUrl } from '@/lib/auth/server'
import { BinsoLogo } from '@/components/ui/binso-logo'

export default function SignInPage() {
  return (
    <main className="auth-page">
      <div className="auth-card apple-auth-card">
        <BinsoLogo />
        <h1>Binso Admin</h1>
        <p className="muted">Mit deinem Firmenkonto anmelden.</p>
        {env.authMode === 'azure'
          ? <a className="button primary" href={signInUrl('/dashboard')}>Mit Microsoft anmelden</a>
          : <a className="button primary" href="/dashboard">Lokale Demo öffnen</a>}
      </div>
    </main>
  )
}
