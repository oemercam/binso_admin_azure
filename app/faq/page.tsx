import { PublicPageIntro, PublicShell } from '@/components/public/public-shell'
import { createPublicMetadata } from '@/lib/config/seo'

export const metadata = createPublicMetadata({
  title: 'FAQ',
  description: 'Antworten zu Binso One: Registrierung, 14-tägige Testphase, Preise, Mobile und PWA, Sicherheit, Datenverarbeitung und Support.',
  path: '/faq',
  keywords: ['Binso One FAQ', 'KMU Software Testphase', 'Business Software Support'],
})

const faqs = [
  ['Was ist Binso One?', 'Binso One ist eine Business-Plattform für Kunden, Angebote, Aufträge, Zeiterfassung, Rechnungen, Mitarbeitende, Verträge und zentrale Unternehmensprozesse.'],
  ['Für welche Unternehmen ist Binso One gedacht?', 'Der Schwerpunkt liegt auf Schweizer Dienstleistungsunternehmen und Teams, die ihre Geschäftsprozesse in einer gemeinsamen Anwendung führen möchten.'],
  ['Wie starte ich?', 'Du registrierst dich, meldest dich sicher an und richtest danach dein Unternehmen mit den wichtigsten Angaben ein. Anschliessend kannst du direkt den ersten Kunden erfassen.'],
  ['Muss ich sofort Zahlungsdaten angeben?', 'Nein. Die Registrierung und der Einstieg in die 14-tägige Testphase erfolgen ohne direkte Zahlung.'],
  ['Wie lange kann ich testen?', 'Der aktuell vorgesehene Testzugang beträgt 14 Tage. Vor einer kostenpflichtigen Nutzung werden die gewählten Konditionen angezeigt.'],
  ['Kann ich den Plan später wechseln?', 'Ja. Planwechsel werden über die Abrechnungsfunktion von Binso One beziehungsweise das angebundene Zahlungsportal abgewickelt.'],
  ['Funktioniert Binso One auf dem Smartphone?', 'Ja. Die Oberfläche ist für Desktop und Mobile optimiert und kann als PWA installiert werden.'],
  ['Speichert Binso One mein Passwort?', 'Nein. Die produktive Anmeldung wird über die konfigurierte Microsoft-basierte Identitätsplattform abgewickelt. Binso One verarbeitet die bestätigte Benutzeridentität.'],
  ['Wo werden meine Daten verarbeitet?', 'Binso One wird auf Microsoft Azure betrieben. Weitere Angaben zur Verarbeitung und zu eingesetzten Dienstleistern findest du in der Datenschutzerklärung.'],
  ['Wie erhalte ich Support?', 'Angemeldete Kunden können Supportfälle direkt digital in Binso One erfassen. Zusätzlich stehen die Kontaktmöglichkeiten auf der Kontaktseite zur Verfügung.'],
]

export default function FaqPage() {
  return (
    <PublicShell>
      <main className="public-main public-main-narrow">
        <PublicPageIntro eyebrow="FAQ" title="Fragen zu Binso One." description="Kurze Antworten zu Einstieg, Nutzung, Abrechnung, Sicherheit und Support." />
        <section className="public-faq-list public-faq-full">
          {faqs.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}
        </section>
      </main>
    </PublicShell>
  )
}
