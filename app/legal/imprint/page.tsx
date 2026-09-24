import { LegalPage } from '@/components/public/legal-page'

export default function ImprintPage() {
  return (
    <LegalPage title="Impressum" description="Anbieter- und Kontaktinformationen zu Binso One.">
      <h2>Anbieter</h2>
      <p><strong>Binso GmbH</strong><br />Weissbadstrasse 8b<br />9050 Appenzell<br />Schweiz</p>
      <h2>Kontakt</h2>
      <p>E-Mail: <a href="mailto:oemer.cam@binso.ch">oemer.cam@binso.ch</a><br />Telefon: <a href="tel:+41585107758">+41 58 510 77 58</a><br />Web: <a href="https://www.binso.ch">www.binso.ch</a></p>
      <h2>Produkt</h2>
      <p>Binso One wird von der Binso GmbH entwickelt und betrieben. Technische Plattform- und Produktinformationen können laufend weiterentwickelt werden.</p>
      <h2>Haftung für Inhalte und Verweise</h2>
      <p>Die Binso GmbH bemüht sich um korrekte und aktuelle Informationen. Für externe Inhalte, auf die verwiesen wird, sind die jeweiligen Anbieter verantwortlich. Zwingende gesetzliche Ansprüche bleiben vorbehalten.</p>
    </LegalPage>
  )
}
