import Link from 'next/link'
import { redirect } from 'next/navigation'
import { env } from '@/lib/config/env'
import { getSession, signInUrl } from '@/lib/auth/server'
import { BinsoLogo } from '@/components/ui/binso-logo'
import { publicMetadata } from '@/lib/config/seo'

export const dynamic = 'force-dynamic'
export const metadata = publicMetadata({ title: 'Anmelden', description: 'Bei Binso One sicher anmelden.', path: '/sign-in' })

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const params = await searchParams
  const preview = env.authMode === 'local' && params.preview === '1'
  const session = await getSession()
  if (session && !preview) redirect('/post-login')

  return (
    <main className="entry-auth-page">
      <section className="entry-auth-brand-panel">
        <Link className="entry-auth-brand" href="/" aria-label="Binso One Startseite">
          <BinsoLogo />
          <span>ONE</span>
        </Link>
        <div className="entry-auth-brand-copy">
          <span>Binso One</span>
          <h1>Zurück an die Arbeit.</h1>
          <p>Kunden, Angebote, Aufträge, Zeiten und Rechnungen in einer gemeinsamen Arbeitsumgebung.</p>
        </div>
        <div className="entry-auth-points">
          <span>Sichere Anmeldung</span>
          <span>Keine separaten Binso-Passwörter</span>
          <span>Direkt in deinen Arbeitsbereich</span>
        </div>
      </section>

      <section className="entry-auth-login-panel">
        <Link className="entry-auth-back" href="/">← Zur Startseite</Link>
        <div className="entry-auth-card">
          <span className="public-eyebrow">Anmelden</span>
          <h2>Binso One öffnen</h2>
          <p>Melde dich mit dem Microsoft-Konto an, das mit deinem Binso-One-Zugang verknüpft ist.</p>
          {env.authMode === 'azure' ? (
            <a className="button primary entry-auth-primary" href={signInUrl('/post-login')}>
              Mit Microsoft anmelden
            </a>
          ) : (
            <a className="button primary entry-auth-primary" href="/post-login">
              Lokale Demo öffnen
            </a>
          )}
          <div className="entry-auth-separator"><span>oder</span></div>
          <p className="entry-auth-register">Noch kein Konto? <Link href="/register">Konto erstellen</Link></p>
          <small>Bei Problemen mit dem Zugang findest du Hilfe unter <Link href="/support">Support</Link>.</small>
        </div>
        <footer className="entry-auth-legal">
          <Link href="/legal/privacy">Datenschutz</Link>
          <Link href="/legal/terms">AGB</Link>
          <Link href="/legal/imprint">Impressum</Link>
        </footer>
      </section>
    </main>
  )
}
