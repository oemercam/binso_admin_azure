# V8 – Auftrag, Bestandsaufnahme und Umsetzung

Basis: `72948d6d4b8eb345bdd0618202e40a1dd9f37ceb`, Branch
`feat/v8-global-simple-workflow-20261027`. [Vollständige Owner-Quelle](source-full.md)
ersetzt den abgebrochenen ursprünglichen Anhang [source.md](source.md).
Die anschliessende ausdrückliche Antwort **„Bisherigen Kundenlogin beibehalten“**
ersetzt die widersprechenden Kunden-MFA-/Passkey-Loginvorgaben in V8. Operator-MFA
und Bestätigungen kritischer Kontoänderungen bleiben unverändert.

## Inventur vor Anwendungsänderungen

[inventory.json](inventory.json) bindet die vollständige statische Aufnahme an die
Ausgangsbasis und Hashes der untersuchten Quellen. Sie verwendet die bestehenden
Owner `ux-inventory`, `data-inventory` und `schema-contract`, keine parallele
Navigations-, Berechtigungs- oder Geschäftslogik. Enthalten sind alle 88 Routen,
12 Operatorvarianten, 293 Komponenten, 666 Feld-/Kontrollaufrufe, 35 HTML-Formulare,
476 Aktionen, 157 zentrale Surface-Aufrufe, 158 APIs, 125 Tabellen, 109 Migrationen,
3'694 Übersetzungsschlüssel, CSS-Regeln/Tokens, Rollen-/Navigationsdefinitionen,
Integrationen, Validierungskandidaten und Build-/Workflow-Konfigurationen.
Field und Input zählen separat; dies sind keine 666 unterschiedlichen Fachfelder.

Die Aufnahme ist vollständig hinsichtlich dieser statischen Quelle, nicht
hinsichtlich dynamischer Zustände, echter Provider, Live-Daten oder Geräteabnahme.
Die [Ist-Soll-Matrix](matrix.md) trennt konkrete Fehler, Vereinfachungen und offene
Nachweise. Kein „vorhanden“ in einer Quellinventur ist eine globale Abnahme.

## Sichere Umsetzung im bestehenden Modell

1. Konflikt zwischen generischem `.form-page`-Inhaltscontainer und dem neuen
   zentralen Seiteneditor beseitigen: aktive Editoren erhalten eine eindeutige
   Owner-Markierung. Bestehende Inhaltskarten bleiben erhalten.
2. Firmeneinrichtung: vorhandener einseitiger und atomarer Ablauf bleibt;
   kompakter Pflichtbereich-Fortschritt, eine Abschlussaktion und tenant-/benutzer-
   gebundene Wiederherstellung über den vorhandenen Draft-Owner ergänzen.
   Optionale QR-/Steuer-/Dokumenteinstellungen bleiben ausserhalb.
3. Kundenerfassung: notwendige Grunddaten direkt, optionale Angaben in genau einer
   zentralen Disclosure. Kein zusätzlicher Schritt zum blossen Speichern.
   Bestehende Kontakt-, Dubletten-, Wiederholungs- und Servervalidierungen bleiben.
4. Nach Auftragserstellung die bestätigten Auftragsdetails mit sicherem Rückweg
   öffnen. Keine Änderung an Angebotsannahme, Timerstart oder Abrechnung.
5. Belegerkennung sicher begrenzen: nur konfigurierte Azure-Ressource, keine
   Weiterleitung des Schlüssels an fremde Operation-URLs, begrenzte Laufzeit und
   Antworten, typisierte korrigierbare Vorschläge. Keine Aktivierung/Beauftragung
   des optionalen kostenpflichtigen Providers.

## Kritische Änderungen zuerst gesondert freigeben

V8 fordert: „riskante oder destruktive Schema-/Auth-/Billing-Änderungen gesondert
freigeben lassen“. [critical-changes.md](critical-changes.md) beschreibt die
fehlenden sechs gemeinsamen Abrechnungsmodelle und nullable Budgets samt
Datenhoheit, Snapshot-/Überbuchungsgrenzen und vorgeschlagener Migration.
Keine produktive oder lokale Schema-/Billing-Neuentwicklung wird aus einer
UI-Auswahl als bereits vorhanden abgeleitet. Diese Pakete bleiben bis Freigabe offen.

## Ausführung und Abnahme

Gezielte Tests je kohärentem Paket; abschliessend Lint, TypeScript, Build und alle
vorhandenen Pflicht-Gates. Keine dauernden Vollwiederholungen nach kleinen Edits,
keine deaktivierten Tests/Baselines. Die vollständige native PostgreSQL-/Browser-
Matrix war auf dieser Maschine zuletzt mangels laufender lokaler Instanz blockiert.
Reale iPhone-/iPad-/installierte iOS-PWA-Nachweise bleiben separat erforderlich.
Es gibt keine Push-, Merge-, Migrations- oder Deploymentfreigabe und keine neuen
kostenpflichtigen Dienste. Der abschliessende Paketstand wird mit tatsächlichen
Nachweisen und verbleibenden Einschränkungen dokumentiert.
