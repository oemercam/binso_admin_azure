# V21.5 Architekturabgleich und Release-Readiness

## Tatsächlicher Ausgangsstand

Stand 09.10.2026: `main` = `1eef9fb1d005d4752f12a9dd5c0e620decca4444`, PR #227 integriert. Azure Health liefert genau diesen SHA (`status: ok`). Letzte main Quality 37961392051 und Azure 37962814471 erfolgreich. Die Health-Abfrage ist ein schreibfreier Versionsnachweis, keine Kandidatenabnahme.

V21.1: Draft #228, `7b90a5c7353cf2061987fcd0f4550210bbc00f92`, Quality 37972538262 bestanden. V21.3: Draft #229, `d1a9e4165f1401f85d394adba6fe9d39ba91bf9a`, vollständige Quality 37989005761 einschliesslich beider Browser bestanden. Beide sind noch nicht nach main gemergt. V21.5 baut auf diesem unveränderten GitHub-Kandidaten auf und enthält beide Foundations. Fremde Branches werden nicht zurückgesetzt oder automatisch gemergt.

Kein separater integrierter V21.2-/V21.4-Implementierungscommit oder PR auffindbar im geprüften aktuellen Remote-Branchinventar und den zwölf zuletzt aktualisierten PRs. Das ist eine konkrete Nachweislücke, kein Beweis, dass keine entsprechenden Funktionen existieren. FormWizard, Dirty-Snapshot, Sheet-/Browser-Abbruchschutz und FAST/INTEGRATION/RELEASE sind tatsächlich im Code vorhanden. Andere offene PRs, insbesondere #222, bleiben erhalten. Vollständiger PR-/Run-Abgleich zum Freigabezeitpunkt erneut erforderlich.

## Foundation-Integrationsmatrix

| Foundation | Anforderung | Implementiert / tatsächlich verwendet | Technischer Nachweis | Abweichung / Status |
| --- | --- | --- | --- | --- |
| V21.1 UI | Seitentemplates | Domainseiten nutzen AppShell, PageHeading/DetailHeading, RecordsView, UI-Controls | Vollständiger Source-/Rendergraph, UI-/Navigationsprüfungen, V21.3 Browser | Nicht jeder Zustand visuell freigegeben; In Bearbeitung |
| UI | Tokens / CSS | Sechs geordnete zentrale Stylesheets; Control-/Overlay-/Safe-Area-Tokens | CSS-Contract und Frozen-Navigation-Vertrag | Cascade-Kandidaten sind keine bewiesenen Fehler; In Bearbeitung |
| UI | Sheets / Top-Panels / Dialoge | binso-ux, HeaderPanel, useDialogFocus, ConfirmDialog | SSR/Lint-Fixtures und Browser-Fokus-/Scrollprüfungen | Physische Tastatur/PWA offen; In Bearbeitung |
| V21.2 Prozesse | Wizard-Engine | FormWizard in Dokumenten, Mitarbeiteranlage und UX-Lab | SSR drei Schritte; echte Browser-Schrittnavigation | Schritt-1-Abbruch in V21.5 korrigiert; gezielte Chromium-Prüfung bestanden |
| Prozesse | Dirty-State | useDirtySnapshot; Sheet-Snapshot; AppShell und ein Browser-Back-Guard | Unveränderter/edierter Wizard-Abbruch und Retention im Browser | Domäneneigene Persistenz bleibt fachlich getrennt; universelle Entwurfswiederaufnahme nicht vorhanden |
| Prozesse | Speichern | Bestehender API-Client, Domainvalidierung, Busy-Refs und sichere finanzielle Replay-Keys | Echte Formhandler und Server-/PG-Prozesse | Kein generischer Ersatz für alle Fachtransaktionen; vollständige Journey-Abnahme offen |
| V21.3 Daten | API / Finanzkonsistenz | Gemeinsame Minor-Unit-Berechnung, Snapshot-Reader und atomare Geschäftsoperationen | Actual repository/PGlite/PG16/API-/Browserprüfungen | Vollständige authentifizierte Schreibrollenmatrix offen |
| Daten | Cache / Mutationen | useApiQuery, metadata-only data-events, Sessionfence, gezielte Consumer-Invalidierung | Sieben Payment-Consumer über mehrere Tabs; Rollen- und Sessiontests | Cross-device Reader pollen, kein neu erfundener Live-Push |
| V21.4 Qualität | Teststufen | qa fast/integration/full, conservative qa-plan, erforderliche Jobs | qa-plan/browser-shards fixtures, vollständige V21.3-CI | Kein separater V21.4-Commitnachweis; Kandidaten-CI erforderlich |
| Qualität | Deployment | Ein verifiziertes Artefakt; SHA/Health/Ready/Route-Smoke | main Azure-Run + aktuelle Health | V21.5-Deployment nicht freigegeben; Blockiert mit konkreter Ursache |

