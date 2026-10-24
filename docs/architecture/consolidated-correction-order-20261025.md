# Binso One – konsolidierter Korrekturauftrag

Stand: 25. Oktober 2026. Umfang: zwei aufeinanderfolgende lokale Implementierungsphasen mit einer gemeinsamen abschliessenden Releaseprüfung. Dieser Auftrag ersetzt keine Merge- oder Produktionsfreigabe und meldet keine noch nicht ausgeführten Prüfungen als bestanden.

## Ausgangslage und Quellen

1. [Produktionsaudit vom 25.10.](production-ux-audit-20261025.md): acht bestätigte Befunde UX-01 bis UX-08 und fünf Vorschläge OPT-01 bis OPT-05, jeweils mit Reproduktion, Codebeleg und Prüfgrenze.
2. [Vertiefung zum gestaffelten Dashboardstart](coherent-dashboard-start-20261024.md): produktive Beobachtungen, bereits lokal umgesetzte Korrekturen und ausgeführte lokale Gegenproben.
3. [Vorausgehender PWA-/Navigationsaudit](pwa-performance-20261024.md): historischer Hintergrund zu den bereits über PR #316 ausgelieferten Korrekturen. Diese Arbeit nicht erneut als fehlend implementieren.

Zuletzt bestätigte Produktionsbasis: `c17b1d915c57f32eb49f7de6b81671a622946c33`. Aktueller lokaler Arbeitsbranch: `fix/coherent-content-start-20261024`, HEAD `ddc7ee592c66ad4e87545ebc78dd868055289874`. Vor jedem Implementierungsbeginn tatsächlichen Status und Diff prüfen und andere Änderungen erhalten.

Bereits lokal, noch unveröffentlicht:

- `7d505d2592da005147da42273226e2f2b71b516e`: gespeicherte KPI-Zeiträume vor dem ersten Client-Paint wiederherstellen.
- `ddc7ee592c66ad4e87545ebc78dd868055289874`: erste Dashboardansicht erst bei Profil- und Datenbereitschaft zeigen.

Das Produktionsaudit selbst hat nichts implementiert. Das bedeutet nicht, dass die zwei genannten älteren lokalen Codekorrekturen fehlen. Sie sind bestehende Bestandteile der künftigen Phase A und werden geprüft und integriert, nicht parallel neu entwickelt.

## Unveränderliche Grenzen

- Vorhandene zentrale Komponenten, Design-Tokens, Authentifizierung, Lokalisierung und Services verwenden. Keine zweite UX-, Auswahl-, Zeitraum- oder Navigationsarchitektur.
- Binso-One-Navigationsziele und deren Berechtigungsfilter, Bottom-Navigation und blauen Floating-Plus in Gestaltung, Grösse, Position und Safe-Area-Verhalten erhalten. Vorhandene Regeln zum Ausblenden in Formularen, Dialogen, Tastaturkontext und Chat bleiben erhalten.
- Keine neue Gestaltung. Verbesserungen innerhalb der vorhandenen Foundation; optionale Darstellungsänderungen als solche zur visuellen Freigabe zeigen.
- Keine Änderungen an Finanzberechnungen, gespeicherten Zeitdauern, Geschäftsregeln, Datenmodellen, Tenant-Grenzen, Berechtigungen oder Sicherheitsfaktoren.
- Keine Produktivdaten für Tests anlegen oder verändern. Fachliche Speicherschritte in einer isolierten lokalen Testfirma prüfen.
- Keine GitHub-Pushes, Merges, produktiven Migrationen oder Deployments aus diesem Korrekturauftrag ableiten. Dafür die gesonderte Releaseentscheidung und geltende Exact-SHA-Freigabe verwenden.
- Tests und Verträge nur bei nachgewiesen veraltetem Soll anpassen. Keine Pflichtprüfung deaktivieren, Gegenfälle entfernen oder neue Screenshotbaselines ungeprüft akzeptieren.

## Phase A – Funktion und Navigation

Alle vier P1-Befunde und der sichtbare Zeitfilter gehören vollständig in diese Phase.

