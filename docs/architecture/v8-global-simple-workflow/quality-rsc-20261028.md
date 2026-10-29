# Binso One V8 – RSC-/WebKit-Lokalisierung, 28. Oktober 2026

## Ergebnis und Release-Status

Der technische RSC-Lokalisierungsblocker ist geschlossen.
Die vollständige WebKit-Prüfung und die vollständige Chromium-Gegenprüfung enden
jeweils mit Exit 0. **Der Release bleibt BLOCKIERT:** Dieser lokale Folgeauftrag
erteilt keine Produktivfreigabe und ersetzt keine echte Safari-/iPhone-/iPad-/iOS-PWA-
Abnahme oder die weiterhin offenen betrieblichen Nachweise des bisherigen V8-Berichts.

Es wurde kein produktiver Anwendungscode geändert. Ausschliesslich der belegte
Testablauf wurde korrigiert und strenger gegen Browserfehler abgesichert.
HEAD: `afaf2a91688a5714cf3c35df4050fdbbfcb481c2`, unveröffentlichter Arbeitsstand.
Finaler Quellfingerabdruck: `c8788bed2c67c0f33f1e1327795c6919c194d37a8c9e5795a3313a0ec4e1d09f`.
1167 Quelldateien/Assets sind einzeln gebunden; [final-source.json](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-rsc/final-source.json>).

## Tatsächlicher Ablauf und Ursache

Die bisherige Prüfung wechselte nach SPA-/Sprachänderungen mehrfach per goto oder
reload das ganze Dokument. Eine bereits erreichte Playwright-networkidle-Markierung
war keine Gewähr, dass später gestartete Vorabrufe oder noch eingeplante Browser-
Idle-Aufgaben abgeschlossen waren. Einige private Präferenzwechsel warteten zudem
nur nach dem Dokumentwechsel statt vor dessen Beginn.

Die kontrollierte Diagnose verzögerte ausschliesslich echte RSC-Anfragen um 800 ms;
Antworten wurden weder gefälscht noch verworfen. Am untersuchten Reload der
Datenschutzseite nach dem Sprachwechsel waren vier Requests offen:
impressum, agb, auftragsbearbeitung und unterauftragsbearbeiter. Sie trugen RSC=1,
Next-Router-Prefetch=1 und sec-fetch-site=same-origin. Der alte Dokumentwechsel
führte zu vier Request-Abbrüchen und zwei Browserfehlern. Die Fehlermeldungen
nannten zusätzlich noch eingeplante login-/registrieren-Vorabrufe mit einem anderen
RSC-Zustandsschlüssel; für diese Fehlerversuche gab es keinen neuen Transportstart.
Erfolgreiche Antworten anderer Zustandsschlüssel dürfen damit nicht verwechselt werden.

Die Fehlermeldung „due to access control checks“ war somit hier kein Nachweis einer
CORS-Fehlkonfiguration: gleiche Origin, keine entsprechende 403-/CORS-Serverantwort,
Abbruch unmittelbar beim harten Dokumentwechsel. Reale Render-/Hydrationsfehler
werden weiterhin unabhängig davon geprüft. Die absichtlich fehlende Route lieferte
im kontrollierten Gegenversuch korrekt 404; das war ein eigener vorgesehener Prüffall.

[Anfragen und Fehler vor der Korrektur](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-rsc/rsc-controlled-before-isolated-summary.json>),
[unveränderte Ereignisfolge](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-rsc/rsc-controlled-before-isolated/rsc-events.ndjson>),
[Ereignisse nach der Korrektur](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-rsc/rsc-controlled-after-summary.json>).
Die Ereignisfolgen enthalten Navigationstrigger, Frame-/Dokument-Lebenszyklus,
Anfragekennungen, relevante Header, Response-Status und Fehlerzeitpunkte.

## Windows-WebKit und unabhängige Kontrollen

[native-controls-results.json](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-rsc/native-controls-results.json>) lädt keinen Binso-/React-Code.
Chromium 151.0.7922.34 und Windows-WebKit 26.5 werden mit demselben lokalen HTTP-Server
und gleich-originigen RSC-förmigen Fetches verglichen:

| Kontrollfall | Chromium | Windows-WebKit |
| --- | --- | --- |
| Dokumentwechsel bei unbehandeltem offenen Fetch | 0 Pageerrors | 1 Pageerror / 1 Request-Abbruch |
| Derselbe Wechsel mit explizit behandelter Fetch-Ablehnung im Minimalmodell | 0 Pageerrors | 0 Pageerrors / 1 Request-Abbruch |
| Fetch tatsächlich abgeschlossen, dann Reload | 0 Fehler/Abbrüche | 0 Fehler/Abbrüche |
| Nur History-Wechsel, Fetch läuft zu Ende | 0 Fehler/Abbrüche | 0 Fehler/Abbrüche |
| Absichtlicher echter JavaScript-Fehler | erkannt | erkannt |
| Absichtlicher HTTP-Serverfehler | Status 503 erkannt | Status 503 erkannt |

