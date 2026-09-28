import { publicMetadata } from '@/lib/config/seo'
import { LegalPage } from '@/components/public/legal-page'
import { appIdentity } from '@/lib/config/app-identity'
import { LEGAL_VERSION, legalCompany } from '@/lib/legal/legal-config'

export const metadata = publicMetadata({ title: 'Impressum', description: 'Impressum und Anbieterinformationen der Binso GmbH.', path: '/legal/imprint' })

export default function ImprintPage() {
  return (
    <LegalPage title="Impressum" description={`Anbieter- und Kontaktinformationen zu Binso One. Stand: ${LEGAL_VERSION}.`}>
      <h2>Anbieterin</h2>
      <p><strong>{legalCompany.legalName}</strong><br />{legalCompany.alternateNames.join(' / ')}<br />{appIdentity.address.street}<br />{appIdentity.address.postalCode} {appIdentity.address.city}<br />{appIdentity.address.country}</p>
      <h2>Handelsregister</h2>
      <p>Unternehmens-Identifikationsnummer (UID): <strong>{legalCompany.uid}</strong><br />Eingetragen im {legalCompany.registry}.</p>
      <h2>Vertretungsberechtigte Personen</h2>
      <p>{legalCompany.management.join(' und ')}, jeweils mit Einzelunterschrift.</p>
      <h2>Kontakt</h2>
      <p>E-Mail: <a href={`mailto:${legalCompany.email}`}>{legalCompany.email}</a><br />Telefon: <a href={legalCompany.phoneHref}>{legalCompany.phoneDisplay}</a><br />Web: <a href={legalCompany.website}>{legalCompany.websiteDisplay}</a></p>
      <h2>Produkt</h2>
      <p>{appIdentity.name} wird von der {legalCompany.legalName} entwickelt und betrieben.</p>
      <h2>Haftung für Inhalte und externe Verweise</h2>
      <p>Die {legalCompany.legalName} erstellt und pflegt die eigenen Inhalte mit angemessener Sorgfalt. Für Inhalte externer Websites sind deren jeweilige Anbieter verantwortlich. Zwingende gesetzliche Ansprüche bleiben vorbehalten.</p>
    </LegalPage>
  )
}