| Befund | Implementierungsauftrag | Mindest-Gegenprobe |
|---|---|---|
| UX-01: gestaffelter Aufbau | Die zwei lokalen Startkorrekturen als Basis verwenden. Erste nutzbare Übersicht mit Profil, Begrüssung, wiederhergestelltem Zeitraum und Daten zusammen freigeben. Interne Übergänge getrennt behandeln: Shell und Entwürfe erhalten; keine festen Wartezeiten und kein wiederkehrender Vollbild-Startschirm. Verbleibende Inhaltsverschiebungen und tatsächlich erforderliche Abfragen eingrenzen. | Getrennt verzögerte Profil-/Dashboardantworten; Standard-/gespeicherter Zeitraum; Kaltstart, warmer Rücksprung, abgelaufene Daten, Authentifizierungsverlust. Keine gemessene Serverbeschleunigung behaupten, wenn nur der Aufbau stabilisiert wurde. |
| UX-02: Kundenbearbeitung | Sicheren vollständigen Aufrufer einschliesslich aktivem Kundentab an den bestehenden Editor übergeben und beim Schliessen respektieren. | X, Abbrechen und Escape ohne Änderung zurück zum Kundentab; echter Dirty-State bleibt geschützt; Speichern und direkter Editoraufruf lokal gegenprüfen. |
| UX-03: Dokumentrückweg | Bestehende Angebote/Rechnungen müssen einen gültigen Rückverweis respektieren. Aktuelle Kundentabbezeichnung verwenden; alte Deep Links kompatibel behandeln. | Kunde/Dokumente → Angebot bzw. Rechnung → zurück zu Dokumente; direkter Dokumentlink ohne Rückverweis; ungültiger/externer Rückverweis; Listenfilter erhalten. |
| UX-04: leere Zahlungsauswahl | Remote-Auswahl ohne Rechnungskandidaten verständlich abschliessen. Echten Leerbestand, Suche ohne Treffer, Laden und Abruffehler unterscheiden. Unnötige Paginierung ausblenden. Bestehenden Zugang zur passenden Rechnungsliste anbieten, ohne fachliche Daten automatisch anzulegen. | Keine Kandidaten, keine Suchtreffer, API-Fehler mit Retry, genau eine Seite und mehrere Seiten; Zahlung bleibt ohne gültige Rechnung gesperrt. |
| UX-08: unsichtbarer Zeitfilter | Übergebenen Kunden-/Auftragskontext im Einträge-Tab als aktiven Filter anzeigen und gezielt zurücksetzbar machen. Bestehende Filter-/Query-Infrastruktur verwenden. | Auftrag → Zeit erfassen → schliessen → Einträge: Kontext sichtbar. Rücksetzen entfernt nur den jeweiligen Kontext, nicht Zeitraum/Suche/Status. Daten, Messung und Pflichtzuordnungen unverändert. |

Phase A ist lokal abgeschlossen, wenn diese Abläufe anhand echter lokaler Ansichten und gezielter Regressionen belegt sind. Offene Gerätetests ausdrücklich aufführen; kein selbstständiger Zwischenrelease.

## Phase B – zentrale UX-Standardisierung

Die funktionale Leerzustandskorrektur UX-04 bleibt Phase A. Phase B vereinheitlicht darauf aufbauend vergleichbare Auswahlen und Aktionen, ohne denselben Befund doppelt umzusetzen.

| Befund / Vorschlag | Implementierungsauftrag | Mindest-Gegenprobe / Grenze |
|---|---|---|
| UX-05: IBAN-Hinweis | Tatsächlichen Einstellungsnamen verwenden; vorhandene Setup-Recovery mit sicherem Rückweg in die Dokumenterfassung verbinden. | Hinweis, Ziel und Rückweg stimmen überein. Ausgefüllter lokaler Entwurf bleibt erhalten. Entwurfserlaubnis und QR-/Ausstellungsvalidierung unverändert. |
| UX-06: Dateiaktionen | Drei-Punkte-Menü im gewöhnlichen Dateiabschnitt entfernen und Erstellung in bestehende kontextbezogene Aktionen integrieren. Zentrale Komponente verwenden. | Kunden-/Dokumentdateien mit und ohne Inhalt; zulässige Dateiaktionen weiterhin erreichbar. Keine neue mobile Inhaltsaktion, kein verlorener Datei-/Rechtezugang. |
| UX-07: Abonnementtexte | Technische Konfigurationssprache durch kurze, verständliche Plan-/Abrechnungstexte ersetzen; vorhandene Status und notwendige Vertrags-/Steuerinformationen erhalten. | Testphase, verbundenes Billing, fehlende Verfügbarkeit und vorhandenes Abo unterscheiden. Keine Preis-, Steuer- oder Kündigungslogik ändern. |
| OPT-01: Dashboarddichte | Leere Aufgaben gemeinsam kompakt darstellen und irrelevante Nullwertabschnitte reduzieren. KPI und fachlich relevante Einrichtung erhalten. | Nullbestand und gemischte echte Aufgaben; kein verschwundener Handlungsbedarf und keine erfundenen Kennzahlen. Mobile Referenz vor/nach zeigen. |
| OPT-02: Finanzorientierung | Vorhandenen Zugang zwischen Übersicht, Analyse und Finanzlisten konsistent auffindbar machen. | Gleichartige Navigation ohne zusätzliche unnötige Tabs/Aktionen; bestehende Deep Links und Filter erhalten. Bottom-Navigation unverändert. |
| OPT-03: Versionskontext | Kundenverlauf um tatsächlich verfügbare Dokument-/Versandversion ergänzen und passenden Versionszugang nutzen. | Historischer Versand und aktueller Entwurf verständlich unterscheidbar. Keine Version erraten; keine Zustellung ohne Nachweis behaupten. Fehlende Daten ausdrücklich behandeln. |
| OPT-04: Zeitdarstellung | Wiederholte Bezeichnungen kürzen und sehr kurze Dauer verständlich anzeigen. Zeitformate je Kontext klar halten. | Unter einer Minute, volle Minuten, lange Dauer und vorhandene Status. Gespeicherte Sekunden/Stunden sowie Abrechnung bleiben identisch. |
| OPT-05: Tablet | Bestehende Sidebar-/Steuerzeilen am mittleren Breakpoint effizient ausrichten. | Schmale und breite Tablets, Mobile und Desktop; Such-/Filter-/Erstellenzugang erreichbar, keine Überläufe. Keine Navigations- oder FAB-Neugestaltung. |

