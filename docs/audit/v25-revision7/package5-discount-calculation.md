# Paket 5 — zentrale Rabattberechnung und Persistenz

22.10.2026; Ausgangspunkt `3ccb0bc19aea9e5cb0f8dfe86faa8ac30ea72065`,
Branch `feat/v25-revision7`, Draft-PR307. Grundlage ist der freigegebene
[Paket-4-Vertrag](../../architecture/v25-discount-contract.md).

## Implementierter Umfang

- `lib/money.ts` erweitert den bestehenden Dezimal-Owner um `calculateDocument`.
  Genau eine serverseitige Rabattberechnung für Position/Dokument, Prozent/fix,
  exakte gekürzte BigInt-Brüche, proportionale Steuergruppen und deterministische
  Cent-Ausweise. Keine Floating-Point-Zwischenrechnung. Bestehende Geldfunktionen
  und Legacy-SQL-Berechnung bleiben für unveränderte Bestandsquellen verfügbar.
- `lib/financial-status.ts` stellt den gemeinsamen Owner für die bestehende
  Finanz-Service-/Testfoundation bereit. `lib/server/repositories/business-api.ts`
  berechnet ausschliesslich aus Eingabepositionen und Rabattdefinitionen, niemals
  aus Client-Summen; speichert Resultat und Definitionen gemeinsam mit Positionen,
  Rechnungsbeträgen, Audit und Idempotenznachweis in der bestehenden Transaktion.
- `app/api/documents/route.ts` und `[number]/route.ts` transportieren Definitionen,
  Steuerbefreiungsmarker und Herkunft. Rabattänderungen per PATCH verlangen einen
  Idempotency-Key; paralleler gleicher Inhalt wird einmal verarbeitet, geänderter
  Inhalt unter derselben Kennung verweigert. Vorhandene Legacy-Schreibpfade ohne
  neue Rabattangaben bleiben kompatibel. Gespeicherte Rabatte/Steuerbefreiungen
  dürfen nicht durch einen alten Editor ohne deren ausdrückliche Übernahme
  verschwinden; der Server verweigert diesen Save.
- `app/api/documents/preview/route.ts` nutzt denselben Owner. Mit `output:
  "calculation"` liefert die bestehende lesende Vorschau das Berechnungsergebnis
  und einen als **nicht angewendet** markierten Kundenstandard-Vorschlag; ohne
  diesen Modus bleibt sie PDF-Vorschau. Bestätigte Übernahme: explizite
  `discount: {kind:"percent",value:...}` und `discountOrigin:"customer"` beim Save;
  ein inzwischen geänderter Standard wird verweigert. Manuell gesetzter Rabatt
  oder `{kind:"none"}` wird nicht durch einen Kundenstandard ersetzt/addiert.
  UI-Bedienung des Vorschlags ist nicht Bestandteil dieses Backend-Pakets.
- `lib/server/document-amount-sql.ts` und die gemeinsame Dokumentprojektion lesen
  bei neuer Berechnungsrevision die gespeicherten Resultate; Legacy bleibt beim
  bisherigen SQL. Listen, Details und Angebote-Reporting erhalten dieselben Summen.
- `lib/server/document-process.ts` prüft bei neuen Angeboten den rabattierten
  Betrag. Die bestehende positive Ausstellungsgrenze bleibt bestehen; ein
  100-%-Rabatt darf als Nullentwurf gespeichert werden, erzwingt keine Ausstellung.
  `lib/server/offer-revisions.ts` ordnet den Entwurf der neuen Angebotsversion zu;
  das bereits archivierte Angebotsdokument wird nicht verändert.
- `lib/server/document-pdf.ts` zeigt vorhandene Resultate im bestehenden Renderer:
  Rabattdefinitionen, Abzüge, Steuergruppen und Rundungsausgleich. Keine neue
  PDF-Engine, keine Neugestaltung, keine Neuberechnung aus PDF-Feldern.
- `lib/locales/messages.json` ergänzt ausschliesslich die neuen Rabatt-/Fehlertexte
  und PDF-Bezeichnungen in EN/FR/IT; kein deutscher stiller Sprachfallback.

## Additive Migration0082

