# Binso One V8 – rote Qualitätsschranken, Fortsetzung vom 28.10.2026

Dieser Bericht dokumentiert den vorherigen Prüfstand. Die anschliessende
[RSC-Fortsetzung](quality-rsc-20261028.md) qualifiziert den damals verbliebenen
Lokalisierungsblocker mit neuen Ereignisspuren, Gegenprüfungen und tatsächlichen
Exit-Codes. Die alten Protokolle wurden nicht umgeschrieben.

## Verbindlicher Status: RELEASE BLOCKIERT

Die zentrale Fokussteuerung, Menüverankerung und nachgewiesene Testbereitschaftslücken
sind korrigiert. Ein vollständig grüner browserübergreifender Release-Nachweis liegt
weiterhin nicht vor. Die vollständige WebKit-Lokalisierung bleibt rot.
Die globale WebKit-Gruppe besteht im abschliessenden getrennten Light- und Dark-Lauf.
Frühere Fehler wurden nicht gefiltert oder zu bestandenen Ergebnissen umgedeutet.

HEAD bleibt `afaf2a91688a5714cf3c35df4050fdbbfcb481c2`; der gesamte Stand ist lokal und nicht eingecheckt.
Quellfingerabdruck des finalen Stands: `cdcfba3a422ae4d47f3c669c2729654acd94ef44c140d2ea8d1ce381bf9947de`.
1165 Quelldateien sind einzeln gehasht. [frozen-source.json](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/frozen-source.json>)
und [final-integrity.json](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/final-integrity.json>) binden die Nachweise an den Arbeitsstand.
Der Basiscommit allein identifiziert die uncommitteten Änderungen ausdrücklich nicht.
Zusätzlich bestätigt die Integritätsprüfung 347 unveränderte finale
Browserdateien, 37 unveränderte gesicherte Fachdateien und
4 unveränderte Budgetdateien. Die nach dem finalen Build noch
geänderten Testadapter/Bereitschaftsprüfungen ändern keine Produktions-Buildinputs;
[final-build-source-binding.json](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/final-build-source-binding.json>) dokumentiert diese getrennte Bindung.

## Ursachen und Rot-Grün-Nachweise

