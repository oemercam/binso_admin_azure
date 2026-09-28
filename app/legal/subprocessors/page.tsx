import { publicMetadata } from '@/lib/config/seo'
import { LegalPage } from '@/components/public/legal-page'
import { LEGAL_VERSION, legalProviders } from '@/lib/legal/legal-config'

export const metadata = publicMetadata({ title: 'Unterauftragsbearbeiter', description: 'Unterauftragsbearbeiter und Datenstandorte für Binso One.', path: '/legal/subprocessors' })

export default function SubprocessorsPage() {
  return (
    <LegalPage title="Unterauftragsbearbeiter" description={`Dienstleister, die für Binso One eingesetzt werden können. Stand: ${LEGAL_VERSION}.`}>
      <p>Die konkrete Nutzung eines Dienstes hängt von der gebuchten Funktion und der produktiven Konfiguration ab. Nicht jeder nachfolgend genannte Dienst verarbeitet bei jedem Kunden Daten.</p>
      {legalProviders.map((provider) => (
        <section key={provider.name}>
          <h2>{provider.name}</h2>
          <p><strong>Dienste:</strong> {provider.services}</p>
          <p><strong>Zweck:</strong> {provider.purpose}</p>
          <p><strong>Länder / Regionen:</strong> {provider.countries}</p>
          <p><strong>Schutz bei Auslandbekanntgabe:</strong> {provider.safeguard}</p>
        </section>
      ))}
      <h2>Änderungen</h2>
      <p>Wesentliche Änderungen dieser Liste werden auf dieser Seite veröffentlicht. Geschäftskunden sollten diese Seite regelmässig prüfen, sofern keine individuelle Benachrichtigung vereinbart wurde.</p>
    </LegalPage>
  )
}
