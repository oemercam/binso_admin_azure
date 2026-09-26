import Link from 'next/link'
import { publicMetadata } from '@/lib/config/seo'
import { PublicShell } from '@/components/public/public-shell'
import { MarketingScreenshot } from '@/components/public/marketing-screenshot'

export const metadata = publicMetadata({
  title: 'Binso One',
  description: 'Binso One verbindet Projektmanagement, Zeiterfassung, Abrechnung und CRM in einer klaren Plattform für Schweizer Dienstleistungsunternehmen.',
  path: '/',
})

const references = ['Referenz 01', 'Referenz 02', 'Referenz 03', 'Referenz 04', 'Referenz 05', 'Referenz 06'] as const

export default function HomePage() {
  return (
    <PublicShell>
      <main className="v816-home">
        <section className="v816-hero" aria-labelledby="hero-title">
          <div className="v816-inner v816-hero-grid">
            <div className="v816-hero-copy">
              <h1 id="hero-title">Einfacher arbeiten.<br />Erfolgreicher wachsen.</h1>
              <p>Binso One vereint Projektmanagement, Zeiterfassung, Abrechnung und CRM in einer klaren, intuitiven Plattform. Für mehr Fokus, weniger Admin und ein profitables Business.</p>
              <div className="v816-actions">
                <Link className="v816-button v816-button-primary" href="/register">30 Tage kostenlos testen <span>→</span></Link>
                <Link className="v816-button v816-button-secondary" href="/register?mode=demo"><span className="v816-play">▶</span> Demo ansehen</Link>
              </div>
              <div className="v816-trust"><span>Keine Kreditkarte nötig</span><span>In 2 Minuten startklar</span><span>Schweizer Datenstandort</span></div>
            </div>
            <div className="v816-laptop" aria-label="Binso One Produktansicht">
              <div className="v816-laptop-screen"><MarketingScreenshot name="dashboard-mockup" priority desktopOnly /></div>
              <div className="v816-laptop-base" aria-hidden="true" />
            </div>
          </div>
        </section>

        <section className="v816-feature">
          <div className="v816-inner v816-feature-grid">
            <div className="v816-product-shot"><MarketingScreenshot name="orders-mockup" desktopOnly /></div>
            <div className="v816-feature-copy">
              <div className="v816-label"><span>▰</span><small>Projektmanagement</small></div>
              <h2>Projekte im Griff.<br />Von der Idee bis zur Rechnung.</h2>
              <p>Plane, organisiere und steuere deine Projekte effizient. Aufgaben, Dateien, Budgets und Teamarbeit – alles an einem Ort.</p>
              <Link href="/features">Mehr zu Projektmanagement <span>→</span></Link>
            </div>
          </div>
        </section>

        <section className="v816-feature v816-soft">
          <div className="v816-inner v816-feature-grid v816-feature-reverse">
            <div className="v816-feature-copy">
              <div className="v816-label"><span>◷</span><small>Zeiterfassung</small></div>
              <h2>Zeiten erfassen. Überall und ohne Aufwand.</h2>
              <p>Erfasse deine Arbeitszeit flexibel – per Timer, manuell oder unterwegs. Behalte Budgets und Verrechenbarkeit jederzeit im Blick.</p>
              <Link href="/features">Mehr zur Zeiterfassung <span>→</span></Link>
            </div>
            <div className="v816-product-shot"><MarketingScreenshot name="time-mockup" desktopOnly /></div>
          </div>
        </section>

        <section className="v816-feature">
          <div className="v816-inner v816-feature-grid">
            <div className="v816-product-shot"><MarketingScreenshot name="invoices-mockup" desktopOnly /></div>
            <div className="v816-feature-copy">
              <div className="v816-label"><span>▥</span><small>Abrechnung &amp; Finanzen</small></div>
              <h2>Schnell zur Rechnung. Alles im Blick.</h2>
              <p>Erstelle professionelle Rechnungen, behalte Budgets und Zahlungen im Blick und erhalte aussagekräftige Berichte.</p>
              <Link href="/features">Mehr zu Abrechnung &amp; Finanzen <span>→</span></Link>
            </div>
          </div>
        </section>

        <section className="v816-feature v816-soft">
          <div className="v816-inner v816-feature-grid v816-feature-reverse">
            <div className="v816-feature-copy">
              <div className="v816-label"><span>↗</span><small>Integrationen</small></div>
              <h2>Deine Tools. Nahtlos verbunden.</h2>
              <p>Binso One lässt sich einfach in deine bestehende Tool-Landschaft integrieren – über direkte Schnittstellen und bewährte Partner.</p>
              <Link href="/features">Mehr zu Integrationen <span>→</span></Link>
            </div>
            <div className="v816-integration-map" aria-label="Integrationsübersicht">
              <span className="v816-tool t1">API</span><span className="v816-tool t2">CSV</span><span className="v816-tool t3">DMS</span>
              <strong>B1</strong>
              <span className="v816-tool t4">ERP</span><span className="v816-tool t5">CRM</span><span className="v816-tool t6">…</span>
            </div>
          </div>
        </section>

        <section className="v816-lower">
          <div className="v816-inner">
            <div className="v816-reference-strip">
              <div>
                <small>Unternehmen vertrauen auf Binso One.</small>
                <div className="v816-reference-logos">{references.map((item) => <span key={item}>{item}</span>)}</div>
              </div>
              <div className="v816-badges"><span><b>CH</b><small>Schweizer Fokus</small></span><span><b>30</b><small>Tage testen</small></span><span><b>✓</b><small>Klare Prozesse</small></span></div>
            </div>

            <div className="v816-testimonials">
              <h2>Das sagen unsere Kundinnen und Kunden.</h2>
              <div className="v816-testimonial-grid">
                <article><div className="v816-avatar">01</div><p>«Binso One bringt Projekte, Zeiten und Abrechnung an einem Ort zusammen. Das macht den Arbeitsalltag spürbar übersichtlicher.»</p><strong>Referenz nach Freigabe</strong><small>Schweizer Dienstleistungsunternehmen</small></article>
                <article><div className="v816-avatar">02</div><p>«Intuitiv, modern und auf klare Abläufe ausgerichtet. Unser Team findet die wichtigen Funktionen schnell.»</p><strong>Referenz nach Freigabe</strong><small>Beratung und Services</small></article>
                <article><div className="v816-avatar">03</div><p>«Zeiterfassung, Projekte und Rechnungen greifen sauber ineinander. Genau das reduziert unnötige Administration.»</p><strong>Referenz nach Freigabe</strong><small>Agentur und Projektgeschäft</small></article>
              </div>
            </div>

            <div className="v816-price-cta">
              <div><h2>Ein Plan, der zu dir passt.</h2><p>Transparente Preise, keine versteckten Kosten.</p></div>
              <div className="v816-bars"><i /><i /><i /><i /></div>
              <div className="v816-actions"><Link className="v816-button v816-button-primary" href="/pricing">Zu den Preisen →</Link><Link className="v816-button v816-button-secondary" href="/register?mode=demo"><span className="v816-play">▶</span> Demo ansehen</Link></div>
            </div>
          </div>
        </section>
      </main>
    </PublicShell>
  )
}
