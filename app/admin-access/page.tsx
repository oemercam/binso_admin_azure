import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/server'
import { adminSignInUrl } from '@/lib/auth/urls'
import { env } from '@/lib/config/env'
import { BinsoLogo } from '@/components/ui/binso-logo'

export const dynamic = 'force-dynamic'

export default async function AdminAccessPage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const params = await searchParams
  const preview = env.authMode === 'local' && params.preview === '1'
  const session = await getSession()
  if (session?.user.platformRole && !preview) redirect('/platform')
  return (
    <main className="entry-auth-page v78-admin-login">
      <section className="entry-auth-brand-panel admin"><Link className="entry-auth-brand" href="/" aria-label="Binso One Startseite"><BinsoLogo /><span>ONE</span></Link><div className="entry-auth-brand-copy"><span>Binso GmbH</span><h1>Interner Admin-Zugang.</h1><p>Dieser Zugang ist ausschliesslich für berechtigte Binso-Mitarbeitende und die Plattformverwaltung vorgesehen.</p></div><div className="entry-auth-points"><span>Interner Zugang</span><span>Microsoft-Anmeldung</span><span>Plattformrollen erforderlich</span></div></section>
      <section className="entry-auth-login-panel"><Link className="entry-auth-back" href="/">← Zur Startseite</Link><div className="entry-auth-card v78-login-card"><span className="public-eyebrow">Admin-Zugang</span><h2>Binso Administration</h2><p>Melde dich mit deinem berechtigten Binso-Microsoft-Konto an. Kunden verwenden den normalen Kunden-Login.</p>{env.authMode === 'azure' ? <a className="button primary entry-auth-primary" href={adminSignInUrl('/platform')}>Mit Microsoft anmelden</a> : <a className="button primary entry-auth-primary" href="/platform">Lokalen Admin öffnen</a>}<div className="entry-auth-separator"><span>Kunde?</span></div><p className="entry-auth-register"><Link href="/sign-in">Zum Kunden-Login</Link></p></div><footer className="entry-auth-legal"><Link href="/legal/privacy">Datenschutz</Link><Link href="/legal/imprint">Impressum</Link></footer></section>
    </main>
  )
}
