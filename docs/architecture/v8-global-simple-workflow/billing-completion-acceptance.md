# V8 – Abnahme der Abrechnungsfortsetzung, 28. Oktober 2026

Aktueller Folgeabschluss: [RSC-Prüfung und tatsächlicher Release-Status](quality-rsc-20261028.md).
Die [Fokus-/Browserfortsetzung](quality-red-gates-20261028.md) bleibt datierter Nachweis.
Der [vorherige Qualitätsbericht](quality-gates-20261028.md) bleibt als datierter Nachweis erhalten.
Die unten beschriebenen Fachänderungen und Berechnungen bleiben unverändert.
HTTP-Inventar, sichtbare Formularrückmeldungen und veraltete Testannahmen wurden
anschliessend qualifiziert. Code-/Build-/native DB-/HTTP-Prüfungen sind bestanden.
Die anschliessende Fokus-/Browser-Fortsetzung qualifiziert die korrigierten Gates
genauer. Die nachfolgende RSC-Fortsetzung schliesst den technischen Lokalisierungsblocker;
echte Geräte-/Produktionsnachweise und die gesonderte Freigabe bleiben weiterhin offen.
Frühere rote Nachweise werden durch diesen Verweis weder gelöscht noch als grün erklärt.

## Gegenstand und Stand

Lokale Fortsetzung auf `afaf2a91688a5714cf3c35df4050fdbbfcb481c2`, Branch
`feat/v8-global-simple-workflow-20261027`. Dieser Bericht ergänzt die bestehende
V8-Matrix; er erklärt andere V8-Module nicht nachträglich für abgenommen.
Der aktuelle Arbeitsstand ist noch nicht committet oder veröffentlicht.

Die vier Budgetdateien aus dem gesicherten Stand bleiben unverändert.
`calculateDocument` behält seine bisherigen Preis-, Rabatt-, Steuer- und
Rundungsformeln. Die bereits freigegebene Eingabegrenze für ausdrücklich
vereinbarte Zeiteinheiten beträgt 1–1440 Minuten. Originalzeiten werden nicht
umgeschrieben. Zusammensetzung, Akonto-Aufteilung und kumulative Centkorrekturen
liegen im vorhandenen zentralen Geld-Owner `lib/money.ts` und verwenden dessen
Berechnung und Centverteilung. Frontend, Vorschau und PDF führen keine zweite
Preisberechnung ein.

## Ist–Soll und konkrete Nachweise

