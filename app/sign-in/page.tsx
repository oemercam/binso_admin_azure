import Link from 'next/link'
import { redirect } from 'next/navigation'
import { env } from '@/lib/config/env'
import { getSession } from '@/lib/auth/server'
import { customerSignInUrl } from '@/lib/auth/urls'
import { publicMetadata } from '@/lib/config/seo'
import { PublicShell } from '@/components/public/public-shell'

export const dynamic = 'force-dynamic'
export const metadata = publicMetadata({ title: 'Kunden-Login', description: 'Als Kunde sicher bei Binso One anmelden.', path: '/sign-in' })

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const params = await searchParams
  const preview = env.authMode === 'local' && params.preview === '1'
  const session = await getSession()
  if (session && !preview) redirect('/post-login')

  return (
    <PublicShell compact>
      <main className="v80-main v812-auth-page entry-auth-page">
        <section className="v812-auth-layout v820-signin-layout">
          <div className="v812-auth-card v820-signin-card">
            <span className="v80-eyebrow">Kunden-Login</span>
            <h1>Anmelden</h1>
            <p>Melde dich mit deinem verifizierten Kundenkonto an. Passwort und Wiederherstellung werden sicher über Microsoft Entra External ID verwaltet.</p>
            {env.authMode === 'azure' ? <a className="button primary" href={customerSignInUrl('/post-login')}>Mit E-Mail anmelden</a> : <a className="button primary" href="/post-login">Lokale Demo öffnen</a>}
            <div className="v820-signin-links"><span>Noch kein Konto?</span><Link href="/register?mode=trial">30 Tage kostenlos testen</Link><Link href="/register?mode=demo">Demo ansehen</Link></div>
            <small>Interner Zugang für Binso Mitarbeitende: <Link href="/admin-access">Admin-Zugang</Link></small>
          </div>
        </section>
      </main>
    </PublicShell>
  )
}
