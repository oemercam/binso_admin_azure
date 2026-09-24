import Link from 'next/link'
import { planDefinitions, selfServicePlanDefinitions } from '@/lib/data/plans'
import { PublicCta, PublicShell } from '@/components/public/public-shell'
import { SwipeCarousel } from '@/components/public/swipe-carousel'
import {
  BusinessFlowVisual,
  DashboardProductVisual,
  FeatureStoryVisual,
  LandingProofVisual,
  OnboardingVisual,
} from '@/components/public/product-visuals'
import { appIdentity } from '@/lib/config/app-identity'
import { createPublicMetadata, publicUrl } from '@/lib/config/seo'

export const metadata = createPublicMetadata({
  title: 'Business-Software für Schweizer KMU',
  description: 'Binso One verbindet Kunden, Angebote, Aufträge, Zeiterfassung, Rechnungen, Mitarbeitende und Finanzen in einer klaren Plattform für Schweizer Dienstleistungsunternehmen.',
  path: '/',
  keywords: ['Business Plattform Schweiz', 'KMU Administration', 'Software Dienstleistungsunternehmen'],
})

const selfServicePrices = selfServicePlanDefinitions
  .map((plan) => plan.monthlyPriceChf)
  .filter((price): price is number => typeof price === 'number')

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': publicUrl('/#organization'),
      name: appIdentity.company,
      url: appIdentity.website,
      email: appIdentity.supportEmail,
      telephone: appIdentity.phoneDisplay,
      address: {
        '@type': 'PostalAddress',
        streetAddress: appIdentity.address.street,
        postalCode: appIdentity.address.postalCode,
        addressLocality: appIdentity.address.city,
        addressCountry: 'CH',
      },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': publicUrl('/#software'),
      name: appIdentity.name,
      url: publicUrl('/'),
      description: appIdentity.description,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      provider: {
        '@id': publicUrl('/#organization'),
      },
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'CHF',
        lowPrice: Math.min(...selfServicePrices),
        highPrice: Math.max(...selfServicePrices),
        offerCount: selfServicePlanDefinitions.length,
      },
      featureList: [
        'Kunden und Kontakte',
        'Angebote und Aufträge',
        'Zeiterfassung',
        'Rechnungen und Finanzen',
        'Mitarbeitende und Rollen',
      ],
    },
  ],
}

