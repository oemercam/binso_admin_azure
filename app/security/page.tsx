import Link from 'next/link'
import { PublicCta, PublicShell } from '@/components/public/public-shell'

const controls = [
  ['Identität', 'Die produktive Anmeldung läuft über Azure App Service Authentication und eine Microsoft-basierte Identitätsplattform. Binso One speichert keine Benutzerpasswörter.'],
  ['Mandantentrennung', 'Organisationen, Mitgliedschaften und Geschäftsdaten werden tenantbezogen verarbeitet. Zugriffe werden gegen den aktiven Organisationskontext geprüft.'],
  ['Berechtigungen', 'Rollen und konkrete Berechtigungen werden zentral ausgewertet. Plattformrollen bleiben von den Rollen innerhalb eines Kundenunternehmens getrennt.'],
  ['Daten und Transport', 'Die Produktionsumgebung nutzt PostgreSQL und verschlüsselte Verbindungen. Geheimnisse und Provider-Schlüssel bleiben serverseitig konfiguriert.'],
  ['Nachvollziehbarkeit', 'Sicherheitsrelevante Plattform- und Tenant-Aktionen werden kontrolliert. Supportzugriffe sind als eigene, begrenzte Zugriffsebene vorgesehen.'],
] as const

export default function SecurityPage() {
  return (
    <PublicShell>
      <main className="public-main public-security-page">
        <section className="security-hero-modern">
          <div className="security-hero-copy">
            <span className="public-eyebrow">Sicherheit</span>
            <h1>Schutz ist kein einzelnes Feature.</h1>
            <p>Binso One verbindet Identität, Mandantentrennung, Berechtigungen und einen nachvollziehbaren Betrieb zu einem gemeinsamen Sicherheitsmodell.</p>
          </div>
          <div className="security-architecture-visual" aria-label="Sicherheitsmodell von Binso One">
            <div className="security-architecture-core"><i /><b /><span>Binso One</span><strong>Tenant Data</strong></div>
            <div className="security-orbit orbit-one"><span>Identität</span></div>
            <div className="security-orbit orbit-two"><span>RBAC</span></div>
            <div className="security-orbit orbit-three"><span>Tenant</span></div>
          </div>
        </section>

        <section className="security-control-section">
          <div className="security-control-intro">
            <span>Mehrere Schutzebenen</span>
            <h2>Jeder Zugriff durchläuft denselben klaren Pfad.</h2>
            <p>Benutzeridentität, Organisationsmitgliedschaft, Berechtigung und Tenant-Kontext werden nicht als getrennte Inseln behandelt.</p>
          </div>
          <div className="security-control-list">
            {controls.map(([title, description], index) => (
              <article key={title}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="security-flow-modern">
          <div><span>01</span><strong>Anmeldung</strong></div><i />
          <div><span>02</span><strong>Mitgliedschaft</strong></div><i />
          <div><span>03</span><strong>Berechtigung</strong></div><i />
          <div><span>04</span><strong>Tenant-Kontext</strong></div><i />
          <div><span>05</span><strong>Datenzugriff</strong></div>
        </section>

        <div className="security-more-link"><Link href="/legal/privacy">Datenschutz ansehen →</Link></div>
        <PublicCta />
      </main>
    </PublicShell>
  )
}