| Bereich | Nachgewiesene Ursache / Korrektur | Tatsächlicher Nachweis |
| --- | --- | --- |
| Pointer-/Tastaturfokus | WebKit fokussiert einen angeklickten Button nicht zwingend. Der gemeinsame Dialog-Owner erfasst deshalb die tatsächliche Aktivierung unabhängig von activeElement. RowActions fokussiert den auslösenden Button. | [focus-before.log](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/focus-before.log>): Exit 1; [focus-after.json](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/focus-after.json>): Exit 0. Produkt-Gegenprüfungen verlangen den identischen DOM-Auslöser für Pointer und Tastatur, Escape und X. |
| Ersetzte Aktionsmenüs | Ein ausgewählter Menübutton kann beim Öffnen des Editors verschwinden. Die zentrale Herkunftskette führt dann zum ursprünglichen noch sichtbaren Auslöser zurück; eine neue aktive Dialogoberfläche darf dabei keinen Fokus verlieren. | [dialog-focus-targeted.log](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/dialog-focus-targeted.log>) und [field-focus-after.log](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/field-focus-after.log>): tatsächlicher transpiliert ausgeführter Hook; Escape/X/Auswahl, verschwundener Menübutton und kein Fokusdiebstahl beim Ersatzdialog bestanden. Kunden-, Produkt- und Operatorgruppen bestanden. |
| Header-/Werkzeugmenüs | Die Verankerung nutzte ein altes fokussiertes Element. Der echte WebKit-Fehler lag bei y=1215 ausserhalb eines 740-Pixel-Viewports. HeaderPanel nutzt jetzt denselben tatsächlichen Auslöser wie die Fokusrückgabe. | [header-diagnostic-2.log](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/header-diagnostic-2.log>): Exit 1; [header-ready.json](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/header-ready.json>): Exit 0 in Light/Dark. Mindestgrössen, Negativkontrollen, Suche, Kontomenü, Tastatur und Erstellen bleiben geprüft. |
| Später Feld-Fokus | Der einmalige Fokusversuch konnte vor dem Portal-Commit oder vor Freigabe eines inerten Vorfahren stattfinden. Der anfängliche FormPage-Fokus erfolgt im Layout-Commit; useSetupField reagiert zusätzlich auf tatsächliches Einfügen/Freigeben. Der Observer endet nach dem ersten Erfolg. Kein Timer-Polling, keine spätere Übersteuerung von Eingaben. | Alter unveränderter Hook im Gegenversuch [field-focus-before.log](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/field-focus-before.log>): Exit 1; identische Assertions gegen den korrigierten Hook [field-focus-after.log](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/field-focus-after.log>): Exit 0. Browser auf finalem Build: settings-ready-webkit: Exit 0; final-settings-chromium: Exit 0. |
| Kurze Kundenansicht | Die Messung erfolgte teilweise vor Verarbeitung der Viewport-Verkleinerung (alte Höhe 818 statt 318 Pixel). Der vorhandene Layout-Abgleich wird vor der Messung abgewartet. | [customers-geometry-diagnostic.log](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/customers-geometry-diagnostic.log>): Exit 1; [customers-resize-diagnostic.log](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/customers-resize-diagnostic.log>): Exit 0, Header oben 0, Footer unten 359 bei Höhe 400. Betroffene Kundengruppe Light/Dark: Exit 0. Dieselben Grenzwerte, keine CSS-Sonderregel. |
| Chat Dark | Die Zählung konnte vor dem sichtbaren Composer erfolgen. Die Prüfung wartet jetzt auf diesen vorhandenen Owner und kontrolliert danach unverändert die echten Ziele und 44-Pixel-Mindestgrössen. | [chat-after.json](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/chat-after.json>): Exit 0 in Light/Dark, einschliesslich weiterhin abgelehnter 40-Pixel-Negativkontrolle, Mehrzeiligkeit, Viewport und fehlgeschlagenem Senden. |
| Kundenauswahl / fertige Szenarien | Vor Sichtbarkeit des fertigen Pickers ergab evaluateAll eine leere Liste. Die Prüfung wartet auf den echten Picker. Der gemeinsame Szenario-Wechsel wartet zusätzlich auf Abschluss des sichtbaren Start-/Inhaltsladens; absichtlich gehaltene Ladefälle navigieren weiterhin über ihren eigenen Prüfpfad. | [data-after.json](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/data-after.json>): Exit 0 in beiden Themes; weiterhin genau zwei verschiedene Kunden-IDs, ein Platzhalter und acht aktualisierte Ansichten ohne Doppelzahlung. [settings-ready-webkit.json](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/settings-ready-webkit.json>): Exit 0, einschliesslich tatsächlicher Benachrichtigungsschalter nach Ende des Ladens. |
| Sprachpräferenz | Der HTML-Sprachcode wird vor dem React-Commit der bestätigten Auswahl aktualisiert. Die Assertion wartet zusätzlich auf das Ende derselben Busy-Transaktion. Fehler-, Sperr-, Persistenz- und Rollenprüfungen bleiben erhalten. | [language-diagnostic.json](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/language-diagnostic.json>): Exit 0; der vollständige WebKit-Lauf kommt über den alten Auswahlfehler hinaus, endet später wegen ungefilterter RSC-Fehler mit Exit 1. Keine vollständige Lokalisierungsfreigabe. |
| Komponentenlabor | Ein Entwicklungsserver besitzt eine dauerhafte HMR-Verbindung. Das vorhandene Hydrations-/Font-Gate ersetzt an der bisher noch falschen Stelle die globale Netzwerkruhe. Laufzeit-/Hydrationsfehler bleiben fatal. | Finale Laborläufe: final-lab-chromium: Exit 0; final-lab-webkit: Exit 0. Details [post-final-results.json](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/post-final-results.json>). |

## Registrierung, Import, Zusammenführung und Downloads

[registration-exclusive.json](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/registration-exclusive.json>): Exit 0, vollständig:
33 Registrierungs-/Angebots-Kernfälle sowie Kundenimport, Kundenzusammenführung,
zwölf Wiederherstellungs-/vier Rechtsnavigationsfälle und die vollständige Berichtsgruppe.
CSV-/PDF-Downloadereignisse, Dateiname und identische PDF-Bytes wurden tatsächlich geprüft.
Die Testfälle versenden keine echten E-Mails und ersetzen keine produktive Zustellabnahme.

Der erste Wiederholungslauf [registration-after.json](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/registration-after.json>) blieb wegen einer
Kollision zweier eigener lokaler Testserver bei Systemzuständen rot. Kernprogramm,
Import, Merge und Berichte bestanden bereits dort. Der exklusive Gegenlauf schliesst
alle ursprünglichen Teilprogramme ein; keine Route oder Assertion wurde ausgelassen.

