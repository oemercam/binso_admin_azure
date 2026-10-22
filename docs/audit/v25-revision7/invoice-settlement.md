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

## Aktuelle CI-Nachweise

Full Development39726655822 auf1567eff4 ist erfolgreich: alle acht Browserjobs,
Build, exakter ZIP-Smoke, Scanner, native HTTP-/RLS- und Sechs-Verbindungsprüfungen,
Compliance-Development-Gate und abschliessende Quality. PR-Quality39726546798
und CodeQL39726546806 sind ebenfalls erfolgreich. Der Originalreport ist gegen
GitHub-Artefakt-SHA und den tatsächlichen Quell-Digest geprüft; siehe
[Zusammenfassung](ci-1567eff4.json) und [Git-Blob-Abgleich](ci-1567eff4-source.json).
Die vorherige erfolgreiche d052a3be-CI wird für diese Änderung nicht übernommen.

Reale Geräte, unabhängige Finanz-/Klausel-/Originalabnahme und externer
Zustellnachweis bleiben offen. Kein produktiver Datenbankeingriff und kein
Banktransfer sind durch die synthetischen Prüfungen nachgewiesen oder autorisiert.

## Erster nativer CI-Lauf und Ursachen

Auf5028b0a6 bestanden die neuen echten HTTP-Überzahlungsfälle. Der anschliessende
ältere Statusfall fand dieselbe bereits bezahlte Testrechnung vor. Die neue
Sequenz verwendet nun eigene ausgestellte Testrechnungen; die alte Assertion
bleibt unverändert. Der Paralleltest versuchte ausserdem, die von Migrationen
angelegte Runtime-Rolle erneut zu provisionieren. Die strenge Ablehnung bleibt
erhalten; der isolierte Test kopiert den geprüften Rechtevertrag stattdessen auf
eine eigene temporäre Rolle ohne Superuser/RLS-Bypass und entfernt sie danach.
Beide Fehler werden durch einen neuen CI-Lauf nachgewiesen, nicht übergangen.

Auf006f0c3b bestehen die nativen HTTP-/Parallelprüfungen, Security-Audit,
Build und exakter ZIP-Smoke. Die Browserprüfung fand noch zwei alte Erwartungen:
einen Status statt der drei unabhängigen Achsen und einen Auftrags-Rechnungslink
ohne den neuen Rückkehrparameter. Die Nachfolgetests verlangen jede erwartete
Achse genau einmal und den exakten Rückkehrlink. Kein Gate wird übersprungen.

Der Browserlauf aufe99d361f prüfte zusätzlich die verzögerte Erstladung: Die
Rechnungswahl war nach Umstellung auf den Einzelabruf nicht mehr gesperrt. Der
Nachfolger stellt die Lade-Sperre wieder her; Betrag/Notiz bleiben bearbeitbar.
Der vorhandene Negativtest verzögert nun auch die tatsächliche Einzelabfrage.
Keine neue vollständige Abnahme aus den vorherigen Teilergebnissen ableiten.

Die oben dokumentierten Zwischenfehler sind im aktuellen1567eff4-Gesamtlauf
behoben und positiv/negativ geprüft; sie werden nicht als übersprungene Tests behandelt.
