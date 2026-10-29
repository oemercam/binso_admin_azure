# Binso One V8 – Abschluss der lokalen Qualitätsschranken, 28.10.2026

Dieser Bericht dokumentiert den vorherigen Prüfstand. Die anschliessende lokale
Fortsetzung mit zentralen Fokuskorrekturen, neuen Gegenprüfungen und tatsächlichem
Endstatus steht im [aktuellen Folgeabschluss](quality-red-gates-20261028.md).
Frühere rote Protokolle bleiben historische Nachweise; sie wurden nicht umgeschrieben.

## Verbindlicher Release-Status: BLOCKIERT

Die vollständige lokale Prüfung wurde ausgeführt, aber nicht vollständig bestanden.
Die HTTP-Lücke, der verdeckte Produkt-/Profilhinweis und nachgewiesene veraltete
Testannahmen sind korrigiert. Es besteht keine Release-Freigabe: WebKit-Browsergates
und das Komponentenlabor bleiben rot. Produktion, GitHub-Push, Merge und Deployment
wurden nicht ausgeführt. Der erfolgreiche Chromium-Registrierungslauf ist keine
browserübergreifende Gesamtfreigabe.

## Endstatus der vollständigen Prüfungen

Die Dateien `final-browser-results.json` und `independent-functional-results.json`
enthalten jede Start-/Endzeit und jeden unveränderten Rückgabewert. Im Hauptlauf
bestanden 29 von 33 Paketen; im ergänzenden, nach Funktionsgruppe und Theme getrennten
WebKit-Lauf 13 von 24 Paketen. Letzterer verhindert, dass ein früher Fehler spätere
Funktionsgruppen verdeckt; er ersetzt keinen fehlgeschlagenen Gesamtlauf.

| Prüfung | Tatsächlicher Endstatus |
| --- | --- |
| Vollständiger Code-Testlauf | Alle 94 Programme bestanden; letzter Lauf `final-test-readiness-confirmed.log`, Exit 0. |
| Lint, Typen, CSS, Produktionsbuild, Sicherheitsprüfungen und statische Release-Verträge | Bestanden; ursprüngliche Kontextfehler und zugehörige gültige Gegenläufe sind unten getrennt dokumentiert. |
| Native PostgreSQL-Prüfungen | Vier vollständige Programme bestanden, einschliesslich realer Konkurrenz-, Integritäts-, Mandanten- und Abrechnungsprüfungen. Ausschliesslich isolierte lokale Datenbanken. |
| Authentifizierter HTTP-Vertrag | Gesamter Lauf bestanden, alle 105 GET-Inventareinträge klassifiziert, keine neuen Ausnahmen. Anonyme Negativprüfung für 219 private Methoden bestanden. Das ist keine Behauptung einer Vollabdeckung sämtlicher fachlicher Schreibvarianten. |
| Chromium-Routenmatrix | Alle fünf Pakete bestanden: 102 Routen × 14 Breiten × zwei Themes = 2’856 Kombinationen; alle 14 Funktionsgruppen im dafür vorgesehenen Paket bestanden. |
| WebKit-Routenmatrix | Pakete 1–4 bestanden (726 Kombinationen); Paket 0 wegen Laufzeitfehlern rot. Isolierte mobile Wiederholung vollständig bestanden: 33 Routen × 320/375/390 Pixel × zwei Themes = 198 Kombinationen. Damit sind 924 Routen-/Breiten-/Theme-Kombinationen erfolgreich erfasst. Die ergänzende reine Routenmatrix macht den ursprünglichen Funktionslauf nicht grün. `isolated-mobile-results.json`, alle drei Exit 0. |
| Abrechnungsbrowser | Bestanden: 26 Quellen und 160 Kombinationen mit jeweils drei Abrechnungsabläufen; echte Persistenz/Konkurrenz zusätzlich in PostgreSQL geprüft. |
| Registrierung Chromium | Vollständiger Gesamtlauf bestanden: Kernabläufe sowie Kundenimport, Zusammenführung, Systemzustände und Berichte. `final-registration-chromium.log`. |
| Registrierung WebKit | Kernprogramm bestanden; Gesamtprogramm Exit 1: Import-/Zusammenführungsaktionen und Downloadereignis des Berichts erreichen die Erwartung nicht. Keine Gesamtfreigabe. `final-registration-webkit.log`. |
| Übersetzungen | Chromium-Gesamtprogramm bestanden. WebKit Exit 1 bei Sprachpräferenz: nach erwartetem Wechsel auf fr bleibt en; `final-localization-webkit.log`. |
| Laden und Beobachtbarkeit | Beide Browser bestanden. Beobachtbarkeit mit echten lokalen HTTP-/DB-Zugriffen für die vorgesehenen Operatorrollen. |
| Zusätzliche Daten-/Rollenfixtures | Alle acht Pakete bestanden: leer, gross, teilweise, negativ, ohne Spesen, Admin, Finanzen, Mitarbeiter. |
| Scroll-/Startgeometrie, Referenzaufnahme | Beide Scrollprogramme und Referenzaufnahme bestanden; Referenzaufnahme ist keine fachliche Designfreigabe. |
| Komponentenlabor | Exit 1: `page.waitForLoadState` in der Entwicklungsumgebung läuft in Timeout. Kein Produkt-Buildfehler daraus abgeleitet, aber Gate nicht bestanden. `final-lab.log`. |
| PWA-/Passkey-Browserprogramme | Beide bestanden. Synthetische Browser-/WebAuthn-Prüfung; keine Änderung des freigegebenen E-Mail-/Passwort-Kundenlogins und kein Nachweis einer installierten iOS-PWA. |

