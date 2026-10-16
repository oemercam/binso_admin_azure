> Historischer Stand des früheren Piloten. Aktuelle Umsetzung und Prüfungen: [Reference Foundation Review](reference-foundation-review.md). Keine aktuelle UI-Regel.

# Referenzgebundener Pilot – 16.10.2026

Ausgangspunkt: Main `c88a581e7bf952a0da9923a58f1e229c67c28986`, sauberer Arbeitsbaum; eigener Branch `ux/reference-pilot-alignment`.

Das erneut gelieferte `binso-one-ux-referenzpaket(1).zip` wurde direkt aus dem Anhang gelesen: IMPLEMENTIERUNG.md zuerst, danach die HTML-Ansichten. Anleitung und vier verbindliche HTML-Dateien sind bytegleich mit `reference/`. Index und ursprüngliche Fragmente sind ergänzend. Microsoft-Variante, Originalassets und unveränderte Bottom-Navigation bleiben verbindlich. Keine Vorschau-Daten oder Vorschau-Handler übernommen.

## Nachgewiesene Ursachen und Änderungen

- Kundenliste: lokale Suche und Filter waren Bestandteil der Heading-Aktionsgruppe und standen auf Desktop rechts oben. Bestehende RecordsControls stehen jetzt direkt vor den Daten. CreateAction bleibt im Heading. Die Kennzahlen sind gemäss Referenz nur auf Desktop sichtbar; die vorhandene MetricTiles-Komponente besitzt dafür eine gemeinsame `desktopOnly`-Option. Gesamt-/Aktivzahl kommen aus ungefilterten bestehenden Kunden-API-Zählungen, unabhängig von Suche/Status/Seitenwechsel. Offene Forderungen stammen aus der bestehenden rollenbegrenzten Finanzzusammenfassung; mehrere Währungen bleiben getrennt. Fehlende Werte sind kein erfundener Nullsaldo.
- Mobile Hauptüberschrift: zwei historische responsive Regeln blendeten das Heading grundsätzlich aus. Der bestehende AppShell besitzt jetzt die explizite Variante `headingPlacement="content"`; zunächst verwendet nur die Kundenliste diese Variante. Der mobile globale Header zeigt dort Originalbranding statt des doppelten Bereichstitels. Keine separate Shell eingeführt.
- Die bisherige 100%-Breite der Heading-Aktionsgruppe drückte den wieder sichtbaren Titel auf null Breite. Der gemeinsame responsive Owner reserviert diese Breite nur noch für die bisherige Header-Variante. Bestehender absoluter Plus-Inset gilt ebenfalls nur für diese Variante. Das ist eine zentrale fachliche Layoutvariante, keine kundenbezogene CSS-Regel.
- Kundendossier: vorhandenes responsives `detail-grid` ordnet auf Desktop Finanzinformationen/offene Vorgänge neben Kundendaten an; Mobile stapelt. Die bestehenden DocumentSummaryRows verwenden echte Kundendokumente, maximal vier Vorgänge mit Zugang zum vollständigen Finanzbereich. Keine Datenberechnung geändert. Angebot, Rechnung und Zeit sind über bestehende erlaubnisgeprüfte Ziele direkt in der Desktop-Aktionsleiste erreichbar; Mobile behält weitere Aktionen im Sheet.
- Gemeinsamer mobiler Suchfeld-Owner verwendet den bestehenden Control-Radius statt der konkurrierenden 999px-Pillendeklaration. Detailraster-Surfaces beziehen keine zusätzlichen oberen/unteren Abschnittsrahmen mehr aus der historischen Informationsgruppenregel. Keine Navigationstokens geändert.
- Referenzcapture ergänzt explizite mobile Kundenlisten-/Dossieransichten über die vorhandenen Vorschau-Interaktionen. Der Browsertest stellt nach der Linienprüfung den ursprünglichen eingeklappten Verlauf wieder her, damit Screenshots den tatsächlichen Startzustand zeigen. Keine Baseline automatisch freigegeben oder Prüfung entfernt.
- Neue Texte sind in EN/FR/IT ergänzt. Türkisch ist weiterhin eine bekannte Lücke des vorhandenen Produkts.

## Prüfung und Grenzen

Lokaler Browser konnte separat aus einem npm-Paket bereitgestellt werden, nachdem Playwrights Chromium-ZIP unvollständig ankam. Keine neue Projektabhängigkeit und keine Lockfileänderung. Browser: Chromium 153; Playwright aus dem vorhandenen Runtime-Bundle. Dies ist ein Entwicklungsnachweis, kein Ersatz der vorgeschriebenen GitHub-Chromium-/WebKit-Prüfungen oder eines physischen iPhones.

