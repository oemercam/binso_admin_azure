# Verbindliche UI-Foundation

## Quelle und Rangfolge

Die unveränderten Dateien in `docs/audit/v24/reference/` und die Ergänzungen in
`IMPLEMENTIERUNG.md` sind verbindlich. Ausschliesslich die Microsoft-Variante
verwenden. Kein Flow-, Noir-, Apple- oder anderes paralleles Design einführen.
Bei Widersprüchen gelten die jüngsten ausdrücklichen Entscheidungen in der
Anleitung (Dateiauswahl, Ringausrichtung, unveränderte Bottom-Navigation).

## Zuständigkeit

| Aufgabe | Bestehender Owner |
| --- | --- |
| Farben, Schriftstufen, Radien, Safe Areas, Motion | `app/design-system/theme.css` |
| Native Controls, Buttons, Zustände, ProgressBar, Datei-Button | `components/ui.tsx`, `app/design-system/primitives.css` |
| Shell, Rechte, Datenzugang, Navigation | `components/app-shell.tsx`, `components/operator.tsx` |
| Seiten-/Detailtitel, Tabs, Abschnitte, Sheets | `components/binso-ux.tsx`, `app/design-system/layout.css` |
| Listen, Tabellen, Filter, Sortierung, Identität | `components/records.tsx` |
| Diagramme und zentrierte Ringdarstellung | `components/statistics.tsx` |
| Öffentlicher Bereich und Auth | `components/marketing.tsx`, `components/auth-workspace.tsx`, `app/design-system/marketing.css` |
| Fachlich nötige Admin-Anordnung | `app/design-system/operator.css` |
| Responsive Anordnung, Touch und Reduced Motion | `app/design-system/manifest.json` |

`app/layout.tsx` und der isolierte Root-Fehlerzustand `app/global-error.tsx` importieren denselben Einstieg `app/binso-ui.css`; diese Datei importiert die
im Manifest registrierten Owner in festgelegter Reihenfolge. Die Dateianzahl ist keine Vorgabe. Responsive Zustände gehören zum jeweiligen Komponenten-Owner. Keine CSS-Datei pro Route, kein
`<style>` in React und keine eingebetteten visuellen Deklarationen. Gemessene
Diagrammwerte, Popupkoordinaten und Spaltenzahlen dürfen CSS-Variablen setzen;
die Darstellung dieser Variablen gehört weiterhin dem zentralen Owner.
OpenGraph-Bilder sind ein separater Bildrenderer und benötigen Inline-Stile.
E-Mails und PDF-Dokumente verwenden ihre bestehenden Renderer.

## Neue Seite

1. Den passenden Seitentyp aus `docs/audit/v24/page-matrix.json` auswählen.
2. Die bestehende AppShell mit Rollen und echten Daten verwenden. Titel und
   Aktionen über die Shell-/Heading-Slots setzen, nicht erneut zeichnen.
3. Listen aus RecordsControls + RecordsView/RecordRow zusammensetzen; Details
   aus DetailHeading, DetailTabs und DetailSections. RecordIdentity enthält
   Avatar, Name und sekundäre Information in einem zentralen Zeilenlayout.
4. Formulare aus Field, Input/Select/Textarea, FormSection und FormActions
   zusammensetzen; Dialoge über FormSheet/ActionSheet/FilterSheet öffnen.
5. Fehler-, Leer-, Lade-, Sperr- und Erfolgszustände aus ui.tsx verwenden.
6. Fehlende Adminansichten und neue Zustände im Review als **abgeleitet**
   kennzeichnen. Die Kennzeichnung gehört in die Abnahme, nicht als technische
   Erklärung in die Oberfläche der Endkunden.
7. Erst mit identischen Inhaltsbreiten, Browser, Schriftauflösung und
   vergleichbaren Daten gegen die Referenz rendern. Schutz der Bottom-Navigation
   und Tastatur-/Fokusverhalten prüfen. Keine Baselines automatisch akzeptieren.

Zuerst eine vorhandene Komponente erweitern, falls die fachliche Anforderung
wiederverwendbar ist. Neue Tokens nach ihrer Rolle benennen. Seiten dürfen keine
eigenen Varianten von Buttonhöhen, Schriftstufen, Radien oder Statusfarben setzen.
Eine neue fachliche Komponente braucht einen dokumentierten Owner und eine
Zuordnung im Routeninventar. Eine zusätzliche Foundation ist keine Erweiterung.

## Visuelle Regeln

### Wiederverwendbare Seitenmuster

Eine neue Liste übergibt `RecordsControls` mit dem `CreateAction` an den
`actions`-Slot der `AppShell`. Die Shell platziert Erfassen beim Titel und
Suche/Filter im gemeinsamen Listenbereich. `RecordsView` verwendet denselben
Controller für Suche, Filter, Sortierung und Rückkehrzustand. Mobile Zeilen
werden mit `RecordRow`, Desktopzellen mit den zentralen Spaltendefinitionen
erstellt. Keine eigene Toolbar oder zweite Suche zeichnen.