## Verbleibende Browserbefunde

| Befund | Nachweis / Einordnung |
| --- | --- |
| RSC-Anfragen beim harten Seitenwechsel abgebrochen | `final-webkit-0.log`; unabhängiger Fetch-/Reload-Kontrollfall ohne Binso reproduziert Windows-WebKit-Abbrüche. Eine zusätzliche Wartephase beseitigt den App-Gatefehler nicht zuverlässig. Host-/Browseranteil belegt, echte Safari-Auswirkung offen. Keine CORS-Regel oder Fehlerfilter geändert. |
| Fokus nach Schliessen eines Aktionsmenüs | Produkt Dark und Operatorkonto beide Themes: Fokus kehrt im geprüften Pointerpfad nicht zum Auslöser zurück. Explizites Vorfokussieren lässt den Produktkontrollfall bestehen; zusätzliches Warten nicht. Reproduzierbarer offener Fokusbefund, keine pauschale Einstufung als Emulationsfehler. |
| Sehr kurze Kundenansicht | `independent-webkit-customers-light.log`: Header-/Aktionsleisten-Geometrie bei 320 × 420 nicht bestanden; Dark bestanden. Ursache nicht abschliessend qualifiziert, deshalb offen. |
| Chat Dark | `independent-webkit-chat-dark.log`: Anhang-/Senden-Bedienelemente erfüllen die Sichtbarkeitsprüfung nicht; Light bestanden. Offen. |
| Header beide Themes | `independent-webkit-header-light.log` / `-dark.log`: sichtbares Element bleibt beim Klick ausserhalb des Viewports. Offen, kein Timeout angehoben. |
| Dokumenteinstellungen beide Themes | `independent-webkit-settings-*.log`: erwarteter Fokus bei betrieblicher Bereitschaft wird nicht erreicht. Offen. |
| Doppelte Kundennamen Dark | `independent-webkit-data-dark.log`: Liste liefert in der geprüften Situation keine der erwarteten zwei Identitäten; Light bestanden. Kein Nachweis eines DB-Datenverlusts, UI-/Bereitschaftsursache noch offen. |
| Globale Oberfläche Dark | `independent-webkit-chrome-dark.log`: Fokus-/Rückkehrbedingung erreicht Timeout. Offen. |

Die ergänzenden WebKit-Gruppen Zeit, Mitarbeiter, Dokumente, Spesen und Abrechnung
bestanden jeweils in beiden Themes. Kein fehlgeschlagener Test wurde entfernt,
deaktiviert oder durch eine abgeschwächte Assertion ersetzt. Nicht abgeschlossene
oder abgebrochene Teilpfade zählen nicht als bestanden. Die offenen Befunde erfordern
gezielte Nacharbeit und anschliessende erneute Qualifikation vor einem Release.