`database/migrations/0082_document_discount_calculation.sql` ergänzt nullable
`calculation`-Snapshots an Angeboten und Rechnungen. Enthalten sind Berechnungs-
und Dokumentversion, Währung, Definitionen/Positionen, Herkunft/Vorschlag, exakte
Grundlagen/Anteile als Zähler/Nenner, Steuergruppen und gerundete Resultate.
Constraints prüfen Revision/Währung und die Übereinstimmung der Rechnungsbeträge;
Trigger sperren Änderungen der Berechnung ausgestellter Dokumente.

Keine Rückrechnung, kein Backfill, kein Rewrite bestehender Snapshots/PDFs. Der
isolierte Runner vergleicht sämtliche vorherigen Dokumentwerte vor/nach0082.
Beim Ändern eines Entwurfs wird der alte Berechnungscache ausschliesslich innerhalb
der Transaktion entfernt und durch den neuen ersetzt; Fehler rollen alles zurück.
Keine produktive Migration ausgeführt oder freigegeben.

## Tatsächliche lokale Prüfungen

- `scripts/discount-test.mjs`: erfolgreich mit PGlite, echten Migrationen,
  Runtime-Rolle/RLS und produktiven Services. Leere isolierte Datenbank zwingend.
- `scripts/discount-contract.mjs`: alle18 numerischen Vertragsfälle; Prozent/fix,
  Kombination, gemischte Sätze/Befreiung, 0/100 %, Rundungsgrenzen und Restverteilung,
  negative/zu hohe/mehrdeutige Rabatte, Präzision und Währung. Persistenz von
  Angebot/Rechnung, Read-Parität, ignorierte Client-Summe, Create-/Update-Replay,
  Schlüsselkonflikt, Audit-/Transaktionsrollback, Rollen-/Mandantengrenze,
  Kundenstandard-Isolation, neue Ausstellung/PDF-Archiv und Bestandsvergleich.
- `scripts/document-lines-test.mjs`, `scripts/document-presentation-test.mjs`:
  erfolgreich; bestehende Dokument-/QR-/Sprachfälle erhalten, neue tatsächliche
  PDF-Auslese prüft beide Rabattstufen, MwSt. und das Total924.26.
- `scripts/statistics-test.mjs`, `scripts/customer-financial-projection-test.mjs`:
  erfolgreich; bestehende Finanz-/Projektionsverträge bleiben erhalten.
- Typecheck, gezieltes ESLint der geänderten TypeScript-Dateien, Syntax-/Diff-Check
  sowie Localization-Coverage und bestehende Foundation-Integrationsprüfung: erfolgreich.

Ein anfänglicher neuer Test verwendete den falschen Archivschlüssel `id` statt
`invoice_id`; korrigiert. Die erste gehärtete Constraint-Fassung hatte einen
SQL-Syntaxfehler; korrigiert und Migration erneut isoliert bestanden. Der neue
PDF-Fall verwendet jetzt wie die produktive Projektion normalisierte Definitionen.
Der Localization-Vertrag meldete fehlende neue API-Texte; deren Übersetzungen
wurden ergänzt und der Vertrag erneut erfolgreich geprüft.
Keine bestehenden Sicherheitsprüfungen abgeschwächt oder Gates deaktiviert.

## Native CI und verbleibende Grenzen

`scripts/postgres-parallel-test.mjs` verwendet denselben neuen Vertragsrunner
zusätzlich auf PostgreSQL: sechs unterschiedliche Backend-PIDs beim Create-Replay,
parallele Update-Wiederholung, Audit/Transaktion/RLS und Archivierung. Dazu ergänzt
`scripts/api-tenant-postgres-test.mjs` tatsächliche HTTP-Fälle für alle acht Rollen,
Mandantengrenze, manipuliertes Total, negative Validierung, sechs PATCH-Replays,
Kennungskonflikt und den nicht automatisch angewendeten Kundenrabatt-Vorschlag.
Beide laufen in den bestehenden erforderlichen Quality-Gates; lokal ist kein
nativer PostgreSQL-Server vorhanden. Bis zum erfolgreichen aktuellen CI-Ergebnis
bleiben diese neuen nativen Nachweise ausdrücklich ausstehend.

Die CLI-PGlite-Prüfung ist kein Nachweis physischer paralleler Verbindungen.
Aktueller Paketcommit und tatsächlicher CI-Status stehen im Abschlussbericht.
Keine Browsermatrix, UI-Übernahmebedienung, produktiven Daten, Produktivmigration,
Merge oder Deployment; Paket6 wird nicht begonnen. Echte Anwenderabnahme der
späteren Rabattbedienung bleibt getrennt von diesem Rechen-/API-Paket.