## Nachgewiesene Ursachen und zentrale Korrekturen

| ID | Ursache / Quellenbeweis | Umsetzung | Entfernte Altlast | Technischer Test | Sichtbarer Nachweis / Status |
| --- | --- | --- | --- | --- | --- |
| I1 | FormWizard deaktivierte Zurück bei step===0 statt Abbruch | cancelAction verbindlich; Schrittgrenzen und Busy-Abbruch zentral; alle drei Aufrufer migriert | Funktionsloser Schritt-1-Button | SSR First/Middle/Final, Lint-Ownership; employees Browser | /mitarbeiter/neu, Light/Dark, 375/1440 und 400px-Height geprüft; WebKit acht Light/Dark/Mobile-Kombinationen ebenfalls bestanden; Required-CI offen |
| I2 | mutationResult akzeptierte gültiges JSON ohne bestätigte Persistenz; PaymentForm zeigte danach Erfolg | Payment-/Document-Create brauchen item.id, Dokument zusätzlich number vor publishMutation | Zu frühe Erfolgsinvalidierung | null/{}/leere ID/fehlende Nummer müssen invalid_response ergeben; keine Revision | PaymentForm verweigert 2xx {} ohne Erfolg; anschliessender Same-Key-Replay und sieben Tabs browsergeprüft; gezielt bestanden, Required-CI offen |
| I3 | ProjectForm once-only GET-Effekte ignorierten Invalidierungen und konnten Source-/Kundenantworten lokal überschreiben; kein expliziter Dirty-State | bestehendes useApiQuery + einmalige Quellinitialisierung, Lade-/Fehlerblockade mit gezieltem Retry; useDirtySnapshot | Zwei direkte GET-Effekte | Lint/Typecheck und vorhandene Projektprozess-Tests | /projekte/neu Light/Dark 375/1440; Chromium 375: 503-Blockade, Retry ohne Reload, gesperrter Quellkunde, Hintergrundupdate ohne Draft-Verlust und Abbruchbestätigung bestanden; WebKit desselben zusätzlichen Falls ebenfalls bestanden |
| I4 | app-pages war ein ungenutzter Runtime-Barrel; alle Seiten importieren actual owners; readPageFile virtualisiert bereits die Tests | Import-/Exportgraph geprüft; Barrel gelöscht; Testschutz gegen Wiedereinführung | components/app-pages.tsx | UI-Foundation, Test-only readPageFile, Build; keine Runtime-Imports im Graph | Kein UI-/Navigationsverhalten geändert |
| I5 | Wizard-Wrapper konnten ausserhalb ihres Owners kopiert werden | vorhandenen ESLint-Ownerguard um form-wizard/wizard-content/wizard-progress erweitert | Keine weitere Engine eingeführt | Lint-Negativfixtures müssen kopierte Wrapper ablehnen | Technischer Architekturschutz; kein visueller Vollständigkeitsbeweis |

## Abhängigkeiten und Legacy-Grenzen