## Integrität und lokale Übergabe

`final-integrity.json` bestätigt 1’164 unveränderte Quelldateien des finalen Snapshots,
342 unveränderte gebaute JS-/CSS-Dateien, 37 unveränderte gesicherte Fachdateien und
vier gegenüber dem Basiscommit unveränderte Budgetdateien. `git diff --check` ist
bestanden. HEAD bleibt `afaf2a91688a5714cf3c35df4050fdbbfcb481c2`; der geprüfte Stand ist
nicht eingecheckt. Quellfingerabdruck:
`4dbef7fe2df3a747495aca6f9ff290231b4f0d12440a0c061adbe800642bc12a`.
Die vollständige Liste lokaler Änderungen steht im Integritätsnachweis. Ein SHA des
Basiscommits allein identifiziert die uncommitteten Änderungen ausdrücklich nicht.

Tatsächliche Browserbilder im Nachweisordner: `final-chromium-0/light-profile-feedback-visible.png`
und `final-chromium-0/dark-product-unconfirmed.png`; vorheriger verdeckter Hinweis:
`settings-diagnostic/light-avatar-feedback-hidden.png`. Es wurden keine visuellen
Baseline-Freigaben oder fachlichen Abnahmestatus automatisch gesetzt.

## Auftrag und unveränderter Fachstand

Fortsetzung des nicht veröffentlichten Arbeitsstands auf afaf2a91688a5714cf3c35df4050fdbbfcb481c2.
Die [Abrechnungsfortsetzung](billing-completion-acceptance.md) bleibt fachliche Grundlage.
Keine neue Berechnungsengine, keine Änderung an bestätigten Budget-/Rechnungsformeln,
keine neue Migration und keine Änderung an Authentifizierung oder produktiven Rechten.
Alle 37 im bisherigen Manifest enthaltenen Anwendungs-, Datenbank- und Paketdateien
sowie die vier Budgetdateien sind gegenüber dem gesicherten Abrechnungsstand
bytegleich (preserved-work-product.json und preserved-financial-baseline.json).

Alle Nachweise dieses Folgeauftrags liegen im Workspace unter
../audit-20261028-v8-quality/ ausserhalb des Checkouts. Fehlgeschlagene Entwicklungs-
läufe werden dort mit ihrer eigenen Nummer erhalten; sie werden nicht als Pass gezählt.

## Nachgewiesene Ursachen und Korrekturen

| Bereich | Befund | Korrektur und gezielter Nachweis |
| --- | --- | --- |
| API-Inventar | Der native HTTP-Testvertrag fehlte für /api/absences/context und weitere später ergänzte GET-Routen. | 22 ergänzte GET-Verträge im bestehenden echten HTTP/PostgreSQL-Testprogramm; alle acht Rollen, erlaubte positive Daten, ausdrückliche sensible Fachrechte, fehlende Quellen und fremde Mandanten. Der gesamte Lauf api-targeted-6.log endet mit Exit 0; alle 105 inventarisierten GET-Routen sind klassifiziert. |
| Abwesenheitskontext | Eine blosse leere Antwort wäre keine ausreichende positive Gegenprobe. | Anstellungsperiode tatsächlich angelegt und über den Eigenzugriff gelesen; Teamzugriff ohne Fachrecht verweigert, mit getrennten HR-Leserechten erlaubt; fremder Mandant bleibt 404. Auch sensible Familien-/Lohn-Lesegrenzen werden wirklich ausgeführt. |
| Produkterstellung | Die korrekte Fehlermeldung lag im durch FormPage verborgenen Seitenhintergrund; kein fälschlicher Speichervorgang. | Zentraler Toast rendert schwebende Meldungen ausserhalb verborgener Layouts. Entwurf, Wiederholung und Erfolgsgrenze bleiben erhalten. Ursprünglicher Fehler in product-before.log, Gegenprobe im fertigen Browserbild product-unconfirmed und portal-after.log. |
| Verschachtelte Einstellungen | Auch eine korrekt erzeugte Profilbild-Erfolgsmeldung wurde durch die verborgene settings-workspace-Hülle verdeckt; DOM-Vorfahren belegen display:none. | Derselbe zentrale Toast-Fix, kein lokaler CSS-Patch. Inline-Meldungen bleiben an ihrem Feld; stabiles leeres Server-Snapshot für schwebende Meldungen. Tatsächliche Profil-/Firmenabläufe in Light und Dark bestanden (portal-after.log). |
| Profilbild-Fehlerprüfung | Der Test suchte bei aktivem Vorschau-Dialog nach einem Hintergrundstatus statt der vorhandenen Warnung im Dialog. | Test prüft die sichtbare role=alert-Meldung im aktiven Dialog und weiterhin das unveränderte bisherige Bild. Keine Scannerintegration oder Sicherheitsfreigabe geändert; Scannerantworten sind synthetische Testfälle. |
| WebKit-Tastatur | Minimaler HTML-Kontrollfall: Chromium tabbt zum nächsten Link; Windows-WebKit tabbt in Desktop- und iPhone-Emulation direkt zur Schaltfläche. Alt+Tab behebt das im beobachteten Kontext nicht. | Test ermittelt die native Einstellung unabhängig von der App, vergleicht anschliessend die App-Reihenfolge und prüft Fokussemantik aller Navigationsziele. Keine Navigation geändert, keine tabindex-Patches am Produkt. native-keyboard-versioned-results.json (Chromium 151.0.7922.34, WebKit 26.5, Windows) und keyboard-after.log; echte Safari-Geräte weiterhin offen. |
| Registrierung | Der bisher rote Gesamtlauf enthielt einen bereits korrigierten alten Dialog-Selektor. | registration-after.log und registration-after.json: der tatsächlich erneut ausgeführte Gesamtprozess endet mit Exit 0, einschliesslich Import, Zusammenführung, Systemzuständen und Berichten. |

