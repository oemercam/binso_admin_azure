import Link from 'next/link'
import { publicMetadata } from '@/lib/config/seo'
import { PublicCta, PublicPageIntro, PublicShell } from '@/components/public/public-shell'

export const metadata = publicMetadata({ title: 'Sicherheit', description: 'Erfahre, wie Binso One Identitäten, Berechtigungen, Mandantentrennung und den sicheren Betrieb umsetzt.', path: '/security' })

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
      <main className="v80-main v812-page">
        <PublicPageIntro eyebrow="Sicherheit" title="Schutz auf jeder Ebene." description="Identität, Mandantentrennung, Berechtigungen und nachvollziehbarer Betrieb greifen in Binso One zusammen." />
        <section className="v812-security-grid">
          {controls.map(([title, description], index) => <article key={title}><span>{String(index + 1).padStart(2,'0')}</span><h2>{title}</h2><p>{description}</p></article>)}
        </section>
        <section className="v812-flow" aria-label="Sicherheitsablauf"><span>Anmeldung</span><b>→</b><span>Mitgliedschaft</span><b>→</b><span>Berechtigung</span><b>→</b><span>Tenant-Kontext</span><b>→</b><span>Datenzugriff</span></section>
        <div className="v812-text-link-row"><Link className="v81-text-link" href="/legal/privacy">Datenschutz ansehen →</Link></div>
        <PublicCta />
      </main>
    </PublicShell>
  )
}
