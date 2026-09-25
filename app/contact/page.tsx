import Link from 'next/link'
import { PublicPageIntro, PublicShell } from '@/components/public/public-shell'
import { ContactForm } from '@/components/public/contact-form'
import { appIdentity } from '@/lib/config/app-identity'
import { publicMetadata } from '@/lib/config/seo'

export const metadata = publicMetadata({ title: 'Kontakt', description: 'Kontaktiere Binso digital bei Fragen zu Binso One, Pilot, Einführung oder Zusammenarbeit.', path: '/contact' })

export default function ContactPage() {
  return (
    <PublicShell>
      <main className="v80-main v812-page">
        <PublicPageIntro eyebrow="Kontakt" title="Sprich mit Binso." description="Fragen zu Binso One, Einführung oder Zusammenarbeit beantworten wir direkt und unkompliziert." />
        <section className="v812-contact-layout">
          <div className="v812-contact-copy"><span className="v80-eyebrow">Binso GmbH</span><h2>Wir sind für dich da.</h2><p>{appIdentity.address.street}<br />{appIdentity.address.postalCode} {appIdentity.address.city}<br />{appIdentity.address.country}</p><a href={`mailto:${appIdentity.supportEmail}`}>{appIdentity.supportEmail}</a><Link href="/support">Bereits Kunde? Zum Support →</Link></div>
          <div className="v812-form-card"><h2>Nachricht senden</h2><p>Wir melden uns so schnell wie möglich.</p><ContactForm /></div>
        </section>
      </main>
    </PublicShell>
  )
}
