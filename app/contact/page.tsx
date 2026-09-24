import { PublicPageIntro, PublicShell } from '@/components/public/public-shell'
import { appIdentity } from '@/lib/config/app-identity'

export default function ContactPage() {
  return (
    <PublicShell>
      <main className="public-main public-main-narrow">
        <PublicPageIntro eyebrow="Kontakt" title="Sprich mit Binso." description="Fragen zu Binso One, Plänen, Einführung oder Zusammenarbeit beantworten wir direkt." />
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