Die Liste öffentlicher/tokengebundener GET-Einstiegspunkte des bestehenden Inventar-
Tests wurde nicht erweitert. Kein privater Endpunkt und keine vorhandene Prüfung
wurde ausgeschlossen. Die vollständige GET-Abdeckung bedeutet keine vollständige
Abdeckung aller möglichen POST/PATCH/DELETE-Übergänge oder externer Provider.

## Abschliessende Release-Prüfung

Die Prüffolge wurde nach Abschluss der gezielten Korrekturen gestartet.
Bereits abgeschlossen:

| Prüfung | Tatsächlicher Status | Nachweis im Evidenzordner |
| --- | --- | --- |
| Release-Regeln, Schema-Vertrag | Exit 0 | final-static-results.json |
| 94 Testprogramme nach Toast-/Inventarkorrektur, vor der reinen Finanz-Testwartebedingung | Exit 0 | final-test-confirmed.log und final-test-confirmed.exit.txt |
| Vollständiger Bestätigungslauf nach der Finanz-Testwartebedingung | alle 94 Programme, Exit 0 | final-test-readiness-confirmed.log und .exit.txt |
| Lint, CSS-Architektur, Typecheck, Produktionsbuild | jeweils Exit 0 | final-static-results.json und einzelne final-*.log |
| Produktions- und vollständiger Abhängigkeitsaudit | jeweils Exit 0 | final-security-scan.log, final-security-scan-all.log |
| Native PostgreSQL-Konkurrenz, Auth-Integrität, Registrierung, bestehende Passkey-Backendfälle | alle vier Exit 0 | final-native-results.json |
| Vollständiger authentifizierter HTTP-Vertrag | Exit 0, 105 GET-Einträge klassifiziert | final-api-tenant.log |
| Anonyme HTTP-Sicherheitsgrenzen | Exit 0, 219 private Routenmethoden abgewiesen | final-api-auth.log |
| Architektur-Selbsttest und Berichtsadversarien | Exit 0 im normalen Projektkontext | final-compliance-selftest-normal.log, final-compliance-report-normal.log |
| Browserkalender, Legacy-Prüfsummen, Browserplan, Workflow- und Artefaktverträge | jeweils Exit 0 | final-static-results.json |