| Anforderung | Umsetzung | Gezielter Nachweis |
| --- | --- | --- |
| Mehrere Aufträge desselben Empfängers | Rechnung mit getrennten Vereinbarungsbereichen; jede Position gehört genau einem Bereich. Gemeinsamer Kunde und gemeinsame Währung werden serverseitig und in der Datenbank geprüft. | Zwei Aufträge 100 CHF zu 8,1 % und 200 CHF zu 2,6 % ergeben 313,30 CHF; Ausstellung und erneute Übernahme über alte und neue APIs geprüft. |
| Unterschiedliche Preisvereinbarungen | Originalpreise, Preisbasis, Quellenposition, Positionsrabatt, vereinbarter Gesamtrabatt und Steuerbehandlung je Bereich; keine Neuinterpretation von Vertragstexten. | Tatsächliche Angebots-/Auftrags-/Rechnungs-APIs mit prozentualen und festen Positions- und Gesamtrabatten; gemischte Steuersätze. |
| Variable Anzahlungen | Ausgestellte variable Akontos können ausdrücklich in mehreren Teil-/Schlussrechnungen angerechnet werden. Herkunftsnummer, Vereinbarung, Brutto-, Netto- und Steueranteile bleiben gespeichert. | Zwei Akontos und mehrere unterschiedlich grosse Anwendungen; Netto-/MwSt.-Summen und gesamte Forderung exakt geprüft. Vorschau reserviert keine Beträge. |
| Keine Doppelanrechnung | Eindeutiger Schlüssel, Quellenzeilensperre, verbleibende Gesamt- und Steuerkapazität, transaktionale Speicherung mit bestehendem Audit. | Zwei bestehende Entwürfe an derselben PostgreSQL-Quellensperre beobachtet: nur eine Anwendung von 80 aus 100 zulässig. Getrennte physische Verbindungen, keine Serialisierung durch Rechnungserstellung. |
| Storno und Nachvollziehbarkeit | Benutztes Akonto nicht isoliert stornierbar. Storno einer unbezahlten Zielrechnung gibt ihre Anwendung mit Zeitpunkt/Benutzer frei; ursprünglicher Snapshot bleibt erhalten. Wiederbelebung einer stornierten Anwendung gesperrt. | Auditfehler rollt Status und Freigabe zurück; danach 80 historisch aufgehoben und 100 neu angewendet, insgesamt 180 Historie und genau 100 aktiv. |
| Bereits gutgeschriebenes Akonto | Solange alte Gutschriften keine verbindlichen Steuergruppen besitzen, wird die Quelle für neue Anwendungen ausgeschlossen; keine geratene Reststeuer. Bereits gespeicherte Fakten bleiben unverändert. | Eigene Gegenprobe: verfügbare Quelle mit 8,1 %/2,6 %, Bruttogutschrift, Ausschluss aus der Auswahl, abgewiesene Anwendung sowie ausdrückliche direkte SQL-Sperre. |
| Unterschiedliche Rabatte/MwSt. | Bestehende Engine je Vereinbarung; feste Teilrabatte ausdrücklich aufteilen und gegen den Ursprung begrenzen. Neuordnung der Positionen verschiebt keine vereinbarten Rabatt-Restcents. | Reine Geldtests plus tatsächliche APIs, geschützte Preis-/Steuer-/Mengengrenzen, Rabattquellen und ausgeführter PDF-Renderer. |
| Teil-/Schlussrundung | Kumulativ berechnete Teilmengen und Schlussrest aus vereinbartem Snapshot abzüglich tatsächlich fakturierter Centwerte. Begrenzte Korrektur separat ausgewiesen. | Menge 0,33/0,33/0,34 bei 100,01 CHF und 8,1 %: zukünftige Folge 35,67 + 35,69 + 36,75 = 108,11 CHF. Historische zweimal 35,67 bleiben unverändert; Schlussrest 36,77. |
| Kombination aller Verfahren | Die Rundungsfortschreibung verwendet die ursprünglichen Leistungs-/Steuerfakten der Teilrechnung und nicht den bereits um Akonto verminderten Zahlbetrag. | Nativ vollständig ausgestellt: Angebot 100,01/8,1 %, Akonto 43,24, zwei Anrechnungen à 21,62; tatsächliche Forderungen 43,24 + 14,05 + 14,07 + 36,75 = exakt 108,11 CHF. |
| Historische Restgruppen | Eine mengenmässig abgeschlossene Originalposition darf bei verbleibenden Netto-/Steuercents nicht aus dem Abschluss verschwinden. | Rot-/Grün-Gegenprobe mit zwei MwSt.-Sätzen sowie nur steuerlichem Rest nach 100 alten Teilmengen; ohne Originalposition abgewiesen, mit ursprünglichem Preis und Menge null exakt ausgeglichen. |
| PDF/Vorschau/Editor | Live-Gesamtbetrag über vorhandene schreibfreie Vorschau; keine Mutationsmeldung. PDF zeigt tatsächliche Restforderung, Steuergruppen, Akonto-Nummer und unveränderte vereinbarte Texte. | Erzeugtes PDF mit zwei Vereinbarungen, 54,05 Akonto und Restforderung 259,25 CHF; PDF-Textprüfung. Browserabläufe separat dokumentiert. |
| Zeitübernahme | Bestehende Reservierung bleibt erhalten, auch bei mehreren Vereinbarungen. | Native parallele HTTP-Transaktionen: genau eine erfolgreiche Übernahme derselben Zeitquelle. Bestehende Minuten-/Preisquellentests bleiben aktiv. |

## Datenbank, APIs und Rechte

- Unveröffentlichte additive Migrationen `0111`, `0112`, `0113`; keine Änderung
  historischer Migrationen und keine produktive Ausführung. Schema-Vertrag:
  131 Tabellen, 114 Migrationen.
