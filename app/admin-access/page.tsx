import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/server'
import { adminSignInUrl } from '@/lib/auth/urls'
import { env } from '@/lib/config/env'
import { PublicShell } from '@/components/public/public-shell'

export const dynamic = 'force-dynamic'

export default async function AdminAccessPage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const params = await searchParams
  const preview = env.authMode === 'local' && params.preview === '1'
  const session = await getSession()
  if (session?.user.platformRole && !preview) redirect('/platform')
  return (
    <PublicShell compact>
      <main className="v80-main v812-auth-page">
        <section className="v812-auth-layout admin">
          <div className="v812-auth-copy"><span className="v80-eyebrow">Binso Administration</span><h1>Interner Admin-Zugang.</h1><p>Dieser Zugang ist ausschliesslich für berechtigte Binso-Mitarbeitende und die Plattformverwaltung vorgesehen.</p><div className="v812-admin-visual"><span>01</span><strong>Microsoft-Anmeldung</strong><span>02</span><strong>Plattformrolle</strong><span>03</span><strong>Admin-Bereich</strong></div></div>
          <div className="v812-auth-card"><span className="v80-eyebrow">Admin-Zugang</span><h2>Binso Administration</h2><p>Melde dich mit deinem berechtigten Binso-Microsoft-Konto an.</p>{env.authMode === 'azure' ? <a className="button primary" href={adminSignInUrl('/platform')}>Mit Microsoft anmelden</a> : <a className="button primary" href="/platform">Lokalen Admin öffnen</a>}<div className="v812-divider"><span>Kunde?</span></div><p><Link href="/sign-in">Zum Kunden-Login →</Link></p></div>
        </section>
      </main>
    </PublicShell>
  )
}
