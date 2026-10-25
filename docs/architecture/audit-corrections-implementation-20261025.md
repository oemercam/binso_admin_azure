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

## Freigegebene Ergänzung: geführte Einrichtung

Der Benutzer hat nach dem lokalen Einrichtungsaudit drei Bereiche (Firma, Adresse, Bank), gemeinsame Fortschrittsanzeige, optionale Angaben und klare Abschlussaktionen freigegeben. Bestehende Firmen-/Dokumenten-APIs, Berechtigungen, QR-Prüfungen und erneute Sicherheitsbestätigung bleiben erhalten; kein neues Datenmodell.

Owner: `components/setup-process.tsx` orchestriert die bestehenden Controls/APIs auf der bestehenden Firmeneinstellungsroute. `lib/setup-readiness.ts` projiziert die bestehenden kanonischen QR-Anforderungen für Server und Client. `SetupProgress` wird auf Übersicht und im Ablauf wiederverwendet. Normale Firmenbearbeitung behält ihren Editor; dessen Hydrierung und Rückweg sind korrigiert. Optionale Angaben verwenden den bestehenden Disclosure-Owner mit einem expliziten Anfangszustand. Die spezifischen Layoutregeln liegen im bestehenden CSS-Owner settings.css.

Neue Gegenproben: tatsächliche Formularhandler für Teiladresse, vollständige Adresse, ungültige Bankangabe vor Reauthentication, Doppelübermittlung, bestätigtes Speichern, fehlgeschlagenes Nachladen und zwischenzeitlich unvollständige Adresse; sauberer/geschützter Abbruch; optionale Abschnitte lassen sich öffnen und schliessen. Bestehender Readiness-PGlite-Test mit Migrationen, RLS, Rollen, Auditrollback und abschliessender Ausstellungsvalidierung besteht. Neue Texte sind im vorhandenen Katalog DE/EN/FR/IT/TR erfasst. Vollständige Geräte-/Rollen-/Sprachabnahme bleibt getrennt.

Lokale Browser-Gegenproben im geführten Ablauf: 390×844, 820×1180 und 1440×1000 ohne horizontalen Seitenüberlauf. Mobile Aktionsmitten bei y=740 treffen die eigenen Buttons, nicht mehr Kunden/Zeit in der Dockleiste. Unverändertes späteres Fortsetzen kehrt direkt zurück. Teiladresse speichert und benennt PLZ/Ort; Fokus wechselt zu PLZ. Vollständige Adresse erhöht den gespeicherten Fortschritt auf 2/3 und öffnet Bank. Ungültige IBAN bleibt vor Reauthentication im Formular; gültige Test-IBAN öffnet die bestehende Passwortbestätigung. Diese wurde abgebrochen, keine Bankangabe gespeichert. Echter Dirty-State schützt den Bereichswechsel; bestätigtes Verwerfen führt zum gewünschten Bereich. Optionales Logo öffnet den vorhandenen Editor; unverändertes Schliessen kehrt ohne falsche Warnung zurück. Neue Quellen haben fokussierte ESLint-/Typ-, CSS-, Komponenten-, Navigations-, Lokalisierungs-, Finanz- und Integrationsprüfungen bestanden. Keine Veröffentlichung.

Private neue Nachweise: `.qa-phase1/audit-corrections-20261025/guided-setup/`. Die frische Testfirma ist ausschliesslich eine lokale Fixture, kein produktiver Benutzer. Geschütztes Bankspeichern mit Passwort/Faktor sowie echte iOS-PWA bleiben offen; dafür keine Sonderfreigabe oder Sicherheitsumgehung eingerichtet.

Zusätzlicher Abschlussnachweis: Eine zweite, vor Anmeldung vollständig konfigurierte lokale Fixture (synthetische Adresse und bekannte Test-IBAN) zeigt 3/3. Nach dem echten Firmen-Speichervorgang erscheint die Abschlussansicht; „Zur Übersicht“ entfernt die Einrichtungskarte. Das prüft die Abschlussdarstellung und Readiness-Rückmeldung, ausdrücklich nicht die geschützte Bankänderung. Nachweise: `completion-confirmed.jpg`, `completed-dashboard.jpg`. Die ursprüngliche frische Testfirma bleibt für die Freigabe mit offenem Bankschritt erhalten.

