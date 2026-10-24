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

## Fortsetzung nach tatsächlicher Anmeldung

Der Benutzer meldete sich im bestehenden Produktions-Tab an. Es wurden ausschliesslich Übersicht und Kundenliste geöffnet bzw. neu geladen; keine Geschäftsdatensätze verändert. Vollständige Accessibility-Zustände und Screenshots bestätigten die Reihenfolge: Startbild, sichtbare Hülle mit leerem h1 und Platzhalter-Avatar, persönliche Begrüssung ohne Dashboard-Daten, danach vollständige Übersicht. Ein erster Versuch mit differentiellen Accessibility-Ausgaben wurde nicht als vollständige Zeitreihe verwendet; fehlende Zeilen in Diffs bedeuten nicht verschwundene Inhalte. Die wiederholte vollständige Beobachtung zeigte die Zwischenansichten ausdrücklich. Die Zeitstempel umfassen Browsersteuerung und Screenshoterstellung, keine isolierten Netzwerk- oder iPhone-Laufzeiten.

Beim echten Wechsel zur Kundenliste sowie zurück blieb die Hülle erhalten, während die Inhaltsfläche zunächst weitgehend leer war. Der abgeschlossene Rücksprung zeigte danach die korrekte vollständige Übersicht. Im abgefragten Browser-Fehlerprotokoll gab es keine Einträge. Das bestätigt den gestaffelten Aufbau, beweist aber keinen konkreten langsamen SQL- oder API-Aufruf.

Weitere lokale Korrekturen:

- Die bestehende zentrale Startansicht wird erst durch die erste verwendbare Ansicht ersetzt. `WorkspaceStartup` erhält dieselbe `.app-root` mit demselben Schlüssel und ohne zusätzlichen DOM-Wrapper. Profil- und Dashboard-Abfragen dürfen hinter der verborgenen Hülle parallel mounten. Keine feste Wartezeit. Nach dem ersten Start bleiben Hülle, Navigation und Entwürfe bei Navigation und Hintergrundaktualisierung erhalten. Authentifizierungsfehler bleiben sichtbar; Identitätsverlust verbirgt den Workspace weiterhin.
- Das Dashboard meldet seine tatsächliche Daten-/Begrüssungsbereitschaft an die vorhandene Shell-Registrierung. Die unregistrierte erste Routenhülle ist noch nicht bereit. Die persönliche Begrüssung ist bei einem warmen Client-Mount bereits im ersten Render aus dem vorhandenen Profil vorhanden; Server/Hydration geben weiterhin keine angenommene Begrüssung aus. Der bestehende Tageszeit-/Fokus-/Sichtbarkeitstimer bleibt erhalten. Profilzeitzonen werden im selben Render berücksichtigt.
- Die gespeicherte Profilsprache wird vor dem sichtbaren Paint angewendet. Keine neuen Texte, Übersetzungen, Datenquellen oder Hintergrundabfragen.

Die bestehende Chromium-/WebKit-Startup-Prüfung enthält zusätzlich getrennt freigegebene Profil- und Dashboard-Antworten. Sie muss beweisen, dass weder Identität allein noch Begrüssung allein die erste leere Dashboard-Ansicht freigeben; die erste sichtbare Ansicht enthält bereits KPI-Karten und restaurierten Zeitraum. Die lokalen Zustandsprüfungen decken ausserdem sofortige Bereitschaft, erhaltene Shell bei späterem Laden und erneute Sperre bei Identitätsverlust ab. Ausstehende ausgeführte Browsernachweise werden nicht durch diesen Testquellcode ersetzt.

## Tatsächlich ausgeführter lokaler Browser-Gegenvergleich

Der fertige Produktionsbuild wurde mit einer neu angelegten isolierten PostgreSQL-16-Testinstanz (`binso-coherent-start-20261024`, Port 5437) und der bestehenden echten UI-Authentifizierungsfixture betrieben. Der nur lokal gebundene Vorschau-Proxy auf Port 3230 leitet an die tatsächliche Anwendung auf Port 3231 weiter. Er verzögert ausschliesslich in diesem Versuch die Profilantwort um 900 ms und die Dashboard-Antwort um 1800 ms. Eigene Cookie-Namen vermeiden Änderungen an anderen lokalen Vorschausitzungen. Keine dieser Hilfsdateien, Sitzungen oder Testdaten wird veröffentlicht.

- Mobile, angeforderter Viewport 390 × 844: 24 vollständige Accessibility-/Screenshot-Proben; zuerst Startansicht, dann Begrüssung, KPI und Unternehmensinhalt gemeinsam. Keine erfasste teilweise Dashboard-Ansicht.
- Desktop, 1440 × 1000: 35 vollständige Accessibility-Proben bis zur tatsächlich sichtbaren fertigen Übersicht, ebenfalls kein erfasster Zwischenzustand. Das erste kürzere Sample endete noch im Startbild und wurde deshalb ausdrücklich bis zur vollständigen Ansicht fortgesetzt.
- Nach echter Bedienung der bestehenden Sechsmonatsauswahl: 30 weitere vollständige Proben nach Reload. Jede sichtbare KPI-Ansicht hatte sofort den gespeicherten Zeitraum; kein sichtbarer Monatsstandard und keine Begrüssung ohne Kennzahlen.
- Tatsächlicher mobiler Wechsel zur Kundenliste: acht Proben mit weiterhin sichtbarer Hauptnavigation, ohne Startbild; anschliessend tatsächlicher Rücksprung und bestätigte fertige Übersicht. Beim Rücksprung nach Ablauf der kurzen Datengültigkeit wartete der Inhalt weiterhin auf seine neue Datenantwort. Das wird nicht als beschleunigte Backend-Abfrage ausgegeben.
- Screenshot der echten lokalen mobilen Ansicht: privat `.qa-phase1/coherent-start-mobile.jpg`. Kontrollierte Verzögerungen und Steuerungszeitstempel sind keine Produktionsbenchmarks und keine physische PWA-/WebKit-Abnahme.

Der finale Frontend-Produktionsbuild, gezieltes ESLint, TypeScript, tatsächliche Startup-/Begrüssungszustandsprüfungen, Rollen-Dashboard- und Navigationsverträge bestanden. Die neue zusätzliche Browser-Gate-Sequenz ist syntaxgeprüft, die vollständige Chromium-/WebKit-CLI-Matrix wurde in diesem lokalen Block nicht ausgeführt. Vor einem neuen Release bleibt sie erforderlich. Die lokal sichtbare Verbesserung betrifft die Darstellung des ersten Inhalts; isolierte produktive API-/SQL-Laufzeiten bleiben mangels Netzwerk-/Tracezugriff im verfügbaren Browser offen.

Für die Durchsicht ist zusätzlich die tatsächliche Anwendung direkt auf `http://127.0.0.1:3231/dashboard?lang=de` geöffnet, ohne den Verzögerungsproxy. Ein echter mobiler Screenshot dieser normalen Vorschau liegt privat in `.qa-phase1/coherent-start-review-mobile.jpg`. Beide Ansichten verwenden dieselbe ausschliesslich lokale, zeitlich begrenzte Testsitzung. Vorschauhelper und eigene Testdatenbank bleiben für diese Live-Durchsicht aktiv; deren Prozess-/Containerdaten stehen privat in `.qa-phase1/coherent-preview-state.json`. Sie sind anschliessend gezielt aufzuräumen. Keine neuen GitHub-Aktionen oder produktiven Deployments in diesem Block.
