import Link from 'next/link'
import { PublicPageIntro, PublicShell } from '@/components/public/public-shell'
import { ContactForm } from '@/components/public/contact-form'
import { appIdentity } from '@/lib/config/app-identity'
import { publicMetadata } from '@/lib/config/seo'

export const metadata = publicMetadata({ title: 'Kontakt', description: 'Kontaktiere Binso bei allgemeinen Fragen, Support, Verkauf, Datenschutz, Sicherheit oder Abrechnung.', path: '/contact' })

export default function ContactPage() {
  return <PublicShell><main className="v80-main v812-page">
    <PublicPageIntro eyebrow="Kontakt" title="Sprich mit Binso." description="Wähle das passende Thema. Deine Anfrage wird intern der richtigen Kategorie zugeordnet." />
    <section className="v812-contact-layout">
      <div className="v812-contact-copy"><span className="v80-eyebrow">Binso GmbH</span><h2>Kontakt</h2>
        <p>{appIdentity.address.street}<br />{appIdentity.address.postalCode} {appIdentity.address.city}<br />{appIdentity.address.country}</p>
        {appIdentity.contacts.general ? <a href={`mailto:${appIdentity.contacts.general}`}>{appIdentity.contacts.general}</a> : <p>Öffentliche Rollenadressen werden erst angezeigt, sobald die entsprechenden Funktionspostfächer eingerichtet und verifiziert sind.</p>}
        <Link href="/support">Bereits Kunde? Zum Support →</Link>
      </div>
      <div className="v812-form-card"><h2>Nachricht senden</h2><p>Keine Passwörter, Tokens, Kreditkartendaten oder andere Secrets senden.</p><ContactForm /></div>
    </section>
  </main></PublicShell>
}