Ein erster erweiterter Ausführungskontext scheiterte bei den Git-abhängigen
Testteilen an der unterschiedlichen Windows-Dateibesitzkennung. Der normale
Projektkontext behält die bestehenden Git-Vertrauenseinstellungen. Keine globale
Git-Konfiguration wurde geändert, keine Prüfung entfernt; fehlgeschlagene Rohläufe
bleiben erhalten. Der nachfolgende normale Lauf erreichte die letzte Prüfung und
meldete dort veraltete Komponentenreferenzen. Bei 26 weiterhin ungeprüften Seiten
wurden ausschliesslich die drei neuen Toast-Hilfsreferenzen ergänzt; Status und
Evidenz blieben unverändert. Die gezielte letzte Prüfung und der Integrationsvertrag
bestehen danach. Der anschliessende vollständige Bestätigungslauf aller 94
Testprogramme endet mit Exit 0. Die breite Browsermatrix bleibt bis zu ihrem
Abschluss getrennt als laufend zu behandeln.

Die quellgebundene Produktionsschranke bleibt rot: final-production-readiness.log
nennt elf fehlende Register-Nachweise für die abgefragte Commit-Identität (Scanner,
Netzwerk, vollständige Produktions-QA, Restore, Alarmzustellung, Aufbewahrung,
rechtliche Freigabe, physische Geräte, Identity-Ingress, Mailzustellung und Domain).
Ein früherer Restore-Nachweis für einen anderen Stand wird dadurch weder widerrufen
noch automatisch auf diesen uncommitteten Arbeitsstand übertragen.

Der Quell-Snapshot umfasst 1164 Dateien ausserhalb des Ordners docs/
und generierter .qa-Evidenz. Seine SHA-256-Prüfsumme lautet
1c8d67d9e8486dceda41cc3874b89dabf7bd59976c0bb262778ad889e9dd04fc.
Die 342 Browserdateien des endgültigen Builds stehen in final-browser-assets.json.
Abschliessende Übereinstimmung und Browserresultate werden nach Ende der Läufe
festgehalten; diese Zwischenfassung ist keine Releasefreigabe.

## Zusätzlicher offener WebKit-Blocker im vollständigen Lauf

Die erste vollständige mobile WebKit-Gruppe stoppt nach den gerenderten Seiten
im Navigations-/Persistenzblock. Beim harten Dokumentwechsel werden RSC-
Hintergrundabfragen abgebrochen und als ungefangene Fetch-/Zugriffskontrollfehler
an die strikte Laufzeitprüfung gemeldet. Die ursprüngliche Tab-Erwartung ist an
dieser Stelle bereits bestanden. **final-webkit-0 bleibt Exit 1.**

Nachweise und Abgrenzung:

- webkit-prefetch-control.log reproduziert den Fehler in einer engeren,
  unveränderten Navigationsprüfung; die Fehlermeldungen bleiben vollständig aktiv.
- Eine ausschliesslich ausserhalb des Repositorys erstellte Diagnosekopie wartet
  zusätzlich vor harten Dokumentwechseln auf Netzwerkruhe. Auch diese endet mit
  Exit 1 (webkit-prefetch-settled.log); ein blosses Warten ist kein qualifizierter Fix.
- native-fetch-reload-results.json verwendet nur minimales HTML und einen eigenen
  synthetischen Loopback-Server, keinen Binso-Code. Chromium 151.0.7922.34 meldet
  bei den kontrollierten Neuladungen null Fehler; Windows-WebKit 26.5 meldet in
  Desktop- und iPhone-Emulation jeweils fünf abgebrochene Anfragen/Load-Fehler.
  Das belegt ein abweichendes Verhalten des getesteten Ports beim Dokumentabbruch;
  es qualifiziert keine echte Safari-Installation und schliesst nicht alle
  app-/frameworkbezogenen Schnellwechselprobleme aus.
- Weder CORS-Regeln, App-Navigation, Vorladen noch die Fehlerprüfung werden dafür
  pauschal geändert oder abgeschaltet. Der fehlerhafte Originalblock bleibt
  Bestandteil der Abnahme. Der Anwendungscode bleibt unverändert; eine später belegte reine Finanz-Testbereitschaftskorrektur wird nachfolgend getrennt ausgewiesen.
- Die mobile responsive Matrix und die übrigen Funktionsgruppen wurden zusätzlich
  getrennt ausgeführt. Die Endergebnisse stehen oben; sie ersetzen keinen grünen Navigationsblock.