`v21-5-integration-inventory.json` enthält alle lokalen App-/Component-/Lib-/Config-/Script-Imports mit Quellzeilen, Typ-/Runtime-/Dynamic-Kennung, Provider und Effect-Stellen sowie sämtliche JSX-Owner/Consumer und CSS-Cascade-Kandidaten. Tarjan prüft den statischen Runtime-Importgraph. Keine gefundenen Zyklen im erfassten Graph; nichtliterale dynamische Imports und externe Modulkonventionen bleiben ausgewiesene Analysegrenzen. Ein neuer Lauf darf keinen bestätigten Zyklus oder alten Barrel-Import einführen.

Kein blindes CSS-Löschen: unterschiedliche deklarierte Werte und wiederholte Media-Selektoren bleiben Kandidaten, bis CSSOM und gerenderter Zustand einen Widerspruch zeigen. Keine neuen CSS-Overrides, !important-Regeln oder Navigationstokens in diesem Paket. Keine DB-Strukturen entfernt. Historische Audit-Dokumente mit alten app-pages-Pfaden sind historische Nachweise und ersetzen nicht das aktuelle Inventar.

## Vollständiger Routen- und Abnahmestatus

`v21-5-routes.md`: sämtliche 71 Source-Seitenrouten plus 13 Operator-Dispatchvarianten. Pro Route tatsächlicher Owner, Seitenfamilie, Canonical Responsibility, Layout und Berechtigung. Keine Route erhält aus der statischen Analyse automatisch den Status bestanden. Die eingebetteten PDF-, Wizard- und Chat-Ansichten werden über ihre realen Owner erfasst.

| Foundation / Prozess | Umsetzungs-/Testbeleg | Visueller Nachweis | Abnahmestatus |
| --- | --- | --- | --- |
| Kundenanlage / Kontakt / Bearbeitung | Actual form handlers, customer workspace, contact atomic PG fixtures | V21.3 synthetic browser contact/rename cases | In Bearbeitung: vollständige Journey aller Rollen offen |
| Angebot / Rechnung / Nummern | Zentraler serverseitiger atomarer Counter, Idempotenz, offer→invoice/time billing | Document preview/Wizard Browser | In Bearbeitung: V21.5 aller Dokumentzustände offen |
| Teil-/Vollzahlung / Storno | PG16 Parallel-/Replay-/Overpayment; centrale financial status/money | PaymentForm + sieben Tabs in V21.3; V21.5 2xx-JSON-Fehler plus Replay gezielt bestanden | In Bearbeitung: neues ungültiges 2xx-JSON-Verhalten gezielt browsergeprüft; Required-CI offen |
| Timer / Freigabe / Verrechnung | Zeitstempel, PG parallele Start/Stop, already-billed block, rollback | Navigations-/Restart-/Tab-Tests | Blockiert mit konkreter Ursache: physische installierte PWA fehlt |
| Spesen / Belege / Freigabe | actual upload/file metadata/content checks; expense approval/billing atomic fixtures | expense sheets/browser cases | In Bearbeitung: gesamte employee→expense→invoice Journey offen |
| Mitarbeiter / Dokumente | shared directory/readers, roles and tenant isolation | wizard retention/cancel/short viewport geprüft | In Bearbeitung: alle Dokument-/Arbeitszeitvarianten offen |
| Profil / Einstellungen / Benachrichtigungen | useApiQuery, editing hydration protection, API preferences rollback | settings multi-tab/retry browser | In Bearbeitung: alle Sprachen/Zustände offen |
| Support / Chat | Actual tenant ticket/message handlers, shared bubbles/thread viewport | Chat scrolling/focus cases | In Bearbeitung: reale Mobile-Tastatur offen |
| Login / MFA / Session / Logout | auth fixtures; every inventoried private GET across eight roles; expired DB session | Sessionfence/logout/navigation browser | In Bearbeitung: full authenticated write-role/ID matrix and real Entra login open |
| PDF / QR / Historie | A4 generation, template snapshot, open balance QR and paid/cancelled/draft suppression | Single-page canvas + next/previous | In Bearbeitung: unabhängige vollständige norm-/Dokumentabnahme offen |
| Operatorgrenzen / Monitoring | requireOperator guards, separate session, no tenant-route rights; outbox metrics | Operator plan cross-tab/retry/logout | In Bearbeitung: vollständige Operator-Rollenmatrix/SSO offen |
| Bottom-Navigation | JSX, access/display/scroll logic, Icons, CSS and transitive tokens equal main | Existing browser responsive cases | Geprüft und bestanden: technischer Unverändert-Vertrag |
| UX-Lab / Architecture | synthetic dev-only notFound in production; controls/sheets/wizard/panels/errors/PDF | Existing lab browser; neue Cancel-Variante separat zu prüfen | In Bearbeitung |
| Pipeline | See v21-5-pipeline-timings.md; exact step timestamps | Kein UX-Nachweis erforderlich | In Bearbeitung: V21.5 Required-CI offen |