- Neue Tabellen `invoice_billing_scopes` und `invoice_advance_allocations` mit
  zusammengesetzten Mandanten-Fremdschlüsseln und erzwungener RLS. Scope-Ansichten
  arbeiten mit `security_invoker`. Die vorhandenen Kapazitätsprüfungen erfassen
  sowohl alte Einzelvereinbarungen als auch Sammelrechnungen.
- Bestehende Dokument-POST/PATCH-/Vorschauverträge additiv um Vereinbarungsbereiche,
  explizite Vereinbarung und Akonto-Anwendungen ergänzt. Neue mandantengebundene
  Leseendpunkte für verfügbare Akontos und zulässige Vereinbarungsquellen.
- Schreiben bleibt auf vorhandene Rechnungsrollen und aktive, schreibberechtigte
  Mandanten begrenzt. Read-only, fremde Kunden/Quellen, ungeeignete Status,
  falsche Währung, veränderte Konditionen und doppelte Leistungen werden abgewiesen.
- Akonto darf nicht vor seinem Rechnungsdatum angerechnet werden. Gebuchte
  Zahlungen werden nicht erfunden oder übertragen. Bereits angerechnete Beträge
  können nicht zusätzlich gutgeschrieben werden.
- Einmalige additive Runtime-Grants für bestehende Installationen sind als
  kontrollierte Operation vorbereitet; sie wurden nicht produktiv ausgeführt.

## Führende geänderte Dateien

| Bereich | Dateien/Owner |
| --- | --- |
| Gemeinsame Regeln | `lib/money.ts`, `lib/financial-status.ts`, `lib/commercial-contract.ts`, `lib/document-lines.ts` |
| Bearbeitung/Übernahme | `components/documents.tsx`, `components/commercial-contracts.tsx`, `components/time-price-source.tsx`, `components/supplier-invoices.tsx` |
| Daten-/Prozessintegration | `lib/server/billing-agreements.ts`, `lib/server/repositories/business-api.ts`, `commercial-contracts.ts`, `project-workspace.ts`, `time-price-sources.ts`, `supplier-invoice-matches.ts`, `lib/server/document-process.ts` |
| Dokumente/HTTP | Bestehende Dokument-Erstellungs-/Detail-/Vorschaurouten, Zeit-Abrechnung, neue `documents/advances` und `documents/billing-agreements/[id]`, `lib/server/document-pdf.ts` |
| Datenbank | Migrationen 0111–0113, `database/schema-contract.json`, Runtime-Provisionierung und additive Grant-Operation |
| Zentrale UI/Client | Standardwerte in `app/design-system/overlays.css`; optionales Abbruchsignal im vorhandenen schreibfreien `apiReadPost` |
| Sprachen | Kanonischer Katalog `lib/locales/messages.json` und vier daraus erzeugte Kataloge |
| Qualität/Dokumentation | Neue gemeinsame Geld-/Einheiten-/Browserfälle; bestehende native Integrations-, Darstellungs-, Client- und UX-Testadapter; Daten-/Integrationsinventar, vier nicht abgenommene Komponenten-Zuordnungen und V8-Statusberichte |

Die vollständige Datei- und Hashliste des geprüften Arbeitsstands wird in
`completion-worktree-manifest.json` neben den Prüflogs geführt. Budgetdateien,
Lockfile, Tarife, Kundenanmeldung, Navigation und historischer Belegbestand sind
kein verändertes Fachverhalten dieses Pakets.

## Prüfprotokoll

Alle neuen Geschäftsdaten sind synthetisch. PostgreSQL 18.6 läuft nur auf
`127.0.0.1:55482`; die abschliessende native Fachprüfung nutzt unabhängig von den
laufenden Browserdaten `127.0.0.1:55483` in einem zweiten eigenen Cluster. Keine Azure-
Ressource, keine externe E-Mail-/Zahlungszustellung und keine neuen Kosten.

Evidenz liegt ausserhalb des Checkouts unter `../audit-20261028-v8/`:

- `completion-money-dev.log`: zentrale Geld-, Rabatt-, Steuer-, Restcent- und
  Quellenreihenfolgefälle.
