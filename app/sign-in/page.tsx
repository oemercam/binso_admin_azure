import Link from 'next/link'
import { redirect } from 'next/navigation'
import { env } from '@/lib/config/env'
import { getSession, signInUrl } from '@/lib/auth/server'
import { BinsoLogo } from '@/components/ui/binso-logo'

export const dynamic = 'force-dynamic'

export default async function SignInPage() {
  const session = await getSession()
  if (session) redirect('/post-login')
  if (env.authMode === 'azure') redirect(signInUrl('/post-login'))

  return (
    <main className="auth-page product-auth-page">
      <section className="auth-login-panel auth-login-panel-local">
        <Link className="auth-back-home" href="/">← Zur Startseite</Link>
        <div className="auth-mobile-brand product-auth-brand">
          <BinsoLogo />
          <span className="product-auth-name">ONE</span>
        </div>
        <div className="auth-card product-auth-card">
          <div className="product-auth-copy">
            <p className="product-auth-eyebrow">Lokale Entwicklung</p>
            <h1>Binso One öffnen</h1>
            <p className="product-auth-lead">Diese Ansicht wird nur im lokalen Entwicklungsmodus verwendet.</p>
          </div>
          <a className="button primary product-auth-primary" href="/post-login">Lokale Demo öffnen</a>
        </div>
      </section>
    </main>
  )
}
