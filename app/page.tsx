import Link from 'next/link'
import { publicMetadata } from '@/lib/config/seo'
import { PublicShell } from '@/components/public/public-shell'
import { MarketingScreenshot } from '@/components/public/marketing-screenshot'

export const metadata = publicMetadata({
  title: 'Binso One',
  description: 'Binso One verbindet Projektmanagement, Zeiterfassung, Abrechnung und CRM in einer klaren Plattform für Schweizer Dienstleistungsunternehmen.',
  path: '/',
})


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
              <div className="v816-laptop-screen"><MarketingScreenshot name="dashboard" priority /></div>
              <div className="v816-laptop-base" aria-hidden="true" />
            </div>
          </div>
        </section>

        <section className="v816-feature">
          <div className="v816-inner v816-feature-grid">
            <div className="v816-product-shot"><MarketingScreenshot name="orders" /></div>
            <div className="v816-feature-copy">
              <div className="v816-label"><span>▰</span><small>Projektmanagement</small></div>
              <h2>Projekte im Griff.<br />Von der Idee bis zur Rechnung.</h2>
              <p>Plane, organisiere und steuere deine Projekte effizient. Aufgaben, Dateien, Budgets und Teamarbeit – alles an einem Ort.</p>
              <Link href="/features">Mehr zu Projektmanagement <span>→</span></Link>
            </div>
          </div>
        </section>

        <section className="v816-feature v816-soft v817-time-section">
          <div className="v816-inner v816-feature-grid v816-feature-reverse">
            <div className="v816-feature-copy">
              <div className="v816-label"><span>◷</span><small>Zeiterfassung</small></div>
              <h2>Zeiten erfassen. Überall und ohne Aufwand.</h2>
              <p>Erfasse deine Arbeitszeit flexibel – per Timer, manuell oder unterwegs. Behalte Budgets und Verrechenbarkeit jederzeit im Blick.</p>
              <Link href="/features">Mehr zur Zeiterfassung <span>→</span></Link>
            </div>
            <div className="v817-time-visual" aria-label="Übersicht zur Zeiterfassung">
              <div className="v817-time-card v817-time-primary">
                <div className="v817-time-head"><span>Heute</span><strong>06:42 h</strong></div>
                <div className="v817-time-progress"><i /></div>
                <div className="v817-time-meta"><span>Projekt Alpha</span><span>75 %</span></div>
              </div>
              <div className="v817-time-grid">
                <div className="v817-time-card"><small>Diese Woche</small><strong>32:15 h</strong><span>4 Tage erfasst</span></div>
                <div className="v817-time-card"><small>Verrechenbar</small><strong>82 %</strong><span>+6 % zum Vormonat</span></div>
                <div className="v817-time-card"><small>Budget</small><strong>68 %</strong><span>im geplanten Rahmen</span></div>
                <div className="v817-time-card v817-mini-chart"><small>Auslastung</small><div><i /><i /><i /><i /><i /></div><span>stabil</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="v816-feature">
          <div className="v816-inner v816-feature-grid">
            <div className="v816-product-shot"><MarketingScreenshot name="invoices" /></div>
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
              <div className="v816-label"><span>↗</span><small>Datenfluss</small></div>
              <h2>Daten bewegen. Strukturiert und nachvollziehbar.</h2>
              <p>CSV-Import und Datenexport helfen dir, Informationen sauber weiterzuverwenden. Weitere Schnittstellen werden nur dort angezeigt, wo sie produktiv verfügbar und konfiguriert sind.</p>
              <Link href="/features">Mehr zu Daten und Automationen <span>→</span></Link>
            </div>
            <div className="v820-data-flow" aria-label="Datenfluss in Binso One">
              <div><small>Import</small><strong>CSV</strong><span>Strukturierte Daten übernehmen</span></div>
              <div><small>Export</small><strong>Daten</strong><span>Informationen weiterverwenden</span></div>
              <div><small>Erweiterung</small><strong>Nach Bedarf</strong><span>Nur verfügbare Schnittstellen</span></div>
            </div>
          </div>
        </section>

        <section className="v816-lower v820-clean-lower">
          <div className="v816-inner">
            <div className="v820-proof-strip">
              <div><span className="v80-eyebrow">Für Schweizer Dienstleistungsunternehmen</span><h2>Weniger Administration. Mehr Zeit für die eigentliche Arbeit.</h2></div>
              <div className="v820-proof-facts"><span><strong>30 Tage</strong><small>kostenlos testen</small></span><span><strong>Ohne Karte</strong><small>beim Start</small></span><span><strong>Web und PWA</strong><small>für den Arbeitsalltag</small></span></div>
            </div>

            <div className="v816-price-cta v820-final-cta">
              <div><span className="v80-eyebrow">Bereit zum Start?</span><h2>Binso One in Ruhe ausprobieren.</h2><p>Starte kostenlos oder sieh dir zuerst die Produktdemo mit Beispieldaten an.</p></div>
              <div className="v816-actions"><Link className="v816-button v816-button-primary" href="/register?mode=trial">30 Tage kostenlos testen →</Link><Link className="v816-button v816-button-secondary" href="/register?mode=demo">Demo ansehen</Link></div>
            </div>
          </div>
        </section>
      </main>
    </PublicShell>
  )
}