Das belegt einen plattformabhängigen Unterschied bei der Beobachtung alter
Dokument-/Promise-Abbrüche, keine generelle Fehlerfreiheit der Anwendung oder des
Browsers. Die Korrektur patcht weder WebKit noch Next.js. Rasche absichtliche
Dokumentabbrüche bleiben solche Abbrüche; der sequenzielle Lokalisierungstest
erzeugt sie nicht mehr unbeabsichtigt. Reale Geräte wurden nicht getestet.

## Korrektur ohne Fehlerausnahmen

Der gemeinsame Test-Owner createDocumentNavigation erfasst Request-Start und
Request-Ende/-Fehler pro Seite; nicht zuordenbare Requests werden ebenfalls
berücksichtigt. Vor einem Dokumentwechsel werden vorherige Frame-/Idle-Aufgaben
abgewartet und anschliessend echte Request-Ruhe geprüft: kein offener Request und
500 ms ohne neue Netzwerkaktivität. Neue Aktivität setzt diese Grenze zurück.
Ein Timeout nach 30 Sekunden oder ein voreilig geschlossenes Dokument führt zum
Fehler, nicht zu einem angenommenen Erfolg. Es gibt keine pauschale Schlafpause
als Ersatz für erfolgreiche Antworten.

Die bisherige textbasierte Reload-Fehlerausnahme und das vorzeitige Abmelden der
Pageerror-Listener sind entfernt. Jeder Pageerror bleibt fatal, auch während Reload
und Teardown; nach Schliessen der Seite/des Kontexts wird erneut geprüft.
Die bewusst gehaltenen Notification-GETs behalten ihre eigenen Pending-/Fehler-
Assertions. Alle Sprach-, Persistenz-, Rollen-, Breiten-, Inhalts- und Mutations-
Assertions bleiben erhalten. Keine Anwendungsprefetches oder Routen wurden deaktiviert,
keine CORS-Header geändert, keine Browserfehlermeldungen global gefiltert.

## Rot-Grün und Abdeckung

| Lauf | Tatsächlicher Exit / Ergebnis |
| --- | --- |
| Einzel-/vollständige Diagnose ohne künstliche Latenz | Exit 0; sporadischer Ausgangsfehler unter günstiger Laufzeit nicht zwangsläufig reproduzierbar. [rsc-before-full.json](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-rsc/rsc-before-full.json>) |
| Kontrolliert langsame echte RSC-Antworten, alter Ablauf | Exit 1: 4 offene RSC-Anfragen beim Wechsel, 4 Request-Abbrüche, 2 Pageerrors. [rsc-controlled-before-isolated.json](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-rsc/rsc-controlled-before-isolated.json>) |
| Identische Latenz, korrigierter Ablauf | Exit 0: keine offenen Anfragen beim Wechsel, keine Request-Abbrüche, keine Pageerrors. [rsc-controlled-after.json](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-rsc/rsc-controlled-after.json>) |
| Absichtlich ausgelöster echter JS-Fehler in der tatsächlichen Prüfstrecke | Exit 1 wie vorgeschrieben; faults enthält intentional-rsc-render-negative. [render-negative.json](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-rsc/render-negative.json>) |
| Unit-Gegenprüfungen | Exit 0; echte Helper-Funktion mit alten/verspäteten Requests, unverbrauchten Fehlerereignissen, Timeout und vorzeitigem Close. [navigation-unit.log](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-rsc/navigation-unit.log>) |
| Lokalisierungs-/Navigations-Units und gezielter Lint | Exit 0 / 0. [localization-unit.log](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-rsc/localization-unit.log>), [targeted-lint.log](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-rsc/targeted-lint.log>) |
| Vollständige WebKit-Lokalisierung | Exit 0: 15 Sprach-/Viewport-Fälle, 75 Kernroutenprüfungen, 225 Dokumentwechsel inkl. 60 Reloads; vor jedem Wechsel 0 offene Anfragen. [localization-after.log](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-rsc/localization-after.log>) |
| Vollständige Chromium-Lokalisierung | Exit 0: 15 Sprach-/Viewport-Fälle, 75 Kernroutenprüfungen, 225 Dokumentwechsel inkl. 60 Reloads; vor jedem Wechsel 0 offene Anfragen. [localization-chromium.log](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-rsc/localization-chromium.log>) |

