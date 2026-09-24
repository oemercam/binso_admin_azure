import { PublicPageIntro, PublicShell } from '@/components/public/public-shell'
import { appIdentity } from '@/lib/config/app-identity'

export default function ContactPage() {
  return (
    <PublicShell>
      <main className="public-main public-main-narrow">
        <PublicPageIntro eyebrow="Kontakt" title="Sprich mit Binso." description="Fragen zu Binso One, Plänen, Einführung oder Zusammenarbeit beantworten wir direkt." />
        <section className="public-contact-card">
          <div><span>Unternehmen</span><strong>Binso GmbH</strong><p>Weissbadstrasse 8b<br />9050 Appenzell<br />Schweiz</p></div>
          <div><span>E-Mail</span><a href={`mailto:${appIdentity.supportEmail}`}>{appIdentity.supportEmail}</a><span>Telefon</span><a href="tel:+41585107758">+41 58 510 77 58</a></div>
        </section>
      </main>
    </PublicShell>
  )
}
