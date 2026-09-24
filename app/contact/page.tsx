import Link from 'next/link'
import { PublicPageIntro, PublicShell } from '@/components/public/public-shell'
import { appIdentity } from '@/lib/config/app-identity'
import { createPublicMetadata } from '@/lib/config/seo'

export const metadata = createPublicMetadata({
  title: 'Kontakt',
  description: 'Kontakt zu Binso für Fragen zu Binso One, Preisen, Einführung, Enterprise-Anforderungen und Support.',
  path: '/contact',
  keywords: ['Binso Kontakt', 'Binso One Beratung', 'Business Software Schweiz Kontakt'],
})

export default function ContactPage() {
  return (
    <PublicShell>
      <main className="public-main public-main-narrow">
        <PublicPageIntro eyebrow="Kontakt" title="Sprich direkt mit Binso." description="Fragen zu Binso One, Plänen, Einführung oder Zusammenarbeit beantworten wir direkt. Für technische Anliegen bestehender Kunden steht zusätzlich der digitale Support bereit." />

        <section className="public-contact-options" aria-label="Kontaktmöglichkeiten">
          <article>
            <span>Produkt und Preise</span>
            <h2>Binso One kennenlernen</h2>
            <p>Für Fragen zu Funktionen, Plänen, Einführung oder Enterprise-Anforderungen.</p>
            <a href={`mailto:${appIdentity.supportEmail}`}>{appIdentity.supportEmail} →</a>
          </article>
          <article>
            <span>Support</span>
            <h2>Hilfe als Kunde</h2>
            <p>Angemeldete Kunden können Anliegen mit Kontext direkt als Supportfall erfassen.</p>
            <Link href="/support">Zum Support →</Link>
          </article>
          <article>
            <span>Telefon</span>
            <h2>Direkt sprechen</h2>
            <p>Für eine direkte Kontaktaufnahme erreichst du Binso unter der angegebenen Geschäftsnummer.</p>
            <a href={appIdentity.phoneHref}>{appIdentity.phoneDisplay} →</a>
          </article>
        </section>

        <section className="public-contact-card">
          <div>
            <span>Unternehmen</span>
            <strong>{appIdentity.company}</strong>
            <p>{appIdentity.address.street}<br />{appIdentity.address.postalCode} {appIdentity.address.city}<br />{appIdentity.address.country}</p>
          </div>
          <div>
            <span>E-Mail</span><a href={`mailto:${appIdentity.supportEmail}`}>{appIdentity.supportEmail}</a>
            <span>Telefon</span><a href={appIdentity.phoneHref}>{appIdentity.phoneDisplay}</a>
          </div>
        </section>
      </main>
    </PublicShell>
  )
}
