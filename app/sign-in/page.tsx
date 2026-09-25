import Link from 'next/link'
import { redirect } from 'next/navigation'
import { env } from '@/lib/config/env'
import { getSession } from '@/lib/auth/server'
import { customerSignInUrl } from '@/lib/auth/urls'
import { publicMetadata } from '@/lib/config/seo'
import { PublicShell } from '@/components/public/public-shell'
import { MarketingScreenshot } from '@/components/public/marketing-screenshot'

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
        <section className="v812-auth-layout">
          <div className="v812-auth-copy"><span className="v80-eyebrow">Kundenlogin</span><h1>Willkommen zurück.</h1><p>Melde dich sicher an und öffne deinen Binso One Arbeitsbereich.</p><div className="v812-auth-visual"><MarketingScreenshot name="dashboard" desktopOnly /></div></div>
          <div className="v812-auth-card"><span className="v80-eyebrow">Binso One</span><h2>Bei Binso One anmelden</h2><p>Verwende die für dein Kundenkonto freigeschaltete Anmeldemethode.</p>{env.authMode === 'azure' ? <a className="button primary" href={customerSignInUrl('/post-login')}>Zum Kunden-Login</a> : <a className="button primary" href="/post-login">Lokale Demo öffnen</a>}<div className="v812-divider"><span>oder</span></div><p>Noch kein Konto? <Link href="/register">30 Tage kostenlos testen</Link></p><small>Du arbeitest bei Binso? <Link href="/admin-access">Admin-Zugang</Link></small></div>
        </section>
      </main>
    </PublicShell>
  )
}