Zentrale Änderungen auf tatsächlich betroffene Aufrufer prüfen. Andere Seiten nicht nebenbei neu gestalten. Kunden- und Admin-Aufrufer derselben geänderten Komponente benötigen ihre jeweiligen lokalen Gegenproben; fehlende Rollenansichten bleiben offen.

## Aufgelöste Anforderungswidersprüche

- **Sprache:** Die ältere Freigabe vollständiger Namen kollidiert mit der späteren Phase-1-Quelle Kapitel 11 (`DE ˅`). Für diesen Auftrag bleibt die aktuelle spätere Regel bestehen; volle Namen im Auswahlmenü. Kein stillschweigender Wechsel zurück und keine zusätzliche Übersetzungsarchitektur.
- **Beschreibungen:** Phase 1 verlangt kurze Funktionsbeschreibungen auf Hauptseiten. Nicht pauschal aufgrund älterer Einzelaufträge entfernen.
- **Ladezustand:** Screenreader-Ankündigungen sind erforderlich. Sie nicht wegen Accessibility-Textausgaben als sichtbare Ladesätze entfernen. Tatsächliche Inhaltsverschiebungen anhand gerenderter Ansichten beurteilen.
- **Historischer Versand:** Aktueller Entwurf plus früherer Versand ist ohne Versionsprüfung kein bewiesener Fachfehler. Die Darstellung präzisieren, keine Daten umschreiben.

## Gemeinsame Prüfung und Abschluss

1. Je Phase Nachweismatrix aktualisieren: Befund-ID → geänderte zentrale Owner/Aufrufer → tatsächlich ausgeführte Prüfung → Ergebnis/offen. Historische Nachweise nicht als neue Ergebnisse übernehmen.
2. Während der Umsetzung gezielte Tests und visuelle Gegenproben nach `AGENTS.md`; bei TypeScript-Änderungen passende Typprüfung. Die vorhandenen fachlichen und Sicherheits-Gegenfälle erhalten.
3. Nach Phase B einen finalen lokalen Commit und den vollständigen Diff gegen die dann bestätigte Produktions-/Integrationsbasis festhalten. Änderungen seit früheren Freigaben ausdrücklich nennen.
4. Gemeinsame Releaseprüfung aller für den finalen Umfang erforderlichen Quality-, Security-, Architektur-, Integrations- und Browser-Gates. Ausgeführte Ergebnisse dem exakten finalen SHA zuordnen. Alte grüne Gates sind keine neue Freigabe.
5. Tatsächliche Vorschau auf Mobile, Tablet und Desktop zeigen; gleiche Inhalte/Breiten beim Referenzvergleich, Hell/Dunkel, Tastatur, Fokus, Dialoge, Filter, Safe Areas und Navigation berücksichtigen.
6. **Offen halten, bis tatsächlich ausgeführt:** echte installierte iPhone-/iPad-PWA mit Kaltstart, internen Wechseln und Softwaretastatur; alle fünf Sprachen; Light Mode; andere Kundenrollen und interne Adminrollen. Bereits fehlende Übersetzungen gehören nicht stillschweigend zu diesem Korrekturpaket. Erreichbare bestehende Sprachzustände auf Regression prüfen und Lücken getrennt dokumentieren.
7. Abschlussbericht trennt implementiert, geprüft, offen und blockiert. Bis zur gesonderten ausdrücklichen Freigabe bleibt alles lokal. Merge/Deployment erst nach erfolgreicher gemeinsamer Prüfung und geltender Freigabe des finalen Commits.

## Nicht Bestandteil

Neue Features, generelle Übersetzung aller offenen Kataloge, juristische Abnahme, Tarif-/Rechteänderungen, neue Datenbankmigrationen, Provideraktivierungen, kostenpflichtige Skalierung, native Store-Veröffentlichung und eigenständige Produktionsänderungen.
