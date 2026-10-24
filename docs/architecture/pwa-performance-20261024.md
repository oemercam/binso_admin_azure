# PWA-, Start- und Navigationsaudit – 24. Oktober 2026

## Stand und Auftrag

Produktiver Vergleichsstand: `cddbd6fb08a05ee949bc4af32a8d149cf6d84977` (PR #315).
Lokaler Korrekturbranch: `fix/pwa-start-navigation-20261024`.
Auftrag: langsamen PWA-/Dashboardstart, Seitenwechsel, anfänglich falsche/teilweise Darstellung und springendes Floating-Plus gründlich untersuchen und belegbare Fehler korrigieren. Keine neue Gestaltung. Diese Änderungen sind lokal; keine GitHub-Pushes, produktiven Migrationen oder Deployments in diesem Auftrag.

## Bestätigte Befunde und Korrekturen

| Befund | Codebeleg/Ursache | Korrektur | Gegenprüfung |
| --- | --- | --- | --- |
| Plus springt während des Starts aus dem Inhalt nach unten | `layout.css` animiert `.page-container`; `workflows.css` setzte in `page-enter` einen Transform. Dieser Vorfahr wird während der Animation zum Bezugssystem seiner fixierten Kinder. Im echten Stylesheet-Probeaufbau wechselte Y von 388 auf 716 px. | Die Seiten-Einblendung verwendet weiterhin Opazität, aber keinen Transform. Finale Position, 44-px-Ziel, Farbe und Navigation bleiben erhalten. | 12 CSS-/Browserfälle: 320/390/760 px, Light/Dark, Kunden-/Adminwurzel. Frames bei 0/30/75/500 ms bleiben bei Y=716. Wiedereinsetzen des alten Transforms reproduziert 328 px Sprung. Zusätzlich echte App-Startframes im Produktionsbuild geprüft. |
| Zusätzliche serielle Datenbankarbeit bei jeder Sitzungsprüfung | `getSession` prüfte die Testphase nach seiner Identitätstransaktion in einer zweiten `withTenant`-Transaktion. `withTenant` setzte Benutzer und Organisation mit zwei Abfragen. | Vorhandene Trial-Prüfung auf derselben bereits gebundenen Verbindung ausführen; beide Kontextwerte gemeinsam setzen. Keine Session-/Rechtecache-Verlängerung. | Tatsächliche TS-Funktionen: eine Transaktion, Tenant-Bindung, Mitgliedschaft, Ablauf und finale Statusprüfung. Native HTTP-/RLS-Prüfung aller acht Kundenrollen. |
| Testphasenablauf bei konkurrierenden Sitzungsprüfungen widersprüchlich | Eine Anfrage konnte den Ablauf vollziehen; die andere wartete auf denselben Update-Lock und änderte danach selbst keine Zeile. Ihr zuvor gelesener Organisationsstatus blieb unverändert. Reproduktion mit echtem PostgreSQL-Lock und zwei HTTP-Anfragen ergab `[true,false]` für `readOnly`. | Organisationsstatus nach der Ablaufanweisung erneut auf derselben Transaktion lesen. Gesperrte/archivierte/entfernte Organisationen werden abgewiesen. | Native Lock-Barriere stellt sicher, dass beide Anfragen den alten Stand gelesen haben. Beide Antworten melden danach `readOnly=true`. Im bestehenden nativen Release-HTTP-Test eingebunden. |
| Schneller Rücksprung nach vorherigem Refresh umgangen | `useApiQuery` erlaubte den frischen Snapshot nur bei `retry===0`; der Zähler blieb nach manuellem oder periodischem Refresh auch bei späteren API-Pfadwechseln erhöht. | Refresh-Basis pro Besuch/API-Pfad führen. Explizite Aktualisierung umgeht den Cache weiterhin; ein späterer Besuch darf wieder einen gültigen Snapshot verwenden. | Neuer Gegenfall scheiterte vorher mit einer zusätzlichen GET-Anfrage. Danach bestanden Rücksprung, erneuter expliziter Refresh, Mutation, Sessionwechsel, verspätete Antwort und Rechteentzug. |
| Private Seiten konnten bei unbekannter/abgemeldeter Identität gemountet werden | `SessionDataBoundary` behielt nach der ersten Bestätigung eine alte Schlüsselidentität; auch eine explizit abgemeldete Antwort konnte ihre Kinder rendern. | Private Kinder nur bei bestätigter angemeldeter Identität mounten. Bestehende Daten bleiben bei normaler Hintergrundaktualisierung innerhalb derselben gültigen Sitzung erhalten. Überflüssigen Bestätigungs-State entfernen. | Unbekannte, invalidierte und abgemeldete Identität rendern keine private Unteransicht. Gleiche Person/Rechteaktualisierung bleibt stabil; neue Person und verpflichtende MFA behalten ihre Grenzen. |
| PWA konnte bei hängender Dokumentverbindung unbegrenzt leer warten | Der Network-first-Navigationsabruf in `sw.js` hatte keine eigene Zeitgrenze. | Nach acht Sekunden abbrechen und die vorhandene öffentliche Offline-Seite verwenden. Normale schnelle Antworten und Browser-Abbruch bleiben erhalten; Timer und Abort-Listener werden aufgeräumt. Shell-Version v8. | Erfolgreicher, fehlgeschlagener, hängender und abgebrochener Abruf mit tatsächlichem Worker-Code geprüft. Private API-/Dokumentdaten werden weiterhin nicht gecacht; Next-Buildassets bleiben ausserhalb der Worker-Interzeption. |

## Durchgeführte Prüfungen

- Produktionsbuild und TypeScript-Prüfung erfolgreich.
- Projektweites ESLint und CSS-Architekturprüfung erfolgreich; vorhandene zentrale Owner/Design-Tokens erhalten.
- Sicherheitsaudit für Produktions- sowie sämtliche Entwicklungsabhängigkeiten: keine bekannten gemeldeten Schwachstellen zum Prüfzeitpunkt.
- Authentifizierungs-/Migrationsregression mit isoliertem PGlite bestanden: Auth-Races, Rollback, RLS, Mandanten, Dateien, Timer, Dokumente und Zahlungen. Keine produktiven Daten verwendet.
- Abschliessende echte HTTP-Prüfung mit PostgreSQL 16 und eingeschränkter Laufzeitrolle bestanden: sämtliche inventarisierten privaten GET-Routen für acht Kundenrollen, 80 berechtigte Anlage-/Persistenzfälle, Rollen-/Mandanten-Gegenfälle, Betrags-/Rabatt-/Überzahlungsregression, Sitzungsablauf und neuer Trial-Gleichzeitigkeitsfall.
- Tatsächlicher Fokus-/Navigationsvertrag unverändert; Plus-/Dock-Geometrie nicht neu freigegeben oder als Screenshotbaseline übernommen.
- Echter PWA-Browserlauf bestanden: Service Worker, öffentliche Offline-Seite, Manifest-/Iconintegrität, Theme beim Neustart; echte TimePage gegen synthetisches Server-Ledger mit Start, Navigation, Neustart, Pause, Wiederaufnahme, Stop, tabübergreifender Aktualisierung und abgelaufener Sitzung.
- Die eigenen neuen Tests sind in bestehenden Test-, nativen HTTP- und Browser-Gates eingebunden; Pflichtprüfungen wurden nicht deaktiviert.

## Lokale Messungen mit fertig geladener Datenansicht

Gemessen mit echtem Produktionsbuild und authentifizierter isolierter Testfirma in lokalem Edge/Chromium. Der Test wartet auf den jeweiligen tatsächlich montierten Seiteninhalt und das Ende des vorhandenen Daten-Ladezustands. `networkidle` allein erwies sich für SPA-Seitenwechsel als unzureichend; frühere Routenwechselwerte sind kein Datenbereitschaftsnachweis und werden nicht als Ergebnis verwendet.

| Breite | Dashboardstart | Kunden | Aufträge | Zeit | Einstellungen | Dashboard zurück | Session-GETs |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 390 px | 1963 ms | 556 ms | 552 ms | 634 ms | 1337 ms | 460 ms | 1 |
| 768 px | 2093 ms | 274 ms | 249 ms | 516 ms | 684 ms | 172 ms | 1 |
| 1440 px | 1498 ms | 276 ms | 515 ms | 567 ms | 652 ms | 465 ms | 1 |

Dies ist eine lokale Stichprobe unter gleichzeitiger Testlast, kein Benchmark auf dem gemeldeten iPhone/iPad oder im produktiven Mobilfunk. Daraus wird keine prozentuale Produktionsverbesserung abgeleitet. Native Fehlerszenarien und alte CSS-/Cache-Gegenfälle liefern die Vorher-/Nachherbelege für die einzelnen Korrekturen.

## Testharness und Grenzen

Der vorhandene PWA-Test hing mit dem optionalen `--single-process`-Argument des extern ausgewählten Windows-Browsers. Ausschliesslich dieser eigene Testprozess wurde identifiziert und beendet; ohne diesen Argument-Zwang bestand derselbe Test. Der normale CI-Browser und die Anwendung werden dadurch nicht umgestellt. Eine bereits erzeugte eingeschränkte DB-Testrolle wurde nicht überschrieben: Der HTTP-Wiederholungslauf verwendete stattdessen eine neue, isolierte PostgreSQL-Instanz.

Lokale Rohbelege und tatsächliche App-Screenshots liegen privat in `.qa-phase1/` und werden nicht veröffentlicht oder committed. Bestehende lokale Dienste wurden nicht beendet. Die allein für diesen Auftrag erzeugten Testinstanzen werden nach Abschluss entfernt.

Offen bleiben echte installierte iPhone/iPad-PWA-Messungen (inklusive Gerät, Netz, iOS-Version und echter Benutzerlast), die vollständige Chromium/WebKit-Release-Matrix und ein unabhängiger visueller Gerätevergleich. Statische AST-Inventare für 88 Routen, 12 Operatorvarianten und 847 Module sind Strukturbelege; sie bedeuten keine durchgeführte Geräte-/Rollenabnahme sämtlicher Ansichten. Dieser Auftrag bestätigt weder vollständige Fehlerfreiheit der gesamten Anwendung noch die früher zurückgestellten Übersetzungs-/Rechtsabnahmen.

## Übergabe

Für eine folgende eigenständige Release-Runde empfiehlt sich ein neuer Chat mit diesem Bericht, dem lokalen Korrekturbranch und dem dann verifizierten Commit. Zunächst vollständige Pflichtprüfungen/Browsermatrix auf dem finalen SHA; Merge/Produktion nur mit der geltenden Freigabe. Bestehendes eingeschränktes Profil `development` bleibt gültig. Keine Migration oder neue externe Konfiguration ist für dieses Korrekturpaket vorgesehen.
