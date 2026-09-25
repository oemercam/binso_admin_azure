import Link from 'next/link'
import { publicMetadata } from '@/lib/config/seo'
import { PublicShell } from '@/components/public/public-shell'
import { MarketingScreenshot } from '@/components/public/marketing-screenshot'

export const metadata = publicMetadata({
  title: 'Binso One',
  description: 'Binso One verbindet Kunden, Projekte, Zeiterfassung, Angebote und Rechnungen in einer klaren Plattform für Schweizer Dienstleistungsunternehmen.',
  path: '/',
})

const mobileFeatures = [
  ['▰', 'Projekte', 'effizient steuern'],
  ['◷', 'Zeiten', 'einfach erfassen'],
  ['▤', 'Rechnungen', 'schnell erstellen'],
  ['▥', 'Business', 'im Blick behalten'],
] as const

const referenceMarks = ['Referenz 01', 'Referenz 02', 'Referenz 03', 'Referenz 04', 'Referenz 05', 'Referenz 06'] as const

export default function HomePage() {
  return (
    <PublicShell>
      <main className="v80-main v81-home v815-home">
        <section className="v80-hero v81-hero v815-band v815-hero" aria-labelledby="hero-title">
          <div className="v815-inner v815-hero-grid">
            <div className="v81-hero-copy v815-hero-copy">
              <h1 id="hero-title">Einfacher arbeiten.<br />Erfolgreicher wachsen.</h1>
              <p>Binso One vereint Projektmanagement, Zeiterfassung, Abrechnung und CRM in einer klaren, intuitiven Plattform. Für mehr Fokus, weniger Admin und ein profitables Business.</p>
              <div className="v81-hero-actions v815-hero-actions">
                <Link className="button primary v81-primary-button" href="/register">30 Tage kostenlos testen <span aria-hidden="true">→</span></Link>
                <Link className="button secondary v81-secondary-button" href="/register?mode=demo"><span aria-hidden="true">▶</span> Demo ansehen</Link>
              </div>
              <div className="v81-hero-trust v815-hero-trust" aria-label="Vorteile beim Start">
                <span>Keine Kreditkarte nötig</span>
                <span>In 2 Minuten startklar</span>
                <span>Schweizer Datenstandort</span>
              </div>
            </div>
            <div className="v81-hero-device v80-hero-visual v815-laptop" aria-label="Binso One Produktansicht">
              <div className="v81-device-screen v815-laptop-screen"><MarketingScreenshot name="dashboard" priority desktopOnly /></div>
              <div className="v81-device-base v815-laptop-base" aria-hidden="true" />
            </div>
          </div>
        </section>

        <section className="v81-mobile-intro v815-mobile-intro" aria-labelledby="mobile-intro-title">
          <div className="v815-inner">
            <h2 id="mobile-intro-title">Weniger ist mehr.</h2>
            <p>Alle wichtigen Funktionen an einem Ort. Übersichtlich, performant und gemacht für den Alltag in Projekten.</p>
            <div className="v81-mobile-feature-grid">
              {mobileFeatures.map(([icon, title, subtitle]) => (
                <article key={title}><span aria-hidden="true">{icon}</span><strong>{title}</strong><small>{subtitle}</small></article>
              ))}
            </div>
          </div>
        </section>

        <section className="v80-split v81-row v815-band v815-feature" aria-labelledby="projects-title">
          <div className="v815-inner v815-feature-grid">
            <div className="v81-row-visual v815-product-card"><MarketingScreenshot name="orders" desktopOnly /></div>
            <div className="v81-row-copy v815-feature-copy">
              <div className="v81-icon-label"><span aria-hidden="true">▰</span><small>Projektmanagement</small></div>
              <h2 id="projects-title">Projekte im Griff.<br />Von der Idee bis zur Rechnung.</h2>
              <p>Plane, organisiere und steuere deine Projekte effizient. Aufgaben, Dateien, Budgets und Teamarbeit – alles an einem Ort.</p>
              <Link href="/features">Mehr zu Projektmanagement <span aria-hidden="true">→</span></Link>
            </div>
          </div>
        </section>

        <section className="v80-split v81-row v81-row-reverse v815-band v815-feature v815-feature-soft" aria-labelledby="time-title">
          <div className="v815-inner v815-feature-grid v815-feature-grid-reverse">
            <div className="v81-row-copy v815-feature-copy">
              <div className="v81-icon-label"><span aria-hidden="true">◷</span><small>Zeiterfassung</small></div>
              <h2 id="time-title">Zeiten erfassen. Überall und ohne Aufwand.</h2>
              <p>Erfasse deine Arbeitszeit flexibel – per Timer, manuell oder unterwegs. Behalte Budgets und Verrechenbarkeit jederzeit im Blick.</p>
              <Link href="/features">Mehr zur Zeiterfassung <span aria-hidden="true">→</span></Link>
            </div>
            <div className="v81-row-visual v815-product-card"><MarketingScreenshot name="time" desktopOnly /></div>
          </div>
        </section>

        <section className="v80-split v81-row v815-band v815-feature" aria-labelledby="billing-title">
          <div className="v815-inner v815-feature-grid">
            <div className="v81-row-visual v815-product-card"><MarketingScreenshot name="invoices" desktopOnly /></div>
            <div className="v81-row-copy v815-feature-copy">
              <div className="v81-icon-label"><span aria-hidden="true">▥</span><small>Abrechnung und Finanzen</small></div>
              <h2 id="billing-title">Schnell zur Rechnung. Alles im Blick.</h2>
              <p>Erstelle professionelle Rechnungen, behalte Budgets und Zahlungen im Blick und erhalte aussagekräftige Berichte.</p>
              <Link href="/features">Mehr zu Abrechnung und Finanzen <span aria-hidden="true">→</span></Link>
            </div>
          </div>
        </section>

        <section className="v81-integrations v815-band v815-feature v815-feature-soft" aria-labelledby="integrations-title">
          <div className="v815-inner v815-feature-grid v815-feature-grid-reverse">
            <div className="v81-integrations-copy v815-feature-copy">
              <div className="v81-icon-label"><span aria-hidden="true">↗</span><small>Integrationen</small></div>
              <h2 id="integrations-title">Deine Tools. Nahtlos verbunden.</h2>
              <p>Binso One lässt sich einfach in deine bestehende Tool-Landschaft integrieren – über direkte Schnittstellen, Import, Export und API.</p>
              <Link href="/features">Mehr zu Integrationen <span aria-hidden="true">→</span></Link>
            </div>
            <div className="v81-integration-map v815-integration-map" aria-label="Integrationsübersicht">
              <span className="v81-tool t1">API</span>
              <span className="v81-tool t2">CSV</span>
              <span className="v81-tool t3">DMS</span>
              <strong className="v81-tool-core">B1</strong>
              <span className="v81-tool t4">ERP</span>
              <span className="v81-tool t5">CRM</span>
              <span className="v81-tool t6">…</span>
            </div>
          </div>
        </section>

        <section className="v815-proof-band" aria-labelledby="reference-title">
          <div className="v815-inner">
            <div className="v81-reference-strip v815-reference-strip">
              <div className="v81-reference-left">
                <span className="v81-kicker">Unternehmen vertrauen auf Binso One.</span>
                <h2 id="reference-title" className="v815-visually-hidden">Referenzen</h2>
                <div className="v81-reference-logos" aria-label="Freizugebende Kundenreferenzen">
                  {referenceMarks.map((mark) => <span key={mark}>{mark}</span>)}
                </div>
              </div>
              <div className="v81-reference-badges" aria-label="Qualitätsnachweise">
                <div><strong>CH</strong><small>Schweizer Fokus</small></div>
                <div><strong>30</strong><small>Tage testen</small></div>
                <div><strong>✓</strong><small>Klare Prozesse</small></div>
              </div>
            </div>

            <section className="v81-testimonials v815-testimonials" aria-labelledby="testimonials-title">
              <h2 id="testimonials-title">Das sagen unsere Kundinnen und Kunden.</h2>
              <div className="v81-testimonial-grid">
                <article><div className="v81-avatar">01</div><p>«Binso One bringt Projekte, Zeiten und Abrechnung an einem Ort zusammen. Das macht den Arbeitsalltag spürbar übersichtlicher.»</p><strong>Referenz nach Freigabe</strong><small>Schweizer Dienstleistungsunternehmen</small></article>
                <article><div className="v81-avatar">02</div><p>«Intuitiv, modern und auf klare Abläufe ausgerichtet. Unser Team findet die wichtigen Funktionen schnell.»</p><strong>Referenz nach Freigabe</strong><small>Beratung und Services</small></article>
                <article><div className="v81-avatar">03</div><p>«Zeiterfassung, Projekte und Rechnungen greifen sauber ineinander. Genau das reduziert unnötige Administration.»</p><strong>Referenz nach Freigabe</strong><small>Agentur und Projektgeschäft</small></article>
              </div>
            </section>

            <section className="v81-price-cta v815-price-cta" aria-labelledby="price-cta-title">
              <div>
                <span className="v81-kicker">Faire Preise</span>
                <h2 id="price-cta-title">Ein Plan, der zu dir passt.</h2>
                <p>Transparente Preise, keine versteckten Kosten.</p>
              </div>
              <div className="v81-price-bars" aria-hidden="true"><i /><i /><i /><i /></div>
              <div className="v81-price-actions">
                <Link className="button primary" href="/pricing">Zu den Preisen <span aria-hidden="true">→</span></Link>
                <Link className="button secondary" href="/register?mode=demo"><span aria-hidden="true">▶</span> Demo ansehen</Link>
              </div>
            </section>
          </div>
        </section>
      </main>
    </PublicShell>
  )
}