Der unabhängige HTML-/Blob-Downloadtest ohne Binso-Anwendungscode funktioniert in
Chromium und Windows-WebKit bei 390/1440 Pixeln mit echten Downloadereignissen und
identischen Bytes: [download-control-results.json](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/download-control-results.json>). Der frühere Berichtsexport-
Timeout wird deshalb ausdrücklich nicht als generelle Windows-WebKit-Downloadgrenze erklärt.

## Vollständige Pflichtprüfungen und unveränderter Fachstand

| Prüfung | Endstatus / Qualifikation |
| --- | --- |
| release:check | Exit 0; [final-static-results.json](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/final-static-results.json>) |
| db:contract | Exit 0; [final-static-results.json](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/final-static-results.json>) |
| test | Exit 0; ursprünglicher Sammellauf 1, gültiger Gegenlauf [final-test-qualified.log](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/final-test-qualified.log>) |
| lint | Exit 0; ursprünglicher Sammellauf 0, gültiger Gegenlauf [final-lint-qualified.log](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/final-lint-qualified.log>) |
| css:check | Exit 0; [final-static-results.json](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/final-static-results.json>) |
| typecheck | Exit 0; ursprünglicher Sammellauf 0, gültiger Gegenlauf [final-typecheck-qualified.log](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/final-typecheck-qualified.log>) |
| security:scan | Exit 0; ursprünglicher Sammellauf 1, gültiger Gegenlauf [security-scan-connected.log](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/security-scan-connected.log>) |
| security:scan:all | Exit 0; ursprünglicher Sammellauf 1, gültiger Gegenlauf [security-scan-all-connected.log](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/security-scan-all-connected.log>) |
| build | Exit 0; [final-static-results.json](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/final-static-results.json>) |
| legacy-checksum-attestation-test | Exit 0; [final-static-results.json](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/final-static-results.json>) |
| browser-calendar-test | Exit 0; [final-static-results.json](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/final-static-results.json>) |
| compliance/selftest | Exit 0; [final-static-results.json](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/final-static-results.json>) |
| compliance/report-test | Exit 0; [final-static-results.json](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/final-static-results.json>) |
| quality-browser-plan-test | Exit 0; [final-static-results.json](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/final-static-results.json>) |
| workflow-safety-test | Exit 0; [final-static-results.json](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/final-static-results.json>) |
| release-artifact-test | Exit 0; [final-static-results.json](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/final-static-results.json>) |
| Native PostgreSQL: postgres-parallel-test | Exit 0; [final-native-postgres-parallel-test.log](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/final-native-postgres-parallel-test.log>) |
| Native PostgreSQL: auth-integrity-test | Exit 0; [final-native-auth-integrity-test.log](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/final-native-auth-integrity-test.log>) |
| Native PostgreSQL: registration-test | Exit 0; [final-native-registration-test.log](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/final-native-registration-test.log>) |
| Native PostgreSQL: passkey-test | Exit 0; [final-native-passkey-test.log](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/final-native-passkey-test.log>) |

Das unveränderte Paketkommando enthält weiterhin 94 Pflichtprogramme. Der erste
Gesamttest brach am fehlenden Layout-Hook des SSR-Testadapters ab (ReferenceError),
nicht an einem fehlgeschlagenen Finanzresultat. Ein weiterer Lauf erreichte den
Dialog-Adapter, dessen DOM-Modell die neu verwendete Grundklasse Element noch nicht
als Global bereitstellte. Beide Adapter sind ergänzt; ihre Assertions bleiben erhalten.
[app-workspace-targeted.log](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/app-workspace-targeted.log>), [dialog-trigger-targeted.log](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/dialog-trigger-targeted.log>) und
[targeted-ui-programs-results.json](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/targeted-ui-programs-results.json>) dokumentieren die gezielten Gegenprüfungen.
Der vollständige abschliessende 94er-Lauf steht in [final-test-qualified.log](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/final-test-qualified.log>);
[qualified-source-before.log](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/qualified-source-before.log>) / [qualified-source-after.log](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/qualified-source-after.log>) prüfen
die bytegleiche vollständige Quellbindung vor und nach diesem Abschlusslauf.
Keine Tests wurden deaktiviert und keine Sicherheits-/Geschäftsassertions abgeschwächt.

