# Gestaffelter Dashboard-Aufbau – 24. Oktober 2026

Basis: produktiver Main `c17b1d915c57f32eb49f7de6b81671a622946c33` nach PR #316.
Der Benutzer meldet weiterhin langsamen Start und präzisiert: Vor allem erscheinen Inhalte nacheinander oder springen. Die vorige Freigabe und der vorige Release sind keine Abnahme dieser weiteren Untersuchung.

## Bestätigter Renderablauf und lokale Korrektur

`DashboardOverview` rendert Einrichtung, Aufgaben und Unternehmenszeilen mit der Dashboard-Antwort. Das eingebettete `CashOverview` gibt jedoch zunächst erneut `LoadingState` zurück: `useStatisticPeriod` stellte den gespeicherten Zeitraum erst in einem Effect und einer weiteren Microtask wieder her. Dadurch fehlten zunächst KPI-Karten und Diagramm im bereits sichtbaren Dashboard. Ihr nachträgliches Einfügen kann die darunterliegenden Zeilen verschieben.

Die zentrale Zeitraum-Hook stellt die validierte gespeicherte Auswahl nun beim ersten Client-Render bereit. `useSyncExternalStore` unterscheidet Client-Mount und Server/Hydration: Der Server und die erste Hydration behalten denselben ungelösten Zustand und lesen keinen Browser-Speicher. Auf bereits clientseitig montierten privaten Seiten ist keine zusätzliche Effect-/Microtask-Runde nötig. Bestehende Schlüssel, Standardauswahl, numerische Altdaten, Validierung, funktionale Aktualisierung und Speicherung bleiben erhalten. Finanzberechnungen, Abfragen, Berechtigungen, Navigation und Floating-Plus sind unverändert.

Der Gegencheck mit gespeicherten sechs Monaten scheitert am alten Code (erste Client-Auswahl: ein Monat) und besteht mit der Korrektur vor einem Effect-Flush. Weitere Gegenfälle prüfen ungültige Werte, alte numerische Auswahl, Schlüsselwechsel, funktionale Aktualisierung und echte React-Serverdarstellung ohne Speicherzugriff. Dies ist ein Code-/Rendernachweis, kein bereits gemessener produktiver iOS-Layout-Shift.

## Produktionsbefunde, keine Ursachenvermutung als Ergebnis

- Öffentliche GET-Stichprobe aus dieser Windows-Umgebung: Health 371 ms, Readiness 186 ms, anonyme Sitzung 78 ms, Login 190 ms, anonymer Dashboard-Aufruf mit Anmeldeweiterleitung 271 ms. Diese Werte messen **keine angemeldete Dashboard-Abfrage** und nicht das betroffene iPhone/iPad.
- Die öffentlich ausgelieferte Version stimmt mit `c17b1d91` überein. Daraus lässt sich nicht die auf dem iPhone aktive Service-Worker-Version ableiten.
- App Service und PostgreSQL stehen beide in Switzerland North. App-Plan S1; Datenbank Burstable B2s. In der einstündigen Stichprobe: App-CPU durchschnittlich 34,45 %, Spitze 99 %; Speicher 75–85 %. PostgreSQL-CPU durchschnittlich 2,76 %, maximal 4,56 %, CPU-Credits mindestens 628. Die Stichprobe umfasst den vorausgehenden Release; sie beweist keinen dauerhaften Engpass und rechtfertigt keine ungeprüfte kostenpflichtige Skalierung.
- Das grosse öffentlich sichtbare JavaScript-Paket hat 642139 entpackte Bytes. Ein tatsächlicher GET mit gzip überträgt 198514 Bytes. HEAD und automatische Dekomprimierung sind kein Beweis für fehlende Komprimierung; gzip funktioniert. Die zentrale Sprachdatei bleibt ein Kandidat für eine getrennt zu messende Bundle-Optimierung.
- Der verfügbare Produktions-Browser war abgemeldet. Der Benutzer hat angekündigt, sich dort anzumelden. Die angemeldete Sichtprüfung sowie Messung der Profil-/Sprach-/Dashboard-Reihenfolge bleiben bis dahin offen. Kein Zugriff auf Produktionsdatensätze oder Schreiben fachlicher Daten für diese Untersuchung.

## Umfang und nächster Nachweis

Lokal bestanden: `global-ux-startup-test` mit Vorher-Gegenfall und echter React-Serverdarstellung, `period-control-test`, `statistics-test` inklusive PostgreSQL-/CHF-/Gutschrift-/Zeitzonenfällen, `navigation-foundation-test`, gezieltes ESLint, TypeScript, aktualisierte Integrationsinventare und Produktionsbuild. Keine vollständige Browsermatrix oder angemeldete Produktions-/iOS-Abnahme dieses Pakets durchgeführt.

Diese Änderung ist lokal und nicht deployed. Kein vollständiger Produktions-Performancegewinn und keine Fehlerfreiheit behauptet. Nach der Anmeldung den tatsächlichen Inhaltssprung eingrenzen; insbesondere unabhängige Profil-/Sprachbereitschaft und erst nach Datenankunft aktivierte Dashboard-Heading-Regeln untersuchen. Keine neue Gestaltung und keine zusätzliche feste Wartezeit einführen. Ein weiterer Release benötigt seine eigenen Pflichtprüfungen und die geltende Commit-Freigabe.