- `completion-native-parallel.log`: Migrationen und bestehende echte
  PostgreSQL-Konkurrenzprüfungen.
- `completion-native-registration.log`: tatsächliche APIs/RLS, sechs Modelle,
  neue Sammel-/Akonto-/Stornofälle und beobachtete Konkurrenz an derselben Quelle.
- `completion-presentation-dev.log`, `completion-issued-fixture.pdf`: tatsächlich
  erzeugtes Dokument, Quellenreferenz, Restforderung, Konditionen und Steuersätze.
- `completion-browser-smoke.log`: gezielte Browserbedienung während Umsetzung.
- `completion-final-test-confirmed.log`: alle 94 Pflicht-Testprogramme auf dem
  abschliessenden Anwendungscode, einschliesslich der Sperre gutgeschriebener
  Akontos und der historischen Restgruppen-Prüfung; Exit 0. Frühere Fehlversuche und der frühere grüne Zwischenstand vor
  dieser letzten Fachkorrektur bleiben separat erhalten.
- `completion-final-build-confirmed.log`: erfolgreicher abschliessender Produktionsbuild (Exit 0).
  `completion-final-client-asset-comparison.json` belegt 342 bytegleiche
  Browser-Dateien gegenüber der bestandenen Abrechnungs-Browsermatrix; die letzte
  Fachkorrektur ist serverseitig und separat nativ geprüft.
- `browser-completion-final/completion-results.json`: 160 Kombinationen aus zwei
  Engines, acht Breiten, zwei Themes und fünf Sprachen, jeweils mit Sammelrechnung,
  variabler Anrechnung und Schlussrechnung; zusätzlich 26 Quellenübernahmen.
- `completion-final-api-auth.log`: tatsächliche anonyme HTTP-Anfragen gegen
  219 private Routenmethoden des Builds vor der letzten serverseitigen Restgruppen-Sperre, sämtlich abgewiesen.
- `completion-final-pwa.log`, `completion-final-loading.log`,
  `completion-final-localization.log`: erfolgreiche Offline-/Neustart-,
  Sitzungsstart- und allgemeine fünfsprachige Browserprüfungen.

Lint, CSS-Architektur, Typprüfung, Schema-Vertrag und beide Sicherheitsprüfungen
sind grün. Nach den letzten Änderungen sind die betroffenen Dateien und der
Integrationsvertrag gezielt erneut geprüft. Die vier Budgetdateien sind laut
`completion-preserved-budgets.json` bytegleich mit dem gesicherten Ausgangsstand.
Die globale Routenmatrix wurde vollständig angestossen; ihre verbleibenden Fehler sind unten ausdrücklich ausgewiesen.

Während der Entwicklung erkannte Fehler wurden korrigiert: zeitabhängige
Revisionskennungen bei unterschiedlichen PostgreSQL-Sitzungszeitzonen, eine zu
enge Quellenbeziehung für direkte Akontoketten und eine umgebrochene PDF-Referenz.
Die Rolle `reader` erhält dieselben vollständigen Rechnungsfakten wie beim
bisherigen Einzelvereinbarungs-Lesezugriff; neue Schreibrechte entstehen nicht.
Die echte PostgreSQL-Gegenprobe prüft vollständige Bereiche/Verrechnungshistorie,
abgewiesene Schreibversuche und fremde Mandanten. Die Sichtprüfung bei 320 px/TR
fand zusätzlich den bislang fehlenden zentralen Platzhalter `Auswählen`; dessen
vier Übersetzungen und ein tatsächlicher fünfsprachiger Browser-Gegencheck wurden
ergänzt. Die Quellenreferenzen von vier bereits nicht abgenommenen Dokumentrouten
wurden aktualisiert; Status und leere Abnahmenachweise bleiben unverändert.
Fehlgeschlagene Zwischenläufe werden nicht als bestanden gezählt. Die erste mobile Chromium-Nachprüfung wurde bei Wiederholung überschrieben; ihr beobachteter Fehler (alter „Weiter bearbeiten“-Selektor) ist hier als Einschränkung der Protokollhistorie festgehalten. Die Originalmatrix und die letzte Nachprüfung liegen vor.

