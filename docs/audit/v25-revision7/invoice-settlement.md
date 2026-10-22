# Rechnungszahlung und getrennte Statusachsen

Fortsetzung von Draft307 auf demselben Branch. Bezug: R7-30-001/002/003/006 und
R7-31-012. Dies ist eine Implementierung mit begrenzten Nachweisen, keine
Produktions-, Geräte- oder vollständige fachliche Abnahme.

## Nachgewiesene Ursachen und Korrektur

- Der bisherige Zahlungsweg lehnte jeden Betrag oberhalb des offenen Saldos ab.
  Diese sichere Standardsperre bleibt erhalten. Ein tatsächlich eingegangener
  Mehrbetrag kann nur nach ausdrücklicher Bestätigung erfasst werden. Diese ist
  an Rechnung, Betrag und die vier geprüften Werte offener Betrag, Zahlungen,
  Gutschriften und Rückerstattungen gebunden. Der Server vergleicht sie unter
  der Rechnungssperre; auch zwei konkurrierende Bestätigungen mit Nullsaldo
  können deshalb nicht beide denselben alten Stand verwenden.
- Der Buchungsweg nutzt die bestehenden Zahlungs-, Guthaben- und datierten
  Rückerstattungsdaten. Rechnung und fakturiertes Volumen bleiben unverändert.
  Tatsächlicher zusätzlicher Zahlungseingang wird als Cash erfasst, das Guthaben
  gesondert als Verpflichtung ausgewiesen. Es wird keine Banküberweisung ausgelöst.
- Idempotenz und Audit bleiben transaktional. Ein Auditfehler rollt die Buchung
  zurück. Ein Wiederholungsaufruf gibt den ursprünglichen Beleg zurück, auch
  nach einer späteren Rückerstattung. Ein widersprüchlicher historischer
  Zahlungszähler blockiert die neue Überzahlung statt eine Abstimmung vorzutäuschen.
- Das Zahlungsformular lädt die konkret gewählte Rechnung statt eines begrenzten
  50er-Inventars. Bestätigte Belege bleiben auswählbar. Ein Serverkonflikt löscht
  nur die veraltete Bestätigung, erhält die Eingabe und lädt die Rechnung erneut;
  keine automatische erneute Buchung. Der gemeinsame DirectorySelect bleibt der
  einzige Auswahl-Owner.
- Die bisherige Einzelprojektion konnte teilweise bezahlt und überfällig nicht
  gleichzeitig ausdrücken. Gemeinsame JavaScript-/SQL-Owner liefern nun Dokument,
  Zahlung und Fälligkeit getrennt, inklusive Überzahlung und vollständiger
  Gutschrift. Filter arbeiten vor Pagination mit derselben SQL-Projektion.
  Listen, Detail, Auftrags-Rechnungen und Finanzfilter verwenden diesen Owner.
- Das Rechnungsdetail zeigt den tatsächlichen letzten Dokument-Versandversuch,
  getrennt von Mahnungen. Fehlender Nachweis bleibt fehlender Nachweis;
  Providerannahme wird nicht als Zustellung ausgegeben. Der neue Index0079
  unterstützt diese gezielte Abfrage. Er ist nur in isolierten Testdatenbanken
  angewendet, nicht produktiv. Ein verifizierter Provider-Zustellkanal bleibt offen.
- Zurückgezogene Angebote werden im Angebotskontext nicht als stornierte
  Rechnung bezeichnet. Navigation, FAB, bestehende Berechtigungen und PDF-Historie
  bleiben erhalten. Vier Sprachkataloge enthalten die neuen Bedienmeldungen.

## Tatsächlich ausgeführte lokale Prüfungen

- `scripts/migration-test.mjs`: bestanden nach Ergänzung der neuen Adapterbindung;
  bestehende Überbuchungs-Negativtests bleiben erhalten. Neue SQL-/JavaScript-
  Statusparität, Rollen/RLS, Saldenbindung, Audit-Rollback, Replay, reale
  Guthaben-/Rückerstattungsprojektion und unverändertes fakturiertes Volumen.
- `scripts/document-presentation-test.mjs`: echte PDF-/QR- und SSR-Regressionsfälle,
  Teilzahlung plus Überfälligkeit, Überzahlung, fehlender/angenommener Versand,
  unabhängige Filter und unveränderte historische Darstellung bestanden.
- `scripts/statistics-test.mjs`: Kennzahlen, drei Datenbank-Zeitzonen, datierte
  Gutschrift/Rückerstattung und separate Guthabenanzeige bestanden.
- `scripts/task-focused-ux-test.mjs`, `scripts/ux-regression-test.mjs`,
  `scripts/localization-test.mjs`, `scripts/localization-coverage-test.mjs`,
  Typecheck und gezieltes ESLint bestanden.

## Noch auszuführende Nachweise dieser Änderung

Neue echte HTTP-Fälle für alle acht Rollen, Mandantentrennung, ungültige und
veraltete Bestätigungen, Replay und serverseitige Statusfilter sind im bestehenden
nativen CI-Test ergänzt. Ebenso sechs physische PostgreSQL-Verbindungen und
Browserfälle für Standard-aus, erneute Bestätigung nach Saldenänderung und
Guthabenanzeige. Erst ihr aktueller CI-Lauf qualifiziert diese neue Quelle.
Die vorherige erfolgreiche d052a3be-CI ist dafür kein Nachweis.

Reale Geräte, unabhängige Finanz-/Klauselabnahme und externer Zustellnachweis
bleiben gesondert offen. Keine produktive Migration, keine Zahlung beim Provider,
kein Merge und kein Deployment sind durch diese Tests freigegeben.
