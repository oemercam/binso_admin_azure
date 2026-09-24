import { PublicCta, PublicPageIntro, PublicShell } from '@/components/public/public-shell'
import { createPublicMetadata } from '@/lib/config/seo'

export const metadata = createPublicMetadata({
  title: 'So funktioniert Binso One',
  description: 'Vom Kunden über Angebot und Auftrag bis zu Zeiterfassung, Rechnung und Zahlung: ein durchgängiger Geschäftsprozess ohne doppelte Erfassung.',
  path: '/how-it-works',
  keywords: ['Geschäftsprozess KMU', 'Angebot Auftrag Rechnung', 'Dienstleistungssoftware Schweiz'],
})

const flow = [
  ['Kunde erfassen', 'Erfasse nur die wichtigsten Angaben. Weitere Informationen können später ergänzt werden.'],
  ['Angebot erstellen', 'Erstelle ein Angebot direkt aus dem Kundenkontext und ergänze die benötigten Positionen.'],
  ['Auftrag weiterführen', 'Wird das Angebot angenommen, geht der Vorgang ohne Medienbruch in die operative Arbeit über.'],
  ['Zeit und Leistungen erfassen', 'Mitarbeitende erfassen ihre Arbeit dort, wo der Auftrag bereits bekannt ist.'],
  ['Rechnung erstellen', 'Übernimm abrechenbare Leistungen und erstelle daraus die Rechnung.'],
  ['Zahlung und Übersicht', 'Behalte offene Vorgänge, Status und relevante Finanzinformationen im Blick.'],
]

export default function HowItWorksPage() {
  return (
    <PublicShell>
      <main className="public-main">
        <PublicPageIntro eyebrow="So funktioniert Binso One" title="Ein klarer Ablauf für den Arbeitsalltag." description="Die Plattform folgt dem tatsächlichen Geschäftsprozess statt künstlichen Modulgrenzen." />
        <section className="public-process-list">
          {flow.map(([title, description], index) => <article key={title}><b>{String(index + 1).padStart(2, '0')}</b><div><h2>{title}</h2><p>{description}</p></div></article>)}
        </section>
        <PublicCta />
      </main>
    </PublicShell>
  )
}
