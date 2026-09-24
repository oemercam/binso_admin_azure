import { PublicCta, PublicPageIntro, PublicShell } from '@/components/public/public-shell'

const features = [
  ['Kunden und Kontakte', 'Firmen und Ansprechpartner zentral pflegen. Kundeninformationen bleiben dort, wo Angebote, Aufträge und Rechnungen entstehen.'],
  ['Angebote', 'Angebote mit Positionen erstellen, speichern und später in den nächsten Geschäftsschritt übernehmen.'],
  ['Aufträge', 'Laufende Arbeit strukturiert organisieren, ohne dass Informationen zwischen separaten Werkzeugen verloren gehen.'],
  ['Zeiterfassung', 'Arbeitszeit auf Kunden und Aufträge erfassen und für die spätere Abrechnung vorbereiten.'],
  ['Rechnungen', 'Rechnungen aus erbrachten Leistungen erstellen, Dokumente nachvollziehbar verwalten und den Status im Blick behalten.'],
  ['Verträge', 'Vertragsinformationen, Laufzeiten und wiederkehrende Prozesse zentral verwalten.'],
  ['Mitarbeitende und Rollen', 'Benutzer nach Rolle und Aufgabe berechtigen und den Zugriff auf Unternehmensdaten steuern.'],
  ['Finanzübersicht', 'Wichtige finanzielle Informationen und offene Vorgänge in einer kompakten Arbeitsansicht zusammenführen.'],
  ['Dokumente und Versand', 'Geschäftsdokumente erzeugen und vorbereitete Versandprozesse zentral nachverfolgen.'],
  ['Administration', 'Unternehmensprofil, Integrationen, Automationen und betriebliche Einstellungen zentral verwalten.'],
]

export default function FeaturesPage() {
  return (
    <PublicShell>
      <main className="public-main">
        <PublicPageIntro eyebrow="Funktionen" title="Eine Arbeitsumgebung statt vieler Einzellösungen." description="Binso One verbindet die wichtigsten Geschäftsprozesse für Dienstleistungsunternehmen in einer konsistenten Anwendung." />
        <section className="public-feature-detail-grid">
          {features.map(([title, description], index) => <article key={title}><span>{String(index + 1).padStart(2, '0')}</span><h2>{title}</h2><p>{description}</p></article>)}
        </section>
        <PublicCta />
      </main>
    </PublicShell>
  )
}
