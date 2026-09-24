import { LegalPage } from '@/components/public/legal-page'
import { appIdentity } from '@/lib/config/app-identity'

export default function ImprintPage() {
  return (
    <LegalPage title="Impressum" description="Anbieter- und Kontaktinformationen zu Binso One.">
      <h2>Anbieter</h2>
      <p><strong>{appIdentity.company}</strong><br />{appIdentity.address.street}<br />{appIdentity.address.postalCode} {appIdentity.address.city}<br />{appIdentity.address.country}</p>
      <h2>Kontakt</h2>
      <p>E-Mail: <a href={`mailto:${appIdentity.supportEmail}`}>{appIdentity.supportEmail}</a><br />Telefon: <a href={appIdentity.phoneHref}>{appIdentity.phoneDisplay}</a><br />Web: <a href={appIdentity.website}>{appIdentity.websiteDisplay}</a></p>
      <h2>Produkt</h2>
      <p>{appIdentity.name} wird von der {appIdentity.company} entwickelt und betrieben. Produkt- und Plattforminformationen können laufend weiterentwickelt werden.</p>
      <h2>Haftung für Inhalte und Verweise</h2>
      <p>Die {appIdentity.company} bemüht sich um korrekte und aktuelle Informationen. Für externe Inhalte, auf die verwiesen wird, sind die jeweiligen Anbieter verantwortlich. Zwingende gesetzliche Ansprüche bleiben vorbehalten.</p>
    </LegalPage>
  )
}
