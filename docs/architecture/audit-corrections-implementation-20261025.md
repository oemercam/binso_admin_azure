# Konsolidierte Auditkorrekturen – lokale Umsetzung, 25.10.2026

Basis: produktiv zuletzt bestätigt `c17b1d915c57f32eb49f7de6b81671a622946c33`. Branch `fix/coherent-content-start-20261024`. Die bestehenden lokalen Startkorrekturen 7d505d25 und ddc7ee59 gehören zum Paket. Kein Push, Merge oder Deployment in diesem Auftrag.

## Nachweismatrix

| ID | Umsetzung und zentrale Owner | Ausgeführte Gegenprobe / Grenze |
| --- | --- | --- |
| UX-01 | WorkspaceStartup und gespeicherte Statistikperioden aus Vorarbeit integriert. Dashboard hält bei internen Rücksprüngen Überschrift und Daten gemeinsam zurück, Shell und CreateAction bleiben montiert. | Startup-Hooktests, gespeicherte Perioden, Authverlust und tatsächliche Dashboard-Props; keine gemessene allgemeine Serverbeschleunigung behauptet. |
| UX-02 | Kundeneditor erhält sicheren vollständigen returnTo samt Tab; direkter Aufruf fällt auf Kundendetail zurück. | Echte lokale Kundenansicht → Verlauf → Bearbeiten → Schliessen → Verlauf; Handler-Gegenfälle inklusive externer Rückverweise. |
| UX-03 | Bestehende Dokumente respektieren sicheren Aufrufer; aktueller Kundentab documents. | Echte lokale Offerte aus Kunden/Dokumente geöffnet und zurückgekehrt; direkter/ungültiger Rückverweis im Regressionstest. |
| UX-04 | DirectorySelect/SelectControl unterscheiden Laden, Fehler, leere Treffer und leeren Bestand; keine sinnlose erste Seitennavigation. | Echte leere Rechnungsauswahl mit Link zu Rechnungen und gesperrtem Speichern; zentrale Gegenfälle. |
| UX-05 | Tatsächlicher Einstellungsname; kanonische Zahlungsanforderung bestimmt fokussiertes Feld. Neuer Dokumententwurf vor Wechsel gespeichert und beim Rückweg wiederhergestellt. | Lokale Rechnung mit geändertem Datum → IBAN-Einstellungen → zurück: Datum erhalten. Zusätzlich Hydrierungsreihenfolge korrigiert, damit automatisch geöffnetes unverändertes Formular nicht fälschlich dirty ist. |
| UX-06 | Datei-Upload über bestehende Kunden-/Dokumentheaderaktionen; zentraler EntityFiles-Handle entfernt dort Abschnittsmenü. | Echte lokale Kunden-/Offertendateiansicht und Headeraktion sichtbar. Unberührte andere EntityFiles-Aufrufer behalten bisherigen Zugang. Kein realer Dateiupload ausgeführt. |
| UX-07 | Verständliche Abonnement-/Abrechnungstexte, keine Tarif-/Vertragslogik geändert. | Quell-/Typprüfung und bestehende Billing-Gegenfälle; keine echte Bestellung oder Kündigung. |
| UX-08 | Kunden-/Auftragskontext in Zeitliste sichtbar und einzeln zurücksetzbar; Rechnungspflichtzuordnung geschützt. | Echter lokaler Auftrag → Zeit → Einträge: Auftragsreset erhält Kunde, Suche und 3-Monats-Zeitraum. Keine Zeit gestartet oder gespeichert. |
| OPT-01 | Nullaufgaben kompakt zusammengefasst; leere Rechnungs- und Dashboardentwicklungsabschnitte entfallen. | Tatsächlicher Owner/Employee/HR-Render mit Null-/Positivfällen, Finanzregressionen. |
| OPT-02 | Bestehende FinanceTabs auch auf Übersicht/Analyse. | Bestehende Ziele und Finanzlogik erhalten; Navigationsvertrag inklusive Negativproben bestanden. |
| OPT-03 | Kundenaktivität verbindet tatsächliche Versandversion; historischer Link öffnet nur eine autorisierte vorhandene Version. | Repository-Gegenfälle, Tenantbindung und Legacy ohne erfundene Version. Isolierte echte Version/PDF für Browserprüfung vorbereitet, keine Mail versendet. |
| OPT-04 | Gemeinsame Anzeige HH:MM h, unter einer Minute < 1 Min.; Metadaten dedupliziert. | Grenzwerttests, tatsächlicher Rollen-Dashboardrender; gespeicherte Zeiten und Abrechnung unverändert. |
| OPT-05 | Kundenerstellung in gemeinsamer RecordsControls-Zeile. | Gemeinsame Komponenten/Navigation unverändert; responsiver lokaler Sichtcheck gesondert unten. |