`CreateAction` ist auf dem Desktop ein beschrifteter blauer Button und auf Mobile
ein schwarzer runder Plus-Button. `RecordsControls` zeigt auf Desktop Filter und
Sortierung direkt neben der Suche; Mobile verwendet das gemeinsame Filter-Sheet.
Eine Erfassungsaktion darf nicht manuell zu einem viewportunabhängigen Kreis werden.

Dashboard und Finanzübersicht verwenden `CashOverview`: vier offene Kennzahlen,
auf dem Dashboard die vier berechtigten Schnellaktionen und letzte Rechnungen,
in der Finanzübersicht sechs Monatsbalken. Die ausführliche Statistik mit Ring,
benutzerdefiniertem Zeitraum und Ledger-Hinweisen gehört zu `/finanzen/analyse`.
Beide Darstellungen nutzen dieselben Finanzereignisse und Aggregationsfunktionen.
Fehlende berechtigte Kennzahlen bleiben unbekannt; jüngste Rechnungen sind kein
Ersatz für einen mandantenweiten Zähler. Negative Monatswerte bleiben unter der Nulllinie.

Fachbereichs-CSS darf keine gemeinsamen Komponenten oder Kundenansichten über
generische Containerselektoren neu gestalten. Insbesondere darf `operator.css`
keine `.page-container`-Regeln enthalten. Kartenradien, graue Flächen oder pauschale
Innenabstände dürfen nicht über einen späten Mobile-Block wieder eingeführt werden.
Gemeinsame Sektionen, Kennzahlen, Felder, Chatnachrichten und Sheets bleiben bei
ihrem Komponenten-Owner. Ein zentral abgelegter alter Override ist keine Migration.

Eine Detailseite setzt `backHref`, Titel, Status und Aktionen an der Shell.
`ActionsMenu` bleibt über den gemeinsamen Mobile-Fallback erreichbar; ein
explizites `mobileActions` ersetzt ihn bei fachlich besonderen Aktionen.
`DetailTabs`, `DetailSections` und `DetailDisclosure` besitzen die Anordnung.
Zusammengehörige Kontextaktionen verwenden `ContextActions`: Desktop-Commandbar
und mobiles Sheet. Bei einem bereits vorhandenen Dokument-Aktionsmenü werden
die mobilen Aktionen darin zusammengeführt (`mobile={false}` am ergänzenden
Desktop-Slot), damit kein zweiter gleichnamiger Einstieg entsteht.

Erfassungen behalten ihre realen API-Handler, Validierung, Entwurfswiederherstellung
und Sperren gegen doppelte Schreibvorgänge. `FormSheet` und `FormWizard` besitzen
Dialog, Fokus, Header und Abschlussaktionen. `Field` mit `Input`, `Select` oder
`Textarea` besitzt Beschriftung und Fehlerzuordnung. Dateiauswahl verwendet den
gemeinsamen Upload-Stil, nicht ein nachgebautes Eingabefeld.

Neue fachliche Daten bestimmen Werte und Verfügbarkeit. Ohne Rechnungsleserecht
zeigt die Kundenliste weder Finanzspalten noch den Offen-Filter. Währungen
werden getrennt angezeigt. Ein fehlender Wert wird nicht als fiktive Null
gerendert. Neue Diagramme verwenden die bestehenden Statistikkomponenten.

Nach einer neuen Route `node scripts/ux-inventory.mjs` ausführen, die
Seitentypmatrix aktualisieren und die Route in `scripts/qa-plan.mjs` erfassen.
Der Architekturtest verlangt vollständige Routenabdeckung; der Browserlauf
prüft anschliessend Darstellung und tatsächliche Bedienung.

- Light Mode: weisse Seite, Header und Inhaltsflächen; Blau für Aktionen,
  Auswahl und Fokus. Offene Abschnitte statt wiederholter umrahmter Karten.
- Desktop: gemeinsame Command Bar; ergänzende Aktionen ins bestehende Menü.
  Mobile: kurze Abläufe im Sheet; schwarzes rundes Plus und bestehende Navigation.
- Sekundärtext muss lesbar bleiben. Mobile Eingabefelder mindestens 16 px,
  aktive Touchziele mindestens 44 px. Kleine Vorschau-Schalter sind keine Vorlage
  für unzugängliche Produktbedienung.
- Zeilentrenner nur zwischen Einträgen; Finanzwerte echt und nach Währung
  getrennt. Keine Platzhalterwerte für eine optische Übereinstimmung erfinden.
- Der Ring zentriert Betrag und Label gemeinsam; Legende vertikal mittig,
  Farbmarkierung, Betrag und Prozentanteil beziehen sich auf dieselben Teile.

## Prüfung und Grenzen

`pnpm qa:fast --typecheck`, Referenz-/Navigations-/Foundation-Verträge und die
gezielte Browsermatrix gehören zum Paket. Neue Seiten müssen im Inventar und
in der Seitentypmatrix enthalten sein. Statische Zuordnung oder ein grüner Build
ist keine visuelle Abnahme. Browserbelege, abgeleitete Ansichten und verbleibende
Abweichungen werden im bestehenden Pilotbericht dokumentiert. Erst nach
erfolgreichem Pilotvergleich folgt die visuelle Freigabe weiterer Bereiche.