Beide vollständigen Browserläufe umfassen de, fr, it, en und tr bei 390, 768 und
1440 Pixeln. Öffentliche Ansicht, Dashboard, Operator, Wartung, 404, Datenschutz/
Consent, Sprachauswahl, Account-Präferenz, Notification-Präferenz und Operator-
Speichertrennung bleiben enthalten. [coverage-summary.json](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-rsc/coverage-summary.json>) prüft die
vollständige kartesische Abdeckung und die tatsächlichen Navigationszähler.
Ein Pilotversuch mit kollidierendem Testport ist separat erhalten und wurde nicht
als unabhängige Ursachen-Gegenprobe gezählt; die qualifizierte Latenzprobe nutzt 3390.

## Vollständige abschliessende Pflichtprüfungen

Die folgenden Prüfungen wurden nach erfolgreicher vollständiger WebKit-Prüfung und
Chromium-Regression auf dem final festgesetzten Stand ausgeführt:

| Prüfung | Exit |
| --- | --- |
| release:check | 0 |
| db:contract | 0 |
| test | 0 |
| lint | 0 |
| css:check | 0 |
| typecheck | 0 |
| build | 0 |
| legacy-checksum-attestation-test | 0 |
| browser-calendar-test | 0 |
| compliance/selftest | 0 |
| compliance/report-test | 0 |
| quality-browser-plan-test | 0 |
| workflow-safety-test | 0 |
| release-artifact-test | 0 |
| security:scan | 0 |
| security:scan:all | 0 |
| Native PostgreSQL: postgres-parallel-test | 0 |
| Native PostgreSQL: auth-integrity-test | 0 |
| Native PostgreSQL: registration-test | 0 |
| Native PostgreSQL: passkey-test | 0 |

[final-static-results.json](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-rsc/final-static-results.json>), [final-security-results.json](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-rsc/final-security-results.json>),
[final-native-results.json](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-rsc/final-native-results.json>) enthalten Beginn, Ende und unveränderte
Rückgabewerte. Das Paketkommando enthält weiterhin alle 94 Pflichtprogramme;
[final-test.log](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-rsc/final-test.log>). Die neuen Gegenprüfungen sind zusätzlich eingebunden.
Kein vorhandenes Programm wurde ausgeschlossen. Source-Guards vor/nach dem Lauf
prüfen den vollständigen Quellstand; [final-static-controller.log](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-rsc/final-static-controller.log>).

## Geschützter Stand, Einschränkungen und Übergabe

Geänderte/ergänzte Quelldateien ausschliesslich:

- `scripts/document-navigation-browser.mjs`
- `scripts/document-navigation-test.mjs`
- `scripts/language-preference-browser.mjs`
- `scripts/localization-browser-test.mjs`
- `scripts/localization-test.mjs`

Lediglich die bestehenden Integrationsinventare wurden für die tatsächlichen
Testquellen neu erzeugt. Anwendung und alle übrigen Quelldateien sind gegenüber
dem gesicherten Ausgangsstand bytegleich, einschliesslich Fokus-/Menü-/Feld-
Korrekturen, Berechnungsengine, Budgetdateien, Migrationen, Authentifizierung,
Hauptnavigation und Geschäftsprozessen. [final-integrity.json](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-rsc/final-integrity.json>) enthält
auch 37 unveränderte gesicherte Fachdateien, den finalen Build,
Git-Status und git diff --check. Der getestete Browserbuild stammt vom identischen
unveränderten Anwendungscode; der abschliessende Produktionsbuild ist separat
geprüft. Das ist keine Veröffentlichung eines unveränderlichen Releasepakets.

Die früheren fachlichen V8-Grenzen gelten unverändert; siehe
[Abrechnungsabnahme](billing-completion-acceptance.md) und
[vorheriger Qualitätsstand](quality-red-gates-20261028.md). Echte Safari-, iPhone-,
iPad- und installierte iOS-PWA-Prüfungen bleiben offen, ebenso weiterhin notwendige
betriebliche/quellgebundene Produktionsabnahmen und die gesonderte Freigabe.

Der technische RSC-Testblocker ist geschlossen; **Release weiterhin BLOCKIERT**.
Kein GitHub-Push, Merge, Azure-Deployment, produktive Migration oder kostenpflichtiger
Dienst wurde eingerichtet. Lokale Testcluster wurden nach Ende ihrer Prüfungen
sauber beendet; [ui-db-stop.exit.txt](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-rsc/ui-db-stop.exit.txt>), [native-db-stop.exit.txt](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-rsc/native-db-stop.exit.txt>).
