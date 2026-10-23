# Paket 6 — Rabatteditor, Vorschau und PDF-Parität

22.10.2026, `feat/v25-revision7`, Draft-PR307. Ausgangspunkt Paket5
`6d8eb7697f342c65eabe0add54de22434aca26ea`: Quality39758636709, CodeQL39758636590,
Readiness39758636705 und Avatar39758636633 erfolgreich. Die Abhängigkeit ist erfüllt.

## Umsetzung

- `components/documents.tsx`: bestehender Angebots-/Rechnungseditor lädt und
  serialisiert Positions-/Gesamtrabatte, Steuerbefreiung und den gespeicherten
  Rechenstand. Einziger Rechen-Owner bleibt `calculateDocument` aus Paket5.
  Editorberechnung ist Vorschau; Speichern/PDF bleiben serverseitig massgeblich.
- Positionsrabatte Prozent/fix/entfernt sind im bestehenden Positionsdialog
  erreichbar, auch über das Positionsmenü. Haupttabelle erhält keine Rabattfelder.
  Der vorhandene Dialog behält Menge, Einheit, Preis und Beschreibung sowie
  Entfernen; Duplizieren/Verschieben/Nummerierung bleiben im bisherigen Owner.
- Gesamtrabatt wird über das kontextuelle Rabattmenü in einem vorhandenen FormSheet
  bearbeitet. Kundenstandard wird bei neuen Dokumenten sichtbar vorgeschlagen,
  erst nach ausdrücklicher Bestätigung übernommen und weder addiert noch über einen
  ausdrücklichen Dokumentrabatt gelegt. Entfernen bleibt eine explizite Auswahl.
  Gespeicherte Kundenrabatte werden bei späterer Bearbeitung als dokumenteigene
  Definition behandelt; spätere Profiländerungen ersetzen sie nicht.
- Gemeinsamer Summenbereich für Editor, Review und Detail: Roh-Zwischentotal,
  tatsächlich verwendete Rabattstufen, Steuergruppen/Befreiung, Rundung und Total.
  Rechtsbündige Beträge über den vorhandenen CSS-Owner; keine neue UX-Foundation.
  Ungültige Werte verhindern Übernahme/Speicherung und bleiben korrigierbar.
- Vorschauadapter normalisiert die vorhandene Schweizer Dezimaleingabe und
  übergibt explizit jede Positionssteuer und Rabattdefinition. Wiederöffnen,
  Entwurfswiederherstellung und Angebot→Rechnung behalten dokumenteigene Rabatte.
  Bereits versendete Angebote bleiben nur über den bisherigen Versionsprozess
  bearbeitbar; historische archivierte PDFs werden nicht erzeugt/überschrieben.
- `lib/client/backend.ts`: abwärtskompatibler optionaler PATCH-Idempotenzheader.
  Dokumenteditor behält die Kennung bei identischen Wiederholungen nach Fehlern.
- Notwendige Speicherschutz-Ergänzung in `app/api/documents/[number]/route.ts` und
  `lib/server/repositories/business-api.ts`: exakter geladener Änderungsstand
  `document_revision` wird unter bestehender Zeilensperre verglichen; unterschiedliche
  parallele Änderungen führen zu einem Gewinner und einem409-Konflikt. Replay
  derselben bestätigten Anfrage bleibt im bestehenden Idempotenzverfahren.
- `lib/customer-identity.ts` transportiert den bereits vorhandenen Kundenstandard.
  `lib/locales/messages.json` ergänzt ausschliesslich neue Rabatt-/Konflikttexte.
- `lib/server/document-pdf.ts`: bestehender Renderer zeigt Rabattstufen nur bei
  Verwendung, Steuergruppen einmal und Gesamttotal. Summenreihen umbrechen vor
  dem Seitenende. Legacy-Pfad bleibt erhalten. QR-Abmessungen und separate letzte
  A4-Seite sind unverändert; Betrag stammt aus demselben rabattierten Dokumenttotal.
- `app/design-system/documents.css`: nur Abstände/Raster der Rabattfelder und
  rechtsbündige Summen im vorhandenen Owner. Keine Änderungen an Navigation/FAB.

Keine neue Berechnungslogik, Datenbankmigration, produktive Datenänderung oder
Änderung an fremden Paketen. Die vorhandenen Metadaten-Generatoren aktualisieren
nur Quellbindung und Komponenten-Zuordnung, ohne visuelle Abnahme zu behaupten.

## Gezielte lokale Nachweise

- `document-presentation-test.mjs`: erfolgreich; tatsächliche Editorfunktionen
  für Laden/Payload/Preview, Entfernen und ungültige Eingaben. Produktions-PDFs
  samt QR, Sprache, Seitenumbrüchen und Legacy bleiben geprüft. Rabattprobe:
  `1’000 − 10 % Position − 5 % Dokument = 855.00 netto + 69.26 = 924.26 CHF`.
  Tatsächlicher QR-Auslesewert924.26 auf separater letzter A4-Seite, auch mehrseitig.
- `discount-test.mjs` / `discount-contract.mjs`: erfolgreich; alle18 fachlichen
  Zahlenfälle einschliesslich gemischter Steuern/Befreiung/0/100/Rundung,
  echte migrierte PGlite-Persistenz, Runtime-RLS, Wiederholung, Audit-/Transaktions-
  Rollback, Kundenstandard-Isolation, Ausstellung/Archiv und neuer Revisionskonflikt.
