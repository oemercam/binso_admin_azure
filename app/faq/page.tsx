import { publicMetadata } from '@/lib/config/seo'
import { PublicPageIntro, PublicShell } from '@/components/public/public-shell'

export const metadata = publicMetadata({ title: 'FAQ', description: 'Antworten auf häufige Fragen zu Binso One, Registrierung, Nutzung, Abrechnung und Sicherheit.', path: '/faq' })

const faqs = [
  ['Was ist Binso One?', 'Binso One ist eine Business-Plattform für Kunden, Angebote, Aufträge, Zeiterfassung, Rechnungen, Mitarbeitende, Verträge und zentrale Unternehmensprozesse.'],
  ['Für welche Unternehmen ist Binso One gedacht?', 'Der Schwerpunkt liegt auf Schweizer Dienstleistungsunternehmen und Teams, die ihre Geschäftsprozesse in einer gemeinsamen Anwendung führen möchten.'],
  ['Wie starte ich?', 'Du registrierst dich, meldest dich sicher an und richtest danach dein Unternehmen mit den wichtigsten Angaben ein. Anschliessend kannst du direkt den ersten Kunden erfassen.'],
  ['Muss ich sofort Zahlungsdaten angeben?', 'Nein. Die Registrierung startet ohne direkte Zahlung. Der konkrete Abrechnungsprozess hängt vom gewählten Plan und der aktivierten Testphase ab.'],
  ['Wie lange kann ich testen?', 'Der aktuell vorgesehene Testzugang beträgt 14 Tage. Vor einer kostenpflichtigen Nutzung werden die gewählten Konditionen angezeigt.'],
  ['Kann ich den Plan später wechseln?', 'Ja. Planwechsel werden über die Abrechnungsfunktion von Binso One beziehungsweise das angebundene Zahlungsportal abgewickelt.'],
  ['Funktioniert Binso One auf dem Smartphone?', 'Ja. Die Oberfläche ist für Desktop und Mobile optimiert und kann als PWA installiert werden.'],
  ['Speichert Binso One mein Passwort?', 'Nein. Die produktive Anmeldung wird über die konfigurierte Microsoft-basierte Identitätsplattform abgewickelt. Binso One verarbeitet die bestätigte Benutzeridentität.'],
  ['Wo werden meine Daten verarbeitet?', 'Binso One wird auf Microsoft Azure betrieben. Weitere Angaben zur Verarbeitung und zu eingesetzten Dienstleistern findest du in der Datenschutzerklärung.'],
  ['Wie erhalte ich Support?', 'Über die Support-Seite kannst du dein Anliegen einordnen und die aktuellen Kontaktmöglichkeiten sehen.'],
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