Die ursprünglichen Sicherheitsabfragen endeten wegen Netzwerk-EACCES mit Exit 1;
die mit tatsächlichem Zugriff ausgeführten Gegenläufe stehen separat in
[security-connected-results.json](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/security-connected-results.json>). Kein ursprünglicher Rückgabewert wurde
überschrieben. Der erste Testumgebungsstart nutzte den falschen lokalen Port und
zählte nicht als PostgreSQL-Fachprüfung; nach korrigiertem Start bestanden alle vier
vollständigen nativen Programme. Ausschliesslich identifizierte lokale Testcluster.

Die vorhandene Berechnungsengine, Budgetdateien, Migrationen, API-/DB-Beziehungen,
Authentifizierung, Navigation und sämtliche anderen nicht aufgeführten Quelldateien
blieben gegenüber dem gesicherten Ausgangsstand bytegleich. Der vollständige 94er-Lauf
und die neuen nativen Fach-/Konkurrenzprüfungen behalten ihre bisherigen Finanzfälle.
Der frühere authentifizierte HTTP-Nachweis für 105 GET-Routen und die anonyme Prüfung
von 219 privaten Methoden bleiben datierte, unveränderte Nachweise des vorherigen
Auftrags; diese HTTP-Programme wurden durch diesen Folgeauftrag nicht ersetzt oder
als neu ausgeführt ausgegeben.

## Browserabdeckung und verbleibende Blocker

[affected-chromium.json](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/affected-chromium.json>): Exit 0, alle 14 Funktionsgruppen
in Light/Dark. Dieser breite Lauf liegt vor der letzten isolierten Feld-Recovery-
Erweiterung. Die anschliessenden Einstellungsgruppen prüfen deren betroffene
Oberflächen auf dem finalen Build in beiden Browsern; die übrigen UI-Owner sind identisch.
Die frühere vollständige Routenmatrix bleibt historische Abdeckung und wird nicht
als neue Vollmatrix auf dem jetzigen Arbeitsstand ausgegeben.

Historische gezielte Zwischenläufe (Originalwerte unverändert):

- affected-webkit-customers: Exit 0.
- affected-webkit-settings: Exit 1.
- affected-webkit-settings-dark-independent: Exit 1.
- affected-webkit-products: Exit 0.
- affected-webkit-operator: Exit 0.
- affected-webkit-chrome: Exit 1.
- affected-webkit-chrome-dark-independent: Exit 1.

Abschliessende globale WebKit-Gruppe mit finaler Szenario-Bereitschaft:

- final-chrome-webkit-light: Exit 0; [final-chrome-webkit-light.log](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/final-chrome-webkit-light.log>).
- final-chrome-webkit-dark: Exit 0; [final-chrome-webkit-dark.log](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/final-chrome-webkit-dark.log>).

- final-settings-webkit: Exit 1; [final-settings-webkit.log](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/final-settings-webkit.log>).
- final-settings-chromium: Exit 0; [final-settings-chromium.log](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/final-settings-chromium.log>).
- final-lab-chromium: Exit 0; [final-lab-chromium.log](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/final-lab-chromium.log>).
- final-lab-webkit: Exit 0; [final-lab-webkit.log](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/final-lab-webkit.log>).

- settings-ready-webkit: Exit 0; [settings-ready-webkit.log](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/settings-ready-webkit.log>).

Der ältere finale WebKit-Einstellungsversuch blieb nach bereits bestandenem IBAN-
Recovery an einer zu frühen Benachrichtigungs-Zählung rot. Die anschliessende gemeinsame
Szenario-Bereitschaftskorrektur betrifft ausschliesslich den Browsertest; der
Produktionsbuild ist derselbe. Die vollständige Gruppe besteht danach in Light/Dark.
Der ursprüngliche Exit 1 bleibt separat erhalten.

Verbleibende Blocker und offene Einschränkungen:

1. [localization-after.log](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/localization-after.log>), Exit 1: Die WebKit-Gesamtprüfung
   scheitert später an streng erfassten RSC-Abbrüchen. Fünf Sprachen bei 390/768 Pixeln
   und die folgenden 1440-Pixel-Fälle wurden bis zum Abbruch tatsächlich ausgeführt;
   die noch nicht erreichten Restfälle zählen nicht als bestanden.
2. Die älteren globalen Läufe [affected-webkit-chrome.log](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/affected-webkit-chrome.log>) und
   [affected-webkit-chrome-dark-independent.log](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/affected-webkit-chrome-dark-independent.log>) scheiterten beim frühen
   Navigationszustand beziehungsweise beim Klick auf Darstellung. Sie wurden nicht
   abschliessend als reine Portfehler qualifiziert und bleiben im Protokoll erhalten.
   Die abschliessende vollständige Gruppe besteht mit finaler Bereitschaftslogik in beiden Themes (je Exit 0); Navigation und ihre Assertions wurden dabei nicht umgebaut. Frühere Instabilität ist kein Beleg für eine physische Safari-Abnahme.