- `document-lines-test.mjs`, `data-foundation-test.mjs`: erfolgreich; bestehende
  Positionsoperationen und API-/Session-/Fehlerverträge bleiben erhalten.
- Typecheck, gezieltes ESLint, CSS-, Localization- und Workflow-Sicherheitsvertrag,
  Syntax-/Diff-Check sowie Foundation-/UX-Verträge erfolgreich.

Der erste SSR-Prüflauf benötigte die neuen tatsächlich aufgerufenen Editorhelfer
im bestehenden Testadapter; ergänzt, ohne Erwartungen zu lockern. Der bestehende
UX-Vertrag meldete veraltete Komponenten-Zuordnung; diese wurde mit dem vorhandenen
Generator erneuert und danach erfolgreich geprüft. Keine neue Gesamtanalyse.

## Browser und native HTTP-Prüfung am Paketcommit

`scripts/document-discount-browser.mjs`, eingebunden in den vorhandenen Browser-
Harness und `.github/workflows/document-discounts.yml`, prüft ausschliesslich
Desktop1440 und Mobile390: beide Rabattstufen, Kundenstandard, Entfernen/Wechsel,
ungültige Werte, tatsächliches Wiederöffnen/Reload, Fehler und verlorene
Speicherantwort mit gleicher Kennung, Konflikterhalt sowie Footer-/Viewport-Geometrie,
Inter und12px-Feldradius. Synthetische isolierte API-Fixtures, echte bestehende
SSR-QA-Session; kein Login-Bypass. Screenshots werden als CI-Artefakt erhalten.

`scripts/api-tenant-postgres-test.mjs` ergänzt echte HTTP-/PostgreSQL-Prüfungen:
serverseitige Vorschau924.26, tatsächlich ausgelesenes Vorschau-PDF sowie zwei
verschiedene gleichzeitige Änderungen eines geladenen Revisionsstands mit200/409.
Bestehende Rollen-/Mandanten- und Archivnachweise bleiben in den Pflicht-Gates.

Lokal fehlt der native PostgreSQL-Server für die Browser-Authentifizierungsfixture.
Diese neuen Browser-/HTTP-Fälle zählen bis zum aktuellen erfolgreichen CI-Lauf
ausdrücklich als ausstehend. Aktueller Commit/CI-Status und tatsächliche Resultate
stehen im Abschlussbericht. Keine vollständige V25-Browsermatrix.

Physische Geräte und menschliche visuelle Freigabe sind separate Abnahmen.
Kein Merge, keine produktive Migration, kein Deployment; Paket7 nicht begonnen.

## CI-Korrektur nach dem ersten Paketlauf

Am Commit `3f262255` bestanden Build, authentifizierte native HTTP-/PostgreSQL-
Prüfung, CodeQL, Rechnungs-Readiness und Avatar. Zwei Testadapter scheiterten:
Der extrahierte Speicherhandler benötigte die tatsächlichen Berechnungshelfer
und eine vollständige Zahlen-Fixture; der mobile Browser suchte den Vorschlag
als exakten Text ohne den tatsächlich angezeigten Zusatz `: 5 %`.

Die Adapter verwenden jetzt die vorhandene zentrale Berechnung mit passendem
Entwurf/Servertotal und den vollständigen sichtbaren Vorschlag. Die bisherigen
Erwartungen bleiben erhalten; zusätzlich wird ein Speicherversuch mit 101 %
Rabatt ohne API-Schreibzugriff geprüft. `ux-regression-test.mjs` besteht lokal.
Der korrigierte Browserfall bleibt bis zum erfolgreichen neuen CI-Lauf offen.
Keine Produktlogik, Sicherheitsprüfung oder Pflichtprüfung wurde abgeschwächt.

## Mobile Auswahl über dem Positionsdialog

Am Korrekturcommit `37d382d1` bestand der vollständige Quality-Lauf
[39764438813](https://github.com/oemercam/binso_admin_azure/actions/runs/39764438813)
sowie CodeQL und Rechnungs-Readiness. Der Rabatt-Browserlauf
[39764438831](https://github.com/oemercam/binso_admin_azure/actions/runs/39764438831)
erreichte die mobile Positionsrabatt-Auswahl und scheiterte an abgefangenen
Pointer-Ereignissen: das zentrale portallierte Menü lag auf100, der mobile
Positionsdialog auf120. Der Desktopteil einschliesslich Speicher-/Replay-/
Konfliktfällen und der ausdrückliche Kundenstandard waren bereits durchlaufen.

Der vorhandene gemeinsame CSS-Owner ordnet das Auswahlmenü jetzt unterhalb
der Bestätigungsebene190 auf189 ein. Keine erzwungenen Klicks, keine Änderung
an Navigation, FAB, Finanzlogik oder Test-Erwartungen.

Lokal mit tatsächlichem SelectControl und den vollständigen vorhandenen
Designsystem-CSS-Ownern im installierten Edge/Chromium geprüft: vorher bei390px
Pointerziel blockiert (Menü100/Sheet120), danach bei390px und1440px anklickbar
mit tatsächlichem React-Wertwechsel auf `percent` (Menü189, Sheet120/80).
CSS-Architektur und UX-Style-Gegenfälle erfolgreich. Dies ist eine gezielte
Control-Prüfung, keine SSR-/Geräte-Gesamtabnahme; der unveränderte Paket-
Browserworkflow bleibt am neuen Commit gesondert zu bestätigen.