export default function HomePage() {
  const highlightedPlans = planDefinitions.filter((plan) => ['starter', 'business', 'professional'].includes(plan.id))

  return (
    <PublicShell light>
      <main className="public-main public-landing-v705 public-landing-v74">
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>

        <section className="landing-hero">
          <div className="landing-hero-copy">
            <span className="public-eyebrow">Business-Software für Schweizer Dienstleistungsunternehmen</span>
            <h1>Dein Unternehmen.<br />Eine Plattform.</h1>
            <p>Binso One verbindet Kunden und Kontakte, Angebote, Aufträge, Zeiterfassung, Rechnungen, Mitarbeitende und Finanzen in einem durchgängigen Arbeitsablauf.</p>
            <div className="landing-hero-actions">
              <Link className="button primary" href="/register">14 Tage kostenlos testen</Link>
              <Link className="button secondary" href="/features">Funktionen ansehen</Link>
            </div>
            <div className="landing-hero-meta" aria-label="Vorteile beim Einstieg">
              <span>Keine Zahlungsdaten beim Start</span>
              <span>Für Schweizer KMU</span>
              <span>Desktop, Mobile und PWA</span>
            </div>
          </div>
          <DashboardProductVisual />
        </section>

        <section className="landing-value-strip" aria-label="Warum Binso One">
          <article>
            <span>01</span>
            <strong>Einmal erfassen.</strong>
            <p>Kunden- und Auftragsdaten werden im nächsten Arbeitsschritt direkt weiterverwendet.</p>
          </article>
          <article>
            <span>02</span>
            <strong>Durchgängig arbeiten.</strong>
            <p>Angebot, Auftrag, Zeit und Rechnung bleiben Teil desselben Geschäftsablaufs.</p>
          </article>
          <article>
            <span>03</span>
            <strong>Einfach wachsen.</strong>
            <p>Starte mit dem passenden Plan und erweitere Funktionen, wenn dein Unternehmen sie braucht.</p>
          </article>
        </section>

        <section className="landing-statement landing-section-spacious">
          <span>Einfach. Übersichtlich. Durchgängig.</span>
          <h2>Weniger Administration.<br />Mehr Zeit fürs Geschäft.</h2>
          <p>Binso One verbindet die wichtigsten Bereiche deines Unternehmens. Informationen werden einmal erfasst und im nächsten Arbeitsschritt direkt weiterverwendet.</p>
        </section>

        <section className="landing-dashboard-stage" aria-labelledby="landing-dashboard-title">
          <div className="landing-dashboard-copy">
            <span>Alles im Blick</span>
            <h2 id="landing-dashboard-title">Eine Oberfläche für den täglichen Betrieb.</h2>
            <p>Dashboard, Kunden, Aufträge, Zeiten und Finanzen greifen ineinander. So bleibt der aktuelle Stand sichtbar, ohne Informationen in mehreren Werkzeugen zusammensuchen zu müssen.</p>
            <Link href="/features">Funktionen im Detail →</Link>
          </div>
          <LandingProofVisual />
        </section>

        <section className="landing-feature-stories" id="funktionen">
          <div className="public-section-head centered landing-section-heading">
            <span>Die wichtigsten Bereiche</span>
            <h2>Die Arbeit steht im Mittelpunkt. Nicht die Software.</h2>
            <p>Statt vieler einzelner Module führt Binso One durch zusammenhängende Abläufe – vom ersten Kundenkontakt bis zur Abrechnung.</p>
          </div>
          <FeatureStoryVisual />
        </section>

        <section className="landing-flow-section landing-section-spacious">
          <div className="public-section-head centered landing-section-heading">
            <span>Ein durchgängiger Prozess</span>
            <h2>Vom Kundenkontakt bis zur Zahlung.</h2>
            <p>Die nächsten Schritte entstehen aus dem vorherigen Arbeitsschritt. Das reduziert doppelte Erfassung und macht den Ablauf verständlich.</p>
          </div>
          <BusinessFlowVisual />
        </section>

        <section className="landing-onboarding-section landing-section-spacious">
          <div className="landing-onboarding-copy">
            <span>Einfach starten</span>
            <h2>In wenigen Schritten arbeitsbereit.</h2>
            <p>Du brauchst kein Einführungsprojekt. Konto erstellen, Unternehmen einrichten, ersten Kunden erfassen und mit dem normalen Arbeitsablauf beginnen.</p>
            <Link href="/how-it-works">So funktioniert Binso One →</Link>
          </div>
          <OnboardingVisual />
        </section>

        <section className="landing-trust landing-section-spacious">
          <div className="public-section-head centered landing-section-heading">
            <span>Sicherheit und Vertrauen</span>
            <h2>Für Geschäftsdaten entwickelt.</h2>
            <p>Klare Zugriffe, getrennte Organisationen und eine sichere Anmeldung bilden die Grundlage für den täglichen Einsatz.</p>
          </div>
          <div className="landing-security-stage">
            <div className="landing-security-core" aria-hidden="true">
              <span className="landing-security-ring ring-one" />
              <span className="landing-security-ring ring-two" />
              <div className="landing-security-lock"><i /><b /></div>
              <small>Binso One</small>
              <strong>Geschützt auf mehreren Ebenen</strong>
            </div>
            <div className="landing-security-points">
              <div><span>01</span><div><strong>Mandantentrennung</strong><p>Geschäftsdaten werden je Organisation getrennt verarbeitet und geprüft.</p></div></div>
              <div><span>02</span><div><strong>Identität und Rollen</strong><p>Anmeldung, Mitgliedschaft und Berechtigungen greifen als gemeinsame Zugriffskette.</p></div></div>
              <div><span>03</span><div><strong>Nachvollziehbarer Betrieb</strong><p>Relevante Aktionen und Plattformzugriffe werden kontrolliert und protokolliert.</p></div></div>
            </div>
          </div>
          <div className="landing-centered-link"><Link href="/security">Sicherheitsmodell ansehen →</Link></div>
        </section>

        <section className="public-section landing-pricing">
          <div className="public-section-head split">
            <div><span>Preise</span><h2>Ein Plan, der mit deinem Unternehmen mitwächst.</h2></div>
            <Link href="/pricing">Alle Preise vergleichen →</Link>
          </div>
          <SwipeCarousel className="public-price-preview" count={highlightedPlans.length}>
            {highlightedPlans.map((plan) => (
              <article key={plan.id} className={plan.recommended ? 'recommended' : ''}>
                <div><span>{plan.name}</span>{plan.recommended ? <small>Empfohlen</small> : null}</div>
                <strong>{plan.monthlyPriceChf ? <>CHF {plan.monthlyPriceChf}<small> / Monat</small></> : 'Individuell'}</strong>
                <p>{plan.description}</p>
                <Link className="button secondary" href={`/register?plan=${plan.id}`}>14 Tage kostenlos testen</Link>
              </article>
            ))}
          </SwipeCarousel>
        </section>

        <section className="landing-contact-cta landing-section-spacious">
          <div>
            <span>Persönlicher Kontakt</span>
            <h2>Fragen zu Produkt, Plan oder Einführung?</h2>
            <p>Sprich direkt mit Binso. Wir helfen dir, den passenden Einstieg für dein Unternehmen einzuordnen.</p>
          </div>
          <div className="landing-contact-actions">
            <Link className="button primary" href="/contact">Kontakt aufnehmen</Link>
            <a className="button secondary" href={appIdentity.phoneHref}>{appIdentity.phoneDisplay}</a>
          </div>
        </section>

        <section className="public-section public-faq-preview landing-faq">
          <div className="public-section-head"><span>Häufige Fragen</span><h2>Die wichtigsten Antworten vor dem Start.</h2></div>
          <div className="public-faq-list">
            <details><summary>Für wen ist Binso One gedacht?</summary><p>Für Schweizer Dienstleistungsunternehmen und Teams, die Kunden, Angebote, Aufträge, Zeit, Rechnungen und interne Abläufe zentral verwalten möchten.</p></details>
            <details><summary>Muss ich bei der Registrierung bereits Zahlungsdaten angeben?</summary><p>Nein. Die Registrierung und der Einstieg in die 14-tägige Testphase erfolgen ohne sofortige Zahlung.</p></details>
            <details><summary>Kann ich Binso One auch auf dem Smartphone verwenden?</summary><p>Ja. Binso One ist für Desktop, Mobile und eine installierte PWA ausgelegt.</p></details>
          </div>
          <Link href="/faq">Alle Fragen ansehen →</Link>
        </section>

        <PublicCta />
      </main>
    </PublicShell>
  )
}