3. Die erneut ausgeführten unabhängigen Fetch-/Reload-Kontrollen
   [native-fetch-reload-results.json](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/native-fetch-reload-results.json>) reproduzieren je fünf Abbruchmeldungen
   ohne Binso-Code in Windows-WebKit (Desktop und iPhone-Emulation); Chromium meldet
   dort keine. Browser-Versionen: Chromium 151.0.7922.34, Windows-WebKit 26.5.
   Das ist ein belegter Portanteil, aber kein Beweis für die Fehlerfreiheit jedes
   Binso-Pfads. Es wurde kein zusätzlicher globaler Browserfehlerfilter eingeführt.
4. Physische Safari-/iPhone-/iPad- und installierte iOS-PWA-Prüfungen sind weiterhin
   offen. Headless Windows-WebKit, simulierte Tastatur-/Viewportänderungen und native
   HTML-Kontrollen sind keine Geräteabnahme. Auch die weiterhin fehlenden quellgebundenen
   betrieblichen Produktionsnachweise des vorherigen Berichts werden nicht als erledigt erklärt.

Die abschliessenden Laborpakete sind bestanden.
Ein erfolgreicher gezielter Test ersetzt keinen fehlgeschlagenen Gesamtlauf.

## Fachlicher V8-Abnahmestand

Die im [Abnahmebericht der Abrechnungsfortsetzung](billing-completion-acceptance.md)
dokumentierten Scope-, Währungs-, Quellen-/Restbetrags-, Rabatt-/MwSt.-Grenzen und
noch freigabebedürftigen Produktionsmigrationen gelten unverändert. Dieser Folgeauftrag
erweitert keine Preislogik und erklärt keine früher offene fachliche Anforderung als
erledigt. Der [vorherige Qualitätsbericht](quality-gates-20261028.md) bleibt datierter
Nachweis; sein damaliger Browserstatus wird durch die hier verlinkten neuen Läufe
präzisiert, nicht durch Umschreiben alter Logs.

## Änderungen, Nachweise und Übergabe

Nur folgende Quelldateien wurden in diesem Folgeauftrag geändert oder ergänzt:

- `components/binso-ux.tsx`
- `components/header-panel.tsx`
- `components/use-dialog-focus.ts`
- `components/use-setup-field.ts`
- `scripts/app-workspace-test.mjs`
- `scripts/dialog-focus-test.mjs`
- `scripts/dialog-trigger-test.mjs`
- `scripts/language-preference-browser.mjs`
- `scripts/shared-control-browser.mjs`
- `scripts/ui-foundation-test.mjs`
- `scripts/ux-browser-test.mjs`

Die statischen Komponenten-Zuordnungen wurden für 66 Seiten auf die neuen zentralen
Fokusreferenzen aktualisiert. Abnahmestatus und Belege blieben unverändert;
[dialog-invoker-assignment-sync.json](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/dialog-invoker-assignment-sync.json>). Die Integrationsinventare wurden
aus den tatsächlichen Quellen neu erzeugt. Ein statischer Eintrag ist keine visuelle Abnahme.

Tatsächliche Browsernachweise: [Desktop-Header](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/header-ready/light-1440-header-search.png>),
[kurze Kundenansicht](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/customers-resize-diagnostic/light-320-400-customer-sheet.png>),
[IBAN-Fokus im finalen Build](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/settings-ready-webkit/light-390-readiness-bank-field-focus.png>).
Vollständige Logs, Einzel-SHA256 und Originalfehler liegen im lokalen Nachweisordner.
[final-changed-files.json](<C:/Users/ÖmerCamBINSO/Documents/ChatGPT/Binso One/audit-20261028-v8-red-gates/final-changed-files.json>) umfasst zusätzlich die schon vorher vorhandenen
uncommitteten Änderungen; diese Liste ist ausdrücklich keine Liste neu geschriebener Fachlogik.

Kein GitHub-Push, Merge, Azure-Deployment, produktive Migration, neue kostenpflichtige
Dienstleistung oder Änderung der freigegebenen Kundenanmeldung wurde ausgeführt.
Die lokalen Testcluster wurden nach Abschluss sauber beendet; Exit-Codes der
Stopprogramme stehen im Nachweisordner. Release-Freigabe bleibt BLOCKIERT.
