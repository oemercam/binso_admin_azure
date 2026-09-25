import Link from 'next/link'
import { PublicPageIntro, PublicShell } from '@/components/public/public-shell'
import { ContactForm } from '@/components/public/contact-form'
import { appIdentity } from '@/lib/config/app-identity'
import { publicMetadata } from '@/lib/config/seo'

export const metadata = publicMetadata({ title: 'Kontakt', description: 'Kontaktiere Binso digital bei Fragen zu Binso One, Pilot, Einführung oder Zusammenarbeit.', path: '/contact' })

export default function ContactPage() {
  return (
    <PublicShell>
      <main className="public-main public-main-narrow">
        <PublicPageIntro eyebrow="Kontakt" title="Sprich mit Binso." description="Fragen zu Binso One, Pilot, Einführung oder Zusammenarbeit beantworten wir digital." />
        <section className="public-contact-card">
          <div>
            <span>Unternehmen</span>
            <strong>{appIdentity.company}</strong>
            <p>{appIdentity.address.street}<br />{appIdentity.address.postalCode} {appIdentity.address.city}<br />{appIdentity.address.country}</p>
          </div>
          <div>
            <span>E-Mail</span><a href={`mailto:${appIdentity.supportEmail}`}>{appIdentity.supportEmail}</a>
            <span>Bereits Kunde?</span><Link href="/support">Support in Binso One →</Link>
          </div>
        </section>
        <section className="public-contact-form-section">
          <h2>Nachricht senden</h2>
          <p>Für Supportfälle bestehender Kunden ist der Supportbereich in Binso One der schnellste Weg.</p>
          <ContactForm />
        </section>
      </main>
    </PublicShell>
  )
}
