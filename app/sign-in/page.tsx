import Link from 'next/link'
import { redirect } from 'next/navigation'
import { env } from '@/lib/config/env'
import { getSession } from '@/lib/auth/server'
import { customerSignInUrl } from '@/lib/auth/urls'
import { BinsoLogo } from '@/components/ui/binso-logo'
import { publicMetadata } from '@/lib/config/seo'

export const dynamic = 'force-dynamic'
export const metadata = publicMetadata({ title: 'Kunden-Login', description: 'Als Kunde sicher bei Binso One anmelden.', path: '/sign-in' })

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const params = await searchParams
  const preview = env.authMode === 'local' && params.preview === '1'
  const session = await getSession()
  if (session && !preview) redirect('/post-login')

  return (
    <main className="entry-auth-page v78-customer-login">
      <section className="entry-auth-brand-panel">
        <Link className="entry-auth-brand" href="/" aria-label="Binso One Startseite"><BinsoLogo /><span>ONE</span></Link>
        <div className="entry-auth-brand-copy"><span>Binso One</span><h1>Dein Arbeitsbereich wartet.</h1><p>Kunden, Angebote, Aufträge, Zeiten und Rechnungen bleiben in einem klaren Ablauf verbunden.</p></div>
        <div className="entry-auth-points"><span>Kunden-Login</span><span>Sicher über den konfigurierten Identitätsdienst</span><span>Direkt in deinen Arbeitsbereich</span></div>
      </section>
      <section className="entry-auth-login-panel">
        <Link className="entry-auth-back" href="/">← Zur Startseite</Link>
        <div className="entry-auth-card v78-login-card">
          <span className="public-eyebrow">Kunden-Login</span>
          <h2>Bei Binso One anmelden</h2>
          <p>Öffne den sicheren Kunden-Login. Dort verwendest du die für dein Kundenkonto freigeschaltete Anmeldemethode.</p>
          {env.authMode === 'azure' ? <a className="button primary entry-auth-primary" href={customerSignInUrl('/post-login')}>Zum Kunden-Login</a> : <a className="button primary entry-auth-primary" href="/post-login">Lokale Demo öffnen</a>}
          <div className="entry-auth-separator"><span>oder</span></div>
          <p className="entry-auth-register">Noch kein Konto? <Link href="/register">Konto erstellen</Link></p>
          <small>Du arbeitest bei Binso? Der <Link href="/admin-access">Admin-Zugang</Link> ist separat.</small>
        </div>
        <footer className="entry-auth-legal"><Link href="/legal/privacy">Datenschutz</Link><Link href="/legal/terms">AGB</Link><Link href="/legal/imprint">Impressum</Link></footer>
      </section>
    </main>
  )
}