### Offene zusätzliche HTTP-Gesamtprüfschranke

`completion-final-api-tenant-postgres.log` stoppt mit
`Uncovered authenticated GET contract: /api/absences/context`. Der Endpunkt ist
bereits im Inventar von `afaf2a91` enthalten (159 damalige, 161 aktuelle APIs;
neu sind ausschliesslich die beiden Dokument-Leseendpunkte). Das betreffende
unveränderte HTTP-Gesamttestprogramm besitzt dafür keine Erwartung. Diese
Prüflücke wird weder unterdrückt noch in einen Pass umgedeutet. Die vollständige
zusätzliche HTTP-Inventarabnahme ist deshalb offen; ihre fehlenden Fachverträge
müssen separat ergänzt werden. Die tatsächlichen Abrechnungs-/Rollen-/RLS- und
Konkurrenzprüfungen sind hiervon getrennte Nachweise. Kein pauschales grünes
Quality-/CI- oder Releaseurteil aus diesem Bericht ableiten.

### Globale Browsermatrix: keine vollständige Freigabe

Der Vollplan umfasst 102 Chromium- und 33 WebKit-Routen, jeweils Light/Dark und
14 Breiten (320 bis 3840 px). Zur Vermeidung einer lokalen Überlast wurde er
bei gleichem Umfang in fünf Gruppen mit höchstens drei gleichzeitigen Breiten
aufgeteilt. Gruppen 1–4 bestehen in beiden Engines: elf Breiten, 2244 Chromium-
und 726 WebKit-Routen-/Theme-Fälle. Das ist keine Freigabe der fehlenden Gruppe.

- Mobile Chromium-Gruppe 0 bleibt nach Nachprüfung rot: Der Produkt-Erstellungstest
  wartet auf die sichtbare Meldung „Die Speicherung konnte nicht bestätigt werden“;
  das gefundene Element bleibt verborgen. Datei: scripts/ux-browser-test.mjs,
  Teststelle 1041. Ursache und vollständige weitere Interaktionen sind noch offen.
  Zuvor belegte veraltete Dialog-/Seiten-Selektoren wurden an die bereits vorhandenen
  zentralen FormPages angepasst; keine Produktprüfung wurde deaktiviert.
- Mobile WebKit-Gruppe 0 stoppt in der bestehenden Tastatur-Navigationsprüfung.
  Eine getrennte minimale HTML-Gegenprobe zeigt das Überspringen von Links auch
  ohne Binso im verwendeten Windows-WebKit/iPhone-Emulationskontext. Das ersetzt
  keinen echten Safari-Gerätetest. Die Navigation bleibt unverändert, der Gate rot.
- PWA-Offline/Neustart, Lade-/Sitzungsnavigation und allgemeine fünfsprachige
  Lokalisierung bestehen. Die Registrierungs-Gesamtprüfung endet zunächst rot
  wegen eines alten Dialog-Selektors im Kunden-Zusammenführungstest. Dessen
  gezielte Nachprüfung mit der tatsächlich vorhandenen FormPage besteht in vier
  Sprach-/Theme-Fällen. Der ursprüngliche Gesamtlauf wird nicht nachträglich als
  Exit 0 ausgewiesen.
- Die gesonderte Abrechnungsprüfung besteht mit 160 Kombinationen aus beiden
  Engines, acht geforderten Breiten, fünf Sprachen und beiden Themes; jeweils
  Sammelrechnung, Akonto-Verrechnung und historischer Abschluss (480 Abläufe).
  Dazu kommen 26 Übernahmeprüfungen der sechs bestehenden Modelle.

Rohdaten: completion-final-browser-results.json, completion-final-chromium-batch-0-recheck.log,
completion-webkit-keyboard-control.json, completion-final-customer-merge-correction.log,
browser-completion-final/completion-results.json im unten genannten Evidenzordner.

## Grenzen und verbleibende V8-Abnahme

