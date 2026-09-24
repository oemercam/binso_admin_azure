import { PublicPageIntro, PublicShell } from '@/components/public/public-shell'

export default function SecurityPage() {
  return (
    <PublicShell>
      <main className="public-main public-main-narrow">
        <PublicPageIntro eyebrow="Sicherheit" title="Sicherheit ist Teil des Produkts." description="Binso One kombiniert kontrollierte Identität, rollenbasierte Zugriffe, Mandantentrennung und einen nachvollziehbaren Betrieb." />
        <section className="public-security-list">
          <article><h2>Authentisierung</h2><p>Die produktive Benutzeranmeldung wird über Azure App Service Authentication und eine Microsoft-basierte Identitätsplattform abgewickelt. Binso One speichert keine Benutzerpasswörter.</p></article>
          <article><h2>Rollen und Organisationen</h2><p>Zugriffe werden anhand von Benutzerkonto, Organisationsmitgliedschaft und Rolle geprüft. Plattformrollen sind von Kundenrollen getrennt.</p></article>
          <article><h2>Datenbank und Transport</h2><p>Die Produktionsumgebung verwendet PostgreSQL und verschlüsselte Verbindungen. Geheimnisse und Provider-Schlüssel werden serverseitig konfiguriert.</p></article>
          <article><h2>Zahlungen</h2><p>Zahlungs- und Abonnementprozesse sind für Stripe Checkout, Kundenportal und signaturgeprüfte Webhooks vorbereitet.</p></article>
          <article><h2>E-Mail-Versand</h2><p>Geschäftliche E-Mails können über Microsoft Graph verarbeitet werden. Versandstatus und Hintergrundverarbeitung werden getrennt nachvollzogen.</p></article>
          <article><h2>Verantwortungsvoller Betrieb</h2><p>Sicherheitsrelevante Konfigurationen, produktive Integrationen und Berechtigungen werden vor Freigabe separat geprüft. Kein System kann vollständige Sicherheit garantieren.</p></article>
        </section>
      </main>
    </PublicShell>
  )
}
