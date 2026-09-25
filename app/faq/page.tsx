import { publicMetadata } from '@/lib/config/seo'
import { marketingFaq } from '@/lib/config/marketing-content'
import { PublicCta, PublicPageIntro, PublicShell } from '@/components/public/public-shell'

export const metadata = publicMetadata({ title: 'FAQ', description: 'Antworten auf häufige Fragen zu Binso One, Registrierung, Einrichtung, Nutzung, Abrechnung und Sicherheit.', path: '/faq' })
const additionalFaqs = [
  ['Wie melde ich mich an?', 'Der Kunden-Login läuft über den konfigurierten Customer-Identity-Provider. Binso One speichert dafür kein eigenes Passwort. Der interne Binso-Admin-Zugang ist davon getrennt.'],
  ['Kann ich meinen Plan später wechseln?', 'Ja. Verfügbare Planwechsel werden über die Abrechnungsfunktion von Binso One beziehungsweise das angebundene Zahlungsportal abgewickelt.'],
  ['Wo finde ich Hilfe?', 'Im Hilfe-Center findest du kurze Anleitungen. Für ein konkretes Anliegen kannst du einen Supportfall direkt digital erfassen.'],
] as const

export default function FaqPage() {
  return (
    <PublicShell>
      <main className="v80-main v812-page">
        <PublicPageIntro eyebrow="FAQ" title="Kurz beantwortet." description="Die wichtigsten Fragen zu Einstieg, Nutzung, Abrechnung, Sicherheit und Support." />
        <section className="v812-faq-grid"><div><span className="v80-eyebrow">Binso One</span><h2>Alles Wichtige auf einen Blick.</h2><p>Klare Antworten ohne Kleingedrucktes im Vordergrund.</p></div><div className="v812-faq-list">{[...marketingFaq, ...additionalFaqs].map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></section>
        <PublicCta />
      </main>
    </PublicShell>
  )
}