Die geführte Seite unterdrückt die unpassende allgemeine Einstellungsbeschreibung über eine optionale zentrale Shell-Eigenschaft. Eine tatsächliche Shell-Registrierungs-Gegenprobe stellt sicher, dass auch der dauerhaft montierte Layout-Rahmen diese Eigenschaft erhält. Andere Seiten behalten ihre bisherigen Beschreibungen. Der Logo-Rückweg erhält auch einen vom Dashboard abweichenden sicheren ursprünglichen Aufrufer.

Abschliessender Stand der Einrichtungsergänzung: finaler Produktionsbuild, Typprüfung und 57-Routen-/CSS-Prüfung erfolgreich. Der finale Browser zeigt den geführten Bankschritt ohne allgemeine Einstellungsbeschreibung; Mobile-/Desktop-Freigabeaufnahmen `bank-mobile-final.jpg` und `bank-desktop-final.jpg`. Die ursprüngliche Testfirma mit 2/3 Pflichtbereichen wurde nach der getrennten Abschlussprüfung wiederhergestellt. Keine produktive Änderung, kein Push, Merge oder Deployment. Vollständige Release-/Geräte-/Rollenabnahme bleibt offen.

## Releasevorbereitung PR #317

Beim ersten CI-Lauf wurde die fehlende Katalogaufnahme von „Abrechnungen“ festgestellt und für EN/FR/IT/TR ergänzt. Zwei alte Einrichtungs-Testannahmen wurden auf die ausdrücklich freigegebenen drei Bereichslinks und die neue Überschrift umgestellt. Fortschrittswerte, erster offener Bereich, Zugang zu erledigten Bereichen, optionale Aufgaben, vollständige/dismissed Gegenfälle und Präferenzfehler bleiben geprüft. Die Browserfixture enthält nun alle drei Pflichtbereiche; ein optionales Logo darf die abgeschlossene Einrichtung nicht offen halten. Keine Prüfbedingung deaktiviert.

Die lokale Gesamttestsuite erreichte zunächst die fehlende Übersetzung; deren gezielte Wiederholung besteht. Der unveränderte Readiness-Infrastrukturtest benötigt native Bash-Skript-Ausführung und kann in dieser Windows-Umgebung nicht vollständig ausgeführt werden. Sein Linux-CI-Gate bleibt verpflichtend. Merge und Deployment weiterhin erst nach grünen Pflichtprüfungen und finaler SHA-Freigabe; Profil development mit offener Geräte-/Rollen-/Bankbestätigungsabnahme.

Linux-CI für 594b4b4: Gesamttests, Compliance-Gegenproben, Build und Scanner bestanden. Der nachfolgende echte PostgreSQL-Prozesslauf scheiterte an der fehlenden Auflösung von `@/lib/setup-readiness` im isolierten Testlader. Diese reale Modulabhängigkeit wird nun auch dort sowie im eigenständigen Rabatttest eingebunden; Anwendung und Datenbank bleiben unverändert. Der fokussierte Rabatt-Persistenzlauf mit echten Migrationen/RLS besteht auf PGlite. Erneuter vollständiger Linux-Prozess- und Browsernachweis bleibt erforderlich.

Linux-CI für d6aadbce: vollständige Hauptprüfung einschliesslich PostgreSQL-Prozess-/Authentifizierungsprüfungen, Lint, Typprüfung und vollständiger Abhängigkeitsaudits erfolgreich. Beide funktionalen Browserläufe meldeten dieselbe alte Zeitdarstellungs-Erwartung `2:15` statt des ausdrücklich mit Einheit vereinheitlichten `2:15 h`. Der exakte Minutenvergleich bleibt erhalten und erwartet nun die Einheit. Fokussierte reale Handler-/Darstellungsgegenproben bestehen; umfassende Browserauswertung und Releasefreigabe bleiben offen.
