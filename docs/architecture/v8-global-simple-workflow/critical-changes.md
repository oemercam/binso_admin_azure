# V8 – kritische Fachänderungen zur gesonderten Freigabe

Der Owner hat die lokale Umsetzung mit isolierten Tests ausdrücklich freigegeben.
Keine produktive Migration oder externe Änderung freigegeben. Die reine Anzeige
von sechs Auswahloptionen würde bestehende Finanz-/Datenverträge nicht ergänzen.

## Gemeinsame Abrechnungsmodelle

Vorgeschlagen ist ein gemeinsamer versionierter Modell-Owner für Angebot und
Auftrag; Rechnungspositionen speichern weiter ihre finalen Preis-/Steuer-/Quell-
Snapshots. Bestehende Zahlen werden nicht aus einem neuen Modell rückwirkend
neu berechnet oder umgebucht. Altdaten behalten ihre vorhandene Herkunft und
erhalten ohne sicheren Beleg keine erfundene Modellzuordnung.

- Fixpreis: explizite vereinbarte Beträge, interne Zeiten keine zusätzlichen Positionen.
- Aufwand: ausschliesslich freigegebene verrechenbare Restleistung; transaktionale Reservierung.
- Menge: vorhandene Einheit/Menge/Preis-Engine erhalten.
- Gemischt: eindeutig getrennte Quellen/Beträge, keine doppelte Zuordnung.
- Wiederkehrend: Periode und Leistung, ausdrücklich geprüfte Entwürfe; keine automatische Ausstellung.
- Meilensteine: versionierte Etappen/Teilbeträge mit explizitem erfülltem/abrechenbarem Zustand.

Akonto, Teil-, Schlussrechnung und Gutschrift bleiben Forderungs-/Korrekturverfahren.
Vor Umsetzung sind deren Referenzen, Anrechnung, verbleibender Saldo, Steuer-
Snapshots, Storno/Erstattung und Mehrwährungsgrenzen in bestehenden Engines zu
modellieren und mit konkurrierenden/tenantfremden Gegenfällen abzusichern.
DB-Constraints/RLS, Rollen, Planrechte, Revisionen, Idempotenz und Audit-Rollback
müssen alle neuen direkten und verknüpften Pfade einschliessen. Keine Banküberweisung.

## Budgets

Nicht gesetzt und null CHF/0 Stunden werden unterschieden. Vorgeschlagen sind
nullable neue/veränderte Budgetangaben mit vorhandener Versionsprüfung und
separaten Rechten für Personalkosten. Historische Nullen dürfen nicht pauschal in
„nicht gesetzt“ umgedeutet werden. Eine additive Migration und ein überprüfbarer
Kompatibilitätspfad müssen vorab konkret freigegeben werden. Keine Änderung an
historischen Migrationen, keine stillen Datenkorrekturen.

## Sicherheitsentscheidung bereits geklärt

Der Owner hat den bisherigen Kundenlogin ausdrücklich bestätigt. V8 reaktiviert
keine zusätzliche Kunden-Login-MFA und keine Passkey-Anmeldung. Bestehende
Sicherheitsbestätigungen kritischer Änderungen und zwingende Operator-MFA bleiben.