## Prüfungen und ehrliche Abnahmegrenze

Gezielte TypeScript-, ESLint-, Startup-, Rückkehr-, Lokalisierungs-, Finanz-, Dokument-, Perioden-, Navigations-, CSS- und Integrationsprüfungen wurden ausgeführt. Veraltete Komponenten-Zuordnungen wurden anhand des realen AST-Graphen aktualisiert; Abnahmestatus bleibt ungeprüft. Der Rollen-Dashboardtest verwendet nun den tatsächlichen neuen Zeitformatierer und prüft weiterhin die verbotenen Bereiche. Kein Gate wurde abgeschaltet.

Browsernachweise stammen ausschliesslich aus einer isolierten lokalen Testfirma in binso_ui_test. Kunden, Auftrag, Offerte und historische PDF sind synthetische Testdaten. Keine produktiven Daten, Nachrichten, Bestellungen oder Zahlungen verändert. Private Screenshots/Fixturehelfer bleiben unter .qa-phase1 und werden nicht eingecheckt.

Offen: vollständige Integrations-/Security-/Browser-Releasegates am finalen Commit; echter iPhone-/iPad-PWA-Kaltstart, Safe Areas und Softwaretastatur; vollständige fünf Sprachen, beide Themes, eingeschränkte Kunden-/Adminrollen und Screenreader am Gerät. Neue Meldungen wurden im bestehenden Katalog übersetzt, der historische Übersetzungsrückstand bleibt separat. Eine lokale grüne Prüfung ist keine Produktionsabnahme.

## Abschlusslauf und Vorschau

- Produktionsbuild erfolgreich vor dem letzten isolierten History-Modal-Fix; abschliessender Build wird separat verifiziert.
- Fokussierte Regressionen inklusive tatsächlicher SQL-/RLS-/Dokument-/Zeitabläufe, Komponentenverträge, Navigation, Lokalisierung und Perioden bestanden. Eine anfänglich veraltete AST-Zuordnung und ein alter Test-Dashboard-Import wurden korrigiert und erfolgreich erneut geprüft; kein Gate entfernt.
- Route/CSS-HTTP-Prüfung gegen die tatsächliche lokale Vorschau: 57 Routen, 3 zentrale Stylesheets, Theme-Start und geschlossene alte Demoprovisionierung bestanden.
- Tatsächliche lokale Browserprüfung bei 390×844, 820×1180 und 1440×1000: kein horizontaler Seitenüberlauf; Kundensteuerung am Tablet in gemeinsamer Zeile, Dashboardkennzahlen 2/4 Spalten, Navigation/FAB erhalten.
- IBAN-Recovery im Browser: Fokus korrekt, Schliessen ohne Änderung ohne Verwerfen-Abfrage, geändertes Rechnungsdatum erhalten. Eigener Testentwurf anschliessend verworfen; keine Rechnung ausgestellt.
- Historischer Versand im Kundenverlauf korrekt mit Version 1; entdeckte Verschachtelung des PDF-Modals im geschlossenen Disclosure zusätzlich korrigiert und gegen Regression geschützt. Letzte Sichtprüfung separat festhalten.

Private Nachweise: `.qa-phase1/audit-corrections-20261025/dashboard-mobile-final.jpg`, `dashboard-desktop-final.jpg`, `customers-tablet-final.jpg`, `invoice-recovery-final.jpg`, `customer-return-activity.jpg`, `document-return-documents.jpg`, `payment-empty-fixed.jpg`, `time-context-reset-preserves-selection.jpg`. Keine davon ist eine echte iOS-PWA-Geräteabnahme.

Abschliessender Build einschliesslich History-Modal-Korrektur: erfolgreich (Kompilierung, TypeScript und 176 Seiten). Neuer Regressionstest bestätigt das Modal ausserhalb des eingeklappten Inhalts. Abschliessender Browserbeleg: Kundenverlauf → Version 1 → tatsächliche einseitige historische PDF geöffnet; aktuelles Dokument separat als Version 2/Entwurf sichtbar. Nachweis `historical-version-final.jpg`. Finanzübersicht zeigt dieselben bestehenden Finanzziele wie die Listen. Keine Auslieferung erfolgt.