## Datenbank / Produktion / Empfehlung

V21.5 fügt keine neue Migration hinzu. Die gestapelte V21.3-Basis enthält additive nullable Migration0046 für sichere Datei-Zuordnungen; diese ist isoliert getestet, aber noch nicht produktiv angewendet. Keine produktiven Daten wurden geschrieben, gelöscht, zurückgesetzt oder umnummeriert. Synthetische DB-Tests lehnen nichtlokale/nichtleere Testdatenbanken ab.

**Release noch nicht empfehlen.** Kandidaten-CI, vollständige noch offene Prozess-/Schreibrollen-/visuelle Abnahme, eindeutiger V21.2-/V21.4-Abgleich, physische PWA- und freigegebene Azure-Kandidatenprüfung fehlen. Keine Merge-/Deployfreigabe wird aus einem früheren Run abgeleitet. Erst belegte Aufrufermigration + tatsächliche relevante Tests + visueller Scope erlauben den jeweiligen Status Geprüft und bestanden. Diese Matrix meldet keinen Gesamterfolg.

## Ergänztes HTTP-Schreibrollenpaket (geprüfter Umfang)

`api-tenant-postgres-test.mjs` führt 80 gültige POSTs über acht echte synthetische Tenant-Sessions aus. Erwartete Rollen sind unabhängig von tenantCan festgelegt. Zugelassene Requests müssen 201, eine persistierte ID im eigenen Mandanten und exakt einen zusätzlichen Datensatz ergeben; verbotene Requests 403 und keine Datenänderung. Auch der andere Mandant muss unverändert bleiben. Fremde Kunden-IDs werden zusätzlich mit PATCH und DELETE über alle acht Rollen geprüft (404/403, ursprünglicher Datensatz bleibt unverändert).

| Erfassung | Zugelassene Rollen | Persistenzbeleg |
| --- | --- | --- |
| Kunde | owner/admin/finance/project_manager/manager | customers |
| Mitarbeiter | owner/admin/hr | employees |
| Produkt | owner/admin | products_services |
| Projekt | owner/admin/project_manager/manager | projects |
| Interne Zeit | owner/admin/project_manager/manager/member | time_entries |
| Spese als Entwurf | owner/admin/finance/project_manager/manager/member | expenses |
| Support-Ticket | alle acht Tenant-Rollen | support_cases |
| Angebot | owner/admin/project_manager/manager | quotes |
| Rechnung | owner/admin/finance | invoices |
| Zahlung auf offene synthetische Rechnung | owner/admin/finance | payments |

Status: **Geprüft und bestanden** für dieses genaue Schreibrollenpaket: Quality1164 / 37991755760, Build-Job114027443045, tatsächlicher HTTP/PG16-Gate erfolgreich (6 s). Dies ist ein Prozess-/Persistenznachweis und kein visueller Nachweis sämtlicher Erfassungszustände. Lokale synthetische Repository-Tests ersetzen diesen Nachweis nicht. Die übrigen Statuswechsel-/Versand-/Einladungs-/Datei-/Operator-/Finanzschreibverträge sind nicht damit automatisch vollständig abgedeckt. Tests verweigern bestehende oder produktive Datenbanken und löschen keine Geschäftsdatensätze.