Zwischenstand vor den letzten Kennzahlen-/Suchradius-/Rahmenänderungen: 18 synthetische Routen-/Theme-/Viewportfälle bestanden (Login, Kundenliste, Kundendetail; 1440/1101/390; Light/Dark). Aktuelle Bilder wurden gegen die unveränderten Referenzbilder angesehen. Der abschliessende Lauf nach allen Änderungen besteht für 12 Fälle bei 1440/390 px in Light/Dark. Bilder, Ergebnisdatei und SHA-256-Manifest liegen unter `docs/evidence/reference-pilot-20261016/`. Der zusätzlich zuvor bestandene 1101-px-Lauf umfasst sechs Fälle. Ein kombinierter Lauf mit zwei Desktopbreiten im selben Browserkontext kollidierte bei der synchronisierten Navigationseinstellung; separate Breitenläufe bestanden, keine Produktprüfung wurde abgeschwächt. Erfolgreich: ESLint der geänderten Dateien, TypeScript, Produktionsbuild, unveränderter Navigationsvertrag, CSS-Architektur, UX-Stylevertrag und aktuelle Komponenten-/Routenzuordnung. Keine vollständige Funktionsabnahme daraus abgeleitet.

Vollständiges `pnpm test` scheitert lokal weiterhin im Scanner-Unix-Socket an EPERM. Das Gate bleibt unverändert aktiv. Main-Quality #38815400660 scheiterte zusätzlich im bestehenden Geschäftstag-Statistiktest; dessen separate umfassendere Korrektur liegt bereits in PR #257. Die zunächst hier untersuchte gleiche Änderung wurde entfernt, damit kein doppelter Fix entsteht. Keine produktive Finanzberechnung geändert.

## Noch offen – keine visuelle Gesamtfreigabe

Der Pilot ist weiter in Arbeit. Exakte Übereinstimmung ist nicht bestätigt. Offen bleiben insbesondere Referenztypografie/-abstände der gemeinsamen Zeilen, Firmen-/Arbeitsbereichsauswahl, dauerhafte globale Desktop-Suche statt ausschliesslichem Suchsymbol, Desktop-Status-Tabs und kontextbezogener kontrollierter Aktionsoverflow. Der mobile Dossierkopf/Informationsaufbau weicht weiterhin vom Entwurf ab. Die existierenden fachlichen Kontakte-/Finanztabs bleiben erreichbar; ihre Anordnung ist noch kein vollständiges Match der Referenz-Dokumenttabs. Referenzdarstellungen mit Beispieldaten rechtfertigen keine Änderung echter Berechnungen.

Dark Mode wurde technisch geprüft, ist laut Referenzpaket weiterhin nicht visuell freigegeben. Fehlende Ansichten sind als abgeleitet zu behandeln. Keine breite Übertragung dieses noch nicht vollständig abgeglichenen Piloten, kein Merge und kein Deploy dieser Phase. Vollständige Pflicht-Gates und abschliessender Referenzvergleich stehen aus.

## Folgeprüfung: gerenderter Vergleich bei 1440 und 390 px

Dieser Abschnitt ersetzt die offenen technischen Aussagen des vorherigen Zwischenstands; die damaligen Bilder bleiben historische Evidenz. Arbeitsbasis: `da4bf40` mit Main-Fix #257 integriert, anschliessende Änderungen und exakte Quell-/Bildhashes in `docs/evidence/reference-pilot-review-20261016/manifest.json`. Keine Referenzdatei geändert, keine Baseline freigegeben.

### Nach Sichtprüfung korrigiert

- Gemessene Microsoft-Typografie übernommen: Inter/system-ui, Haupttitel Desktop 27/600 und Mobile 25 bzw. Dossier 23/600; zugehörige Zeilenhöhen, Laufweiten und Haupttextfarben. Sekundärtextkontrast bewusst höher als in der kleinen Vorlage.
- Login-Spalten, 65-px-Abstand, Formbreite, Startposition, Titel und 5-px-Controlradien korrigiert. Funktionale Texte, Login-/Codeablauf, Passwortanzeige und brauchbare Checkbox bleiben erhalten. Die fehlerhafte Checkboxbreite des HTML-Musters wird nicht repliziert.
- Sidebar auf 195 px, aktive Linie/Surface, sichtbare echte Firmendaten als Link und reale globale Desktop-Suche umgesetzt. Der Firmenlink ist kein vorgetäuschter Mandantenwechsel.
- Listenfilter bei den Daten, Desktop-Linientabs vor der Suche, Mobile danach. Dossierkopf mit Originalbranding und Inhaltsüberschrift statt doppelter mobiler Headerüberschrift; Status auf der Unterzeile.
- Dossier-Finanzwerte aus vorhandenen Jahres- und Forderungsdaten nach Währung. Kontakt rechts auf Desktop, davor auf Mobile. Nur tatsächliche offene Rechnungen in der Übersicht. Zusätzliche Kundendaten bleiben erreichbar: Desktop offen, Mobile in einem ausdrücklich abgeleiteten Disclosure. Ein alter Logo-Breitenowner und die ungünstige Raster-Verteilung wurden nach Bildprüfung korrigiert.