| V8-Bereich | Lokaler Abnahmestand dieser Fortsetzung |
| --- | --- |
| A Inventur | Bestehende vollständige statische Matrix erhalten; Daten-/Integrationsinventar um die neuen Endpunkte und Beziehungen aktualisiert. Dynamische Vollständigkeit nicht daraus abgeleitet. |
| B Foundation/Navigation | Vorhandene zentrale Komponenten und Navigation erhalten. Zwei CSS-Standardwerte im zentralen Formular-Owner ergänzt; bestehende Rückfallwerte unverändert. Globale Browserprüfung separat protokolliert. |
| C Firmeneinrichtung/Kunden | Bestehender lokaler Stand erhalten; Regressionen laufen in der Gesamtsuite. Vollständige echte Verifikations-Mail-/Gerätekette weiterhin offen. |
| C Angebote/Aufträge/Zeit/Rechnungen/Zahlungen | Sechs Standardmodelle erhalten und um die drei hier beschriebenen Fälle ergänzt. Tatsächliche API-/RLS-/Status-/Konkurrenznachweise vorhanden; historische steuerliche Korrekturfälle unten gesondert offen. |
| C Planung/Budgets | Budgetkorrekturen unverändert; ihre tatsächlichen API-/RLS-Regressionen bleiben aktiv. Vollständige Auftragsplanung ist kein neu abgenommenes Paket dieser Fortsetzung. |
| D Spesen/Ausgaben/Support/Mitarbeiter/Berichte/Finanzen | Bestehender Stand und Regressionen erhalten. Keine neu behauptete vollständige Fach-/Rollen-/Geräteabnahme, kein neuer externer OCR-Provider. |
| D Einstellungen/Admin | Kunden-Passwortlogin und zwingende Operator-MFA erhalten. Keine Authentifizierungsänderung oder neue Providerqualifikation. |
| E Technik/Sprachen | Neue Datenverträge, RLS, Übersetzungen und zentrale Berechnung integriert. Sprachprüfung plus fünfsprachige Abrechnungs-Browsermatrix; fachliche Übersetzungsfreigabe weiterhin getrennt. |
| F Qualität/Release | Abschlussprüfungen und Evidenz unten; echte Geräte-/Providerabnahmen sowie Produktionsfreigabe bleiben offen. |

- Zusammenführung nur für dieselbe kanonische Kunden-ID und Währung; keine
  automatische Gleichsetzung verschiedener Kundenstammsätze oder Währungsumrechnung.
- Je Vereinbarung genau ein Bereich und Abrechnungskontext pro Rechnung.
  Mehrere Perioden oder verschiedene Meilensteine derselben Vereinbarung sind
  kein zusätzlich implementierter Sammelkontext. Projektbindungen bleiben an
  den bestehenden führenden Vereinbarungen; keine zweite Vertragsverwaltung.
- Gesamtrabatte bleiben je vereinbartem Bereich. Ein zusätzlicher pauschaler
  Rechnungsrabatt über mehrere unabhängige Vereinbarungen wird sicher abgewiesen.
  Feste Rabatte auf Teilmengen werden ausdrücklich aufgeteilt, nicht aus freien
  Vertragstexten abgeleitet.
- Bereits historisch zu hoch fakturierte Steuerbeträge oder fachlich veränderte
  Preise werden nicht als Rundungsrest kaschiert. Ein negativer historischer
  Rest wird sicher blockiert. Bestehende Gutschriften führen Bruttobeträge ohne
  Steuergruppen; daraus kann keine automatische steuerliche Korrektur abgeleitet
  werden. Dieser Sonderfall benötigt eine fachlich bestimmte Korrektur und bleibt
  gesondert offen. Alte Belege werden nicht neu berechnet.
  Positive historische Restcents benötigen die entsprechende Originalposition/
  Steuergruppe im Abschluss, gegebenenfalls mit Menge null. Gelöschte Restgruppen
  werden sicher abgewiesen; sie werden nicht automatisch als neue Leistung erfunden.
- Akontos mit bereits vorhandener Bruttogutschrift werden bis zu einer fachlich
  modellierten Steuerzuordnung nicht für neue Anrechnungen angeboten. Auch
  Vorschau/Schreiben und direkte Datenbankzugriffe weisen neue Anwendungen ab.
  Das ist eine ausdrückliche sichere Begrenzung; die alte Gutschrift erhält keine
  erfundene Steueraufteilung.