## Bestätigter CI-Infrastrukturfehler

Quality1163 / 37991387930 scheiterte in beiden PostgreSQL-Jobs bereits bei Initialize containers: Docker Hub meldete `toomanyrequests: You have reached your unauthenticated pull rate limit`. Keiner der neuen Schreibtests wurde in diesem Lauf ausgeführt. Quality blockierte korrekt; Browser wurde wegen fehlendem Build übersprungen und gilt nicht als bestanden.

Die Service-Imagequelle wird auf Docker Official Image `public.ecr.aws/docker/library/postgres:16` umgestellt (Publisher-Verzeichnis: https://gallery.ecr.aws/docker/library/postgres). Beide PostgreSQL-Services, Healthchecks, isolierte Datenbank, sämtliche Tests und das blockierende Quality-Gate bleiben erhalten. Der authentifizierte HTTP-Gate prüft zusätzlich server_version_num auf PostgreSQL16. Quality1164 bestätigt PostgreSQL16.15, erfolgreiche Parallel-/HTTP-Verträge und Build über diese Quelle; die Browser-Gates und der nachfolgende finale Commit benötigen weiterhin eigene vollständige Nachweise; kein Infrastruktur-Fallback ersetzt Datenbanktests durch Mocks.

## FAST-Ursache und Korrektur

Die vorhandene Änderungsplanung wählte für den globalen API-Client und Wizard bislang UX-/Theme-Tests, aber nicht die tatsächlichen Data-/UI-Foundation-Verträge aus. V21.5 ergänzt diese Zuordnung in der bestehenden qa-plan-Funktion. Backend/Query/Money/Financial-Status/Perioden wählen data-foundation-test; gemeinsame UI/Wizard/Lint-Owner wählen ui-foundation-test; Shell/Operator/Tokens/CSS behalten den Frozen-Navigation-Vertrag. Ausführbare Plan-Tests sichern jede Zuordnung. RELEASE-Abdeckung und erforderliche Browser-/Security-/Datenbank-Gates bleiben gleich.

## Abgleich aller 24 abschliessenden Kriterien

Diese Zeilen ergänzen den Route-/Prozessnachweis; sie ersetzen keine noch fehlende Prüfung. Technisch bestandene Teilverträge sind ausdrücklich vom vollständigen Produktkriterium getrennt.

| Nr. | Kriterium | Aktueller Nachweis / konkrete Restarbeit | Status |
| --- | --- | --- | --- |
| 1 | V21.1–V21.4 integriert und abgeglichen | V21.1/V21.3 im Kandidaten; vorhandene Prozess-/QA-Implementierungen geprüft; eigenständiger V21.2/V21.4-Nachweis fehlt | In Bearbeitung |
| 2 | Sämtliche Haupt-/Unterseiten inventarisiert | 71 Framework-Seiten + 13 Operator-Varianten im Source-Inventar; Vollständigkeit gegen aktuellen Dateibaum getestet | Geprüft und bestanden |
| 3 | Gemeinsame UI einheitlich verwendet | Owner/Consumer inventarisiert; Lint-Ownership; vollständige gerenderte Variantenabnahme fehlt | In Bearbeitung |
| 4 | Gemeinsame Prozessgrundlage | Alle drei Wizard-Aufrufer migriert; einfache Fachformulare behalten gemeinsamen Field/FormActions-Vertrag; vollständige Journeys fehlen | In Bearbeitung |
| 5 | Nummern erst nach Erstellung | Atomare serverseitige Vergabe, keine vorweggenommene Nummer im Wizard; API/PG/Browser-Verträge | In Bearbeitung: letzter Kandidaten-Gate offen |
| 6 | Wizard-Schrittnavigation | SSR aller Schrittaktionen, echte Retention-/Cancel-Browserfälle beider Engines | In Bearbeitung: letzter Kandidaten-Gate offen |
| 7 | Speichern/Abbrechen zuverlässig | Busy/Dirty/invalid-response/Replay-Verträge; alle einfachen Erfassungsvarianten noch nicht vollständig abgenommen | In Bearbeitung |
| 8 | Statusübergänge widerspruchsfrei | Zentral validierte Dokument-/Zeit-/Spesenregeln und PG-Regressionsfälle; vollständige HTTP-Statusrollenmatrix fehlt | In Bearbeitung |
| 9 | Modulübergreifende Datenkonsistenz | Gemeinsame Invalidierung, sieben Zahlungsconsumer, Session-/Tab-/Retry-Prüfungen; Gesamtprozessabnahme fehlt | In Bearbeitung |
| 10 | Finanzbeträge/Zahlungsstände | Minor-Unit-/Rundungs-/Teil-/Vollzahlungs-/Storno-/Überzahlungs-/Replay-Verträge | In Bearbeitung: letzter Kandidaten-Gate offen |
| 11 | Serverberechtigungen/Mandanten | Alle privaten GET-Routen über acht Rollen; 80 gültige POST-Rollenfälle; vollständige übrige Schreib-/Operatorfälle fehlen | In Bearbeitung |
| 12 | Vollständige PDF-Dokumente | Aktuelle Generator-/Snapshot-/Text-/A4-Tests und Vorschau; vollständige Dokumentvariantenabnahme fehlt | In Bearbeitung |
| 13 | Schweizer QR | Offener Betrag, Referenz/IBAN und nichtzahlbare Zustände getestet; unabhängige vollständige Normabnahme fehlt | In Bearbeitung |
| 14 | Header/Listen/Formulare/Sheets/Panels | Gemeinsame Owner, Fokus/Scroll/Responsive-Browserfälle; alle gerenderten Varianten fehlen | In Bearbeitung |
| 15 | Chat-Scroll | Browser-Thread/Composer/Fokus geprüft; physische Mobile-Tastatur fehlt | Blockiert mit konkreter Ursache |
| 16 | Kein horizontaler Gesamtüberlauf | Responsive-CI prüft definierte Routen/Breiten/Themes; physische installierte PWA fehlt | In Bearbeitung |
| 17 | Vertikales Scrollen | Scroll-/Overlay-/Back-Verträge und definierter Browserumfang; Gesamtabnahme aller Zustände fehlt | In Bearbeitung |
| 18 | Keine doppelten Loader | Start-/Session-/Navigation-/PWA-Lifecycle-Verträge; physischer PWA-Kaltstart fehlt | In Bearbeitung |
| 19 | Bottom-Navigation unverändert | Vollständiger eingefrorener JSX-/Access-/Scroll-/Icon-/CSS-/Token-Vertrag gegen main | Geprüft und bestanden |
| 20 | Bestätigte Altlasten beseitigt | I1–I5 und FAST-Ursache behoben; Barrel kontrolliert entfernt; CSS-Kandidaten nicht pauschal gelöscht | In Bearbeitung: gesamte Legacy-Abnahme offen |
| 21 | Architektur/Prozess/Security/UX-Regressionsgates | Lokale und vorherige vollständige Gates; finale Required-CI für letzten Commit ausstehend | In Bearbeitung |
| 22 | Entwicklungs-/Releasepipeline | Main-Release nachvollzogen; PG-Registry-Ursache behoben; finale Kandidatenprüfung offen | In Bearbeitung |
| 23 | Vollständige dokumentierte Abnahmematrix | Diese 24 Kriterien + Foundation-/Root-Cause-/Route-/Prozesstabellen mit ausdrücklichen offenen Punkten | Geprüft und bestanden: Dokumentationsumfang, kein Produktgesamtpass |
| 24 | Keine ungeklärten kritischen Regressionen | Bekannte Test-/Abnahmegrenzen dokumentiert; vor vollständiger Abnahme keine positive Gesamtbehauptung | Offen |

## Browser-Back vor passiven Effekten

Quality1164 scheiterte im Chromium-Browserjob beim direkten Browser-Zurück unmittelbar nach einer Änderung in Einladung/Passwortreset: Der erwartete Alertdialog erschien nicht. Der zentrale useBrowserBackGuard registrierte die History-Grenze bisher in einem passiven useEffect. Damit besteht nachweislich ein Zeitfenster für einen unmittelbaren History-Wechsel vor der Registrierung. Der lokale alte Build bestand den Einzeltest; der CI-Fehler ist mit dieser Race Condition vereinbar, aber seine genaue Laufzeitreihenfolge ist nicht aufgezeichnet. Die bestehende zentrale Registrierung und Callback-Aktualisierung werden in useLayoutEffect vor dem Paint ausgeführt. Kein neuer Guard, keine verlängerte Wartezeit und kein übersprungener Test; dieselben schnellen Browser-Back-Fälle bleiben blockierende Regressionen. Endgültiger Erfolg erfordert den erneuten vollständigen Kandidatenlauf.

## Weitere bestätigte Erfassungsantworten

CustomerForm, EmployeeForm und ProductForm warteten auf apiPost, prüften aber dessen Ergebnis nicht vor savedRecord/Erfolg und Navigation. Ein HTTP201 mit `{ok:true}` ohne persistierte ID konnte dadurch eine fiktive Erfolgsmeldung erzeugen. Die vorhandene mutationResult-Prüfung gilt jetzt zusätzlich für die tatsächlich geprüften `{item.id}`-Create-Verträge von Kunden, Mitarbeitern, Produkten, Projekten, Spesen, manueller Zeit, Support-Tickets und Datei-Uploads. Die geprüften PATCH-Verträge von Kunden, Mitarbeitern, Produkten und Spesen verlangen ebenfalls item.id. Die HTTP-Methode wird explizit an mutationResult weitergegeben, damit DELETE-Verträge mit ok:true unverändert gültig bleiben. Einstellungen, Auth und Statusaktionen mit anderen Antwortverträgen bleiben fachlich getrennt. Ungültige Antworten führen zentral zu invalid_response ohne Erfolgsinvalidierung; ein gültiger Persistenznachweis invalidiert gezielt. Unit-Verträge prüfen alle acht zusätzlichen APIs; der echte Produktformular-Browserfall prüft 201 ohne ID, erhaltenen Entwurf und anschliessenden bestätigten Erfolg. Diese letzte Erweiterung benötigt erneut den vollständigen Kandidaten-Gate.

## WebKit-Abnahme von Hintergrundtabs

Quality1166 bestand Checks/Build; WebKit scheiterte beim Warten auf den umbenannten Kunden in einer nicht aktivierten Kundenlistenseite. Die Editor-Auswahl war bereits aktualisiert; die genaue Scheduler-/Visibility-Reihenfolge des Listentabs ist nicht aufgezeichnet. Dieser Run gilt nicht als bestanden. Der Browservertrag prüft nun getrennt (ebenso für alle sieben Zahlungsconsumer, jeweils mit Broadcast-Empfang und eigenem Reload-Marker): tatsächlichen Empfang der metadata-only Broadcast-Invalidierung im Hintergrund, erhaltene Kundenauswahl beim Öffnen des Editors und aktuelle Kundenliste beim Öffnen ihres Tabs. Ein Dokumentmarker muss einen Reload ausschliessen. Kein Datenrequest wird im Test durch eine neue Antwort oder manuell aktualisierte UI ersetzt; keine zusätzliche Wartezeit und kein übersprungener Test. Die Anwendung nutzt ihre bestehende Broadcast-/Visibility-Revalidierung. Damit wird Browser-Tab-Aktivierung als realer Nutzungsschritt geprüft; ein ungeöffneter Hintergrundtab ist kein zuverlässiger visueller Scheduler-Nachweis.
