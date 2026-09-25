import { publicMetadata } from '@/lib/config/seo'
import { marketingFaq } from '@/lib/config/marketing-content'
import { PublicPageIntro, PublicShell } from '@/components/public/public-shell'

export const metadata = publicMetadata({ title: 'FAQ', description: 'Antworten auf häufige Fragen zu Binso One, Registrierung, Einrichtung, Nutzung, Abrechnung und Sicherheit.', path: '/faq' })

const additionalFaqs = [
  ['Wie melde ich mich an?', 'Der Kunden-Login läuft über den konfigurierten Customer-Identity-Provider. Binso One speichert dafür kein eigenes Passwort. Der interne Binso-Admin-Zugang ist davon getrennt.'],
  ['Kann ich meinen Plan später wechseln?', 'Ja. Verfügbare Planwechsel werden über die Abrechnungsfunktion von Binso One beziehungsweise das angebundene Zahlungsportal abgewickelt.'],
  ['Wo finde ich Hilfe?', 'Im Hilfe-Center findest du kurze Anleitungen. Für ein konkretes Anliegen kannst du einen Supportfall direkt digital erfassen.'],
] as const

export default function FaqPage() {
  return (
    <PublicShell>
      <main className="public-main public-main-narrow">
        <PublicPageIntro eyebrow="FAQ" title="Fragen zu Binso One." description="Kurze Antworten zu Einstieg, Einrichtung, Nutzung, Abrechnung und Support." />
        <section className="public-faq-list public-faq-full">
          {[...marketingFaq, ...additionalFaqs].map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}
        </section>
      </main>
    </PublicShell>
  )
}