- Rechnungsrundung erfolgt auf CHF 0,01 mit nachvollziehbaren Restcenten; eine
  gesonderte Bargeldrundung auf fünf Rappen ist kein Bestandteil dieser Umsetzung.
- Gutschriften geben bereits erbrachte Zeiten oder Mengen nicht automatisch zur
  erneuten Abrechnung frei; auch ausgestellte stornierte Belege behalten ihren
  historischen Quellenverbrauch. Die Freigabe einer Akonto-Anwendung ist davon
  getrennt. Bestehende Zahlungs-/Erstattungsverfahren bleiben erhalten.
- Keine unbeaufsichtigte automatische Rechnungsstellung, kein allgemeines
  kundenseitiges Vorauszahlungskonto ohne konkrete Vereinbarung.
- Die bestehende Regel für Null-Rechnungen bleibt erhalten: Ausstellung als
  Schlussrechnung; kein neues allgemeines Null-Teilrechnungsverfahren. Die
  Akonto-Auswahl liefert höchstens 100 offene Quellen je Rechnungsempfänger.
- Browseremulation beweist keine physische iPhone-/iPad- oder installierte
  iOS-PWA-Abnahme. Echte Softwaretastatur, Geräte-Safe-Areas und externe Provider
  dürfen erst nach tatsächlich ausgeführten Tests als abgenommen gelten.
  Eine vollständige manuelle Prüfung aller Zustände bei 200 % Zoom ist ebenfalls
  keine neu belegte Abnahme dieses Pakets.
- Die bestehende vollständige Mandanten-Lösch-CLI mit historisch befülltem
  Geschäftsdatenbestand bleibt gesondert unqualifiziert; neue Ansichten werden
  nicht mehr fälschlich als eigene löschbare Datentabellen behandelt.
- Gesamtes V8 bleibt gemäss bestehender Modul-/Rollenmatrix teilweise offen.
  Diese lokale Abrechnungsfortsetzung erteilt weder fachliche/legal verbindliche
  Freigaben noch eine Produktions- oder Deploymentfreigabe.

## Übergabe

Kein GitHub-Push, Merge, Azure-Deployment oder produktive Migration durchgeführt.
Abschluss: alle 94 Pflicht-Testprogramme, Typprüfung, Produktionsbuild und
abschliessender Integrationsvertrag bestanden. Die native PostgreSQL-Fachprüfung
nach der Restgruppen-Korrektur endet mit Exit 0. Die 342 Browserdateien des finalen
Builds sind identisch mit dem tatsächlich geprüften Abrechnungsstand.
Beide isolierten PostgreSQL-Cluster wurden nach Abschluss beendet.

Git-HEAD bleibt afaf2a91688a5714cf3c35df4050fdbbfcb481c2; kein neuer Commit.
59 geänderte/neue Quelldateien und Dokumente (generierte .qa-Artefakte ausgenommen).
Vollständige Dateiliste und SHA-256-Werte: completion-worktree-manifest.json.
Quellstand-Prüfsumme ohne Dokumentation:
7fa244e802b0639890e4ce05c4e5e2cc58d240d60ce566c295ec73bc0fa58d7b.
Git diff --check ist grün. Sämtliche Budgetdateien erneut bytegleich bestätigt.

Tatsächliche Browserbilder (synthetische Testdaten):

- [Sammelrechnung, 320 px, Dark, Türkisch](../../../../audit-20261028-v8/browser-completion-final/completion-chromium-320-dark-tr-collection.png)
- [Akonto, 320 px, Dark, Türkisch](../../../../audit-20261028-v8/browser-completion-final/completion-chromium-320-dark-tr-advance.png)
- [Gemischtes Angebot, WebKit](../../../../audit-20261028-v8/browser-completion-final/webkit-mixed-offer.png)

Die lokale Fachumsetzung ist vorhanden; eine vollständige globale V8-/Releaseabnahme bleibt wegen der ausdrücklich aufgeführten roten Prüfungen und Geräte-/Fachgrenzen offen. Es wurden keine neuen kostenpflichtigen Dienste eingerichtet.