Die lokale Gesamtfreigabe bleibt wegen dieses Blocks offen; zusätzlich gelten
weiterhin die fehlenden physischen und betrieblichen Produktionsnachweise.

## Weitere Gegenproben: Finanz-Bereitschaft und Bildaufzeichnung

Die gebündelte zusätzliche WebKit-Funktionsprüfung stoppt zunächst bei der
Finanzübersicht (null statt vier Kennzahlen). Die unveränderte Einzelprüfung
reproduziert dies. Eine ausserhalb des Repositorys erstellte Diagnosekopie zeigt
vor dem Zählen noch den legitimen initialen Zustand „Binso One wird geladen“.
Nach ausdrücklichem Warten auf die sichtbare Finanzübersicht erscheinen alle vier
Kennzahlen, und sämtliche ursprünglichen Finanzprüfungen bestehen.

Der Repository-Test wartet deshalb jetzt ausdrücklich auf .bo-cash-overview,
bevor er weiterhin genau vier Kennzahlen und die unveränderten Werte prüft.
final-finance-readiness-webkit.log besteht in Light/Dark. Weder Berechnung noch
Finanzkomponente wurden geändert. Der vollständige 94er-Lauf endet nach dieser
letzten reinen Testkorrektur separat mit Exit 0 (final-test-readiness-confirmed.log).

Die Anwendung ist identisch zum fertigen Build mit 342 Browserdateien. Der frühere
Quell-Snapshot 1c8d67d9e8486dceda41cc3874b89dabf7bd59976c0bb262778ad889e9dd04fc
und der aktuelle Snapshot 4dbef7fe2df3a747495aca6f9ff290231b4f0d12440a0c061adbe800642bc12a
unterscheiden sich ausschliesslich durch diese eine Wartebedingung im Browsertest;
Details stehen in final-source-snapshot-v2.json. Frühere Browser-/HTTP-Läufe werden
nicht als neu ausgeführt umetikettiert.

Eine erste zusätzliche mobile WebKit-Matrix scheitert bei paralleler Browserlast
an der Stabilitätsprüfung für ein Navigations-Screenshot, nicht an einer belegten
Rechenabweichung (final-webkit-mobile-matrix.log). Nach Ende aller parallelen Jobs
bestand die identische Routenmatrix bei 320, 375 und 390 Pixeln separat und mit
unveränderten Prüfungen in beiden Themes: 198 Kombinationen, alle drei Exit 0.
Der erste Timeout bleibt erhalten und wird nicht als bestandener Lauf gewertet.

Die beiden ausschliesslich lokalen PostgreSQL-Testcluster wurden nach Ende der
zugehörigen Prüfungen sauber beendet (`final-native-stop.log`, `final-ui-stop.log`,
jeweils Exit 0). Bestehende lokale Nachweise und fremde Prozesse wurden erhalten.
`final-changed-files.json` enthält die Dateiprüfsummen aller lokalen Änderungen
einschliesslich der vorherigen Abrechnungsfortsetzung; `final-acceptance.json`
fasst Ergebnisse und den blockierten Release-Status maschinenlesbar zusammen.

## Zusätzlich beobachtete Fokuslücke im Produkt-Aktionsmenü

Die getrennte WebKit-Funktionsprüfung endet später mit „Sheet restores trigger
focus“: Nach Escape liegt der Fokus auf body statt auf dem sichtbaren Auslöser
„Produktaktionen“ (final-webkit-functional-rest.log). Dieser Fehler wird nicht
als bestandene Menüprüfung gewertet.

Eine externe Diagnosekopie behält die originale Fokusprüfung und wartet zusätzlich
drei Sekunden auf die Rückgabe. Auch danach bleibt body aktiv; das Dokument ist
sichtbar, der Auslöser vorhanden und nicht inert (webkit-product-focus-wait.log).
Die zweite Gegenprobe fokussiert denselben Auslöser vor der Öffnung ausdrücklich.
Dann ist die Fokusrückgabe korrekt und der gesamte unveränderte Produktablauf
besteht (webkit-product-focus-keyboard.log; Diagnose, kein Ersatz des roten Gates).