### Sichtbar und noch nicht referenzgleich

| Bereich | Restabweichung / Einordnung |
| --- | --- |
| Kundenliste | Finanzspalten je Zeile fehlen in der bestehenden API. Kontakt/Ort/Status-Tabelle, Zeilenhöhe, Statuspill und Zeilenaufbau bleiben sichtbar anders. Dies ist eine offene Abweichung, keine freigegebene Ableitung. Keine Platzhalterfinanzen. |
| Listentabs und Aktionen | Fachlich vorhandene Filter (Alle/Aktiv/Inaktiv), Sortierung im vorhandenen Filter sowie echtes Plus bleiben. Mockup-Filter „mit offenen Beträgen“ und separate Sortierfläche sind noch nicht vollständig umgesetzt. |
| Navigation und Branding | Originalassets und bestehende Bottom-Navigation bleiben verbindlich erhalten; Inhalt der produktiven Sidebar unterscheidet sich von der schematischen Referenz. Keine Navigation neu erfunden. |
| Firmenauswahl | Echte Firmendaten verlinken zur vorhandenen Firmenverwaltung; ein funktionaler Arbeitsbereichswechsel fehlt weiterhin. |
| Kundendetail | Kontakt-Tab, Zusatzdaten-Disclosure, reale Dokumentzeilen/Statuspills und kombinierte Währungsbeträge sind zusätzliche/abweichende Komponenten. Abstände sind deshalb noch nicht vollständig identisch. Im Vergleich ausdrücklich sichtbar. |
| Login | Footer bleibt am verfügbaren Viewportende, echte Funktionslinks und Originalbranding ändern Inhalte/Längen; mobile Felder 16 px und Touchflächen mindestens 44 px. Kein vollständiger Pixelmatch behauptet. |
| Dark Mode und fehlende Zustände | Als abgeleitete Entwürfe gezeigt; weiterhin keine visuelle Freigabe. |

### Prüffähige Vorschau und Nachweise

`BINSO_ONE_UX_Vergleich.html` ist eine offline verwendbare Vergleichsdatei mit 24 Produktansichten, sechs Referenzbildern, Umschaltung 1440/390 px, Nebeneinander/Überblendung, gemessenen Haupttitelwerten und Abweichungsprotokoll. Sie ist keine interaktive Produktbereitstellung: Die Bilder stammen aus der echten Implementierung mit isolierten API-Testdaten, keine produktiven Kundenkopien und keine übernommenen Referenzbeträge. Referenzdarstellungsrahmen, Vorschau-Schalter und OS-Uhr sind entfernt; Desktop-Arbeitsbereich auf identische Browserbreite gerendert. Interne Referenzkomponenten und die gelieferten Dateien bleiben unverändert. Eine Pixel-Prozentzahl wäre wegen unterschiedlicher echter Inhalte irreführend.

Aktueller Produktionsbuild bestanden. Browsermatrix: 20 Routen-/Theme-/Viewportfälle (drei Piloten plus Kontakte-/Dokumenttab, Light/Dark, 1440/390), dazu zwei Leer- und zwei HTTP-503-Fehlerfälle. Disclosure per Pointer und Enter geprüft; der Fokus wird danach für den normalen Start-Screenshot zurückgesetzt. Vier abschliessende Dossiercaptures wurden nach dieser Testkorrektur ersetzt. Alle 30 eingebetteten Bilder der Vergleichsdatei laden; Ansichtswechsel, mobile Breite und Überblendung geprüft, keine Browser-JavaScriptfehler.

`corepack pnpm qa:fast --typecheck` bestanden: Lint, TypeScript, zehn zugeordnete statische/Komponenten-Suites; führt absichtlich keine weiteren Browser aus. Zusätzlich unveränderter Navigationsvertrag, Lokalisierungsabdeckung und UX-Style-Adversarialtest bestanden. Aktuelle Komponenten-/Routeninventare neu erzeugt, ohne den visuellen Status der übrigen 76 Seiten hochzustufen. Eine zunächst veraltete Inventarfingerprint-Datei sowie die alten Auth-Geometrieerwartungen im Browsertest wurden korrekt aktualisiert; keine Produktprüfung entfernt.

Main-Statistikfix #257 ist integriert; die zuvor gemeldete Geschäftstagslücke ist separat behoben. Lokaler Gesamtlauf weiterhin durch Scanner-Unix-Socket-EPERM begrenzt, keine Gates abgeschaltet. Vollständige CI, WebKit, physische Geräte und sämtliche Schreibabläufe sind nicht durch diese Matrix ersetzt.

Keine breite visuelle Freigabe, kein Merge und kein Deploy. Gemeinsame Komponenten wirken technisch auf weitere Bereiche; deren Ableitung ist weiterhin nicht visuell abgenommen. Weitere Übertragung erfolgt erst nach dem noch offenen Pilotvergleich.