Im getesteten Windows-WebKit fehlt damit die verlässliche Rückgabe nach einer
Pointer-Auslösung ohne vorherigen Fokus. Der bestehende zentrale Owner
components/use-dialog-focus.ts merkt den aktiven Fokus/focusin; ActionsMenu öffnet
über RowActions. Eine verlässliche Erfassung des tatsächlichen öffnenden Elements
für beide Auslösungsarten ist vor einer entsprechenden Freigabe zentral zu
qualifizieren. Diese Fokussteuerung wurde hier nicht auf Verdacht umgebaut;
Finanz-/Budgetlogik ist davon unabhängig und unverändert. Echte Safari-Geräte
bleiben auch für diesen Befund offen.

## Weiterhin geltende fachliche Grenzen

Die vollständige Liste steht im Abrechnungsbericht. Insbesondere bleiben getrennt:

- Gleicher kanonischer Rechnungsempfänger und gleiche Währung; keine automatische
  Zusammenlegung unterschiedlicher Kundenstämme oder Währungsumrechnung.
- Ein Bereich/Kontext je Vereinbarung innerhalb einer Rechnung; unabhängige
  vereinbarte Gesamtrabatte bleiben je Bereich. Ein zusätzlicher pauschaler
  Rabatt über mehrere unabhängige Vereinbarungen wird abgewiesen.
- Historische Bruttogutschriften ohne verbindliche Steuerzuordnung erlauben keine
  neu erfundene Reststeuer-Verrechnung. Historisch negative Abschlussreste werden
  blockiert; positive Restcents benötigen ihre ursprüngliche Position/Steuergruppe.
- Rechnungsrundung auf CHF 0,01; kein neues Bargeld-Fünfrappen-Verfahren.
- Akonto-Auswahl höchstens 100 offene Quellen; keine unbeaufsichtigte Ausstellung
  und kein freies Vorauszahlungskonto ohne Vereinbarung.
- Gutschriften geben verbrauchte Leistungen nicht automatisch erneut frei.
  Ausgestellte stornierte Belege behalten ebenfalls ihren historischen
  Quellenverbrauch; die Freigabe einer Akonto-Anwendung ist davon getrennt.
- Feste Rabatte auf Teilmengen benötigen eine ausdrückliche Aufteilung. Es gibt
  keine automatische fachliche Interpretation freier Vertragstexte.
- Die bestehende Regel für Null-Rechnungen bleibt erhalten: Ausstellung als
  Schlussrechnung, kein neues allgemeines Null-Teilrechnungsverfahren.
- Die vollständige Mandanten-Lösch-CLI mit historisch befülltem Datenbestand
  bleibt separat unqualifiziert. Erfolgreiche isolierte Schema-/RLS-Löschtests
  ersetzen diese operative Abnahme nicht.
- Andere V8-Module bleiben gemäss bestehender Modul-/Rollenmatrix teilweise offen.
  Diese Fortsetzung qualifiziert weder sämtliche Schreib-/Statusvarianten aller
  APIs noch fachlich alle Module oder jede denkbare Nutzereingabe.

## Produktions- und Gerätenachweise

Windows-WebKit, mobile Viewports und PWA-Browsertests ersetzen keine tatsächlichen
Tests auf iPhone/iPad oder in einer installierten iOS-PWA. Eine vollständig manuelle
200%-Zoom-, Softwaretastatur- und Safe-Area-Abnahme ist hieraus nicht ableitbar.
Externe Mail-/Push-Zustellung, rechtliche Übersetzungsfreigabe, Domains und die
quellgebundenen betrieblichen Produktionsnachweise benötigen echte Belege.

Die Prüfung der Artefaktverträge ist von einem tatsächlich erzeugten und auf Linux
geprüften, unveränderlich gebundenen Produktionspaket zu unterscheiden. Ein solches
Paket, die reale Scanner-/Netzwerkqualifikation und eine GitHub-Release-Pipeline
wurden durch diesen lokalen Auftrag nicht veröffentlicht oder freigegeben.
Der Live-Scanner wird entsprechend der bestehenden Nutzerentscheidung nicht neu
aktiviert. Kein fehlender Providerbeleg wird durch eine synthetische Antwort ersetzt.

Kein GitHub-Push, Merge, Azure-Deployment, produktive Migration oder neuer
kostenpflichtiger Dienst ist Bestandteil dieses Folgeauftrags.
