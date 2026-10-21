# Revision 7 — Arbeitsstand und Abnahmegrenzen

Verbindliche Quelle: [bytegetreue Revision 7 mit allen 56 Kapiteln](../audit/v25-revision7/source.md).
P0/P1/P2 vollständig im Auftragsumfang; P3 ausgeschlossen. **Dieser Zwischenstand ist keine Gesamtfertigstellung und keine Produktionsfreigabe.**

## Basis und parallele Arbeiten

- Main geprüft: ba4234604ac16b2209bef70a532ccd94f4953035.
- Ausgangspunkt: PR305, 26dc1ffc7bf61a4058deba8b25b0271e1dc5dad1, bestehende technische Prüfungen erfolgreich.
- Eigener Folgebranch feat/v25-revision7; PR305 und PR306 bleiben unverändert. PR306 betrifft ausschliesslich einen Timer im Browser-Test; diesen Bereich nicht parallel bearbeiten.
- PR267, PR271, PR298 und Sicherheitsbranch bleiben erhalten. Keine produktiven Schreibaktionen.
- Die alten 399 Review-Fälle und realen Geräte-/Zustellabnahmen sind weiterhin offen. Alte grüne CI gilt nicht für neue Änderungen.

## Register

[Anforderungen](../audit/v25-revision7/requirements.csv), [Routen/Rollen/Zustände](../audit/v25-revision7/route-role-states.csv), [Routen, Komponenten, APIs und Migrationen](../audit/v25-revision7/routes.json).
Generator: scripts/revision7-inventory.mjs. Erfasst 56 Kapitel, 586 Satz-/Prüfklauseln, 77 Routen, 5588 geplante Route/Rolle/Zustand-Fälle. Zusammengesetzte Klauseln behalten den kompletten Originaltext; sie sind nicht pauschal bestanden.
Das Register ist eine Vollständigkeitskontrolle, kein Beleg ausgeführter Tests. Noch nicht einzeln ausgeführte Zustands-/Rollen-/Visualfälle bleiben ausdrücklich nicht abgenommen.

## Zusammenhängende Pakete

1. Identity/Foundation: rahmenlose Sprachwahl mit dem bestehenden zugänglichen Listbox-Owner; DE/FR/IT/EN mit ausgeschriebenen Sprachnamen im Popover; globale 12px/48px/16px Feldtokens, 28/22/16px Überschriften, keine Änderung an Navigation/FAB. Schrittweise Vollbildregistrierung, strukturierte Namen bis zur Datenbank und Einladung. Profilsprachpräferenz beim Laden berücksichtigen.
2. Dateien/Profile: begrenzte echte Bilddekodierung, automatische Orientierung, EXIF-/GPS-Entfernung, 512px-Avatar und proportionale Firmenlogos; definierte JPEG/PNG/WebP-Unterstützung, HEIC nicht als unterstützt ausgeben. Avatarentfernung nur eigener Datei und bedingte Löschung der aktuellen Referenz. Schadsoftware-/Quarantäneregeln bleiben bestehen.
3. Consent/Public: gleiche Optionen für Annehmen/Ablehnen/Einstellungen, versionierte datenarme Präferenz, zentrale Toggles, Fokusführung und Fehler bei blockiertem Speicher. Unveränderte ältere Kategorien werden kompatibel gelesen; keine neue Trackingzustimmung unterstellt. Notwendiger Speicher bleibt aktiv. Bestehender Web-Vitals-Sender prüft die Einwilligung unmittelbar vor jeder Übermittlung. Öffentlicher Footer erhält reale Kontakt-/Support-/Funktionsziele. Rechtstexte inhaltlich unverändert; keine juristische Übersetzung veröffentlicht.
4. Dokumente/Reporting: QR-Zahlteil für neue Ausstellungen auf eigener letzter A4-Seite mit freiem oberen Bereich. Historische Layouts ohne Rendererrevision bleiben erhalten; Migration0070 speichert künftig ausgestellte Rechnungs-PDFs unveränderlich. Keine rückwirkende Scheinarchivierung. Entwürfe ohne Bankdaten zulässig, Ausstellung ohne gültige Zahlungsdaten weiterhin gesperrt. Standard-Neuversand verwendet archivierte Bytes; Mahnung ist eine gesonderte aktuelle Zahlungsinformation. Reporting nutzt vorhandene autorisierte Datenquelle und PDF-Owner für echte PDF-/CSV-Exporte mit Audit, Vorschau und Gerätefreigabe. Sichere öffentliche Rapportlinks, direkte Berichts-E-Mails und vollständige Detailrapporte sind damit **noch nicht** abgenommen.
5. PDF-Viewer: zentraler Pointerpfad für Fit-Seitenwechsel, begrenzten Pinch-Zoom, Doppeltipp und Panning; Navigation nicht nach Pinch/Pan; begrenzte Canvas-Ressourcen. Tastatur und bestehende Seitenbuttons bleiben als Alternative. Echte iOS-/Android-Gestenabnahme offen.
6. Stammdatenimport: CSV/XLSX mit Feldzuordnung, Vorschau, Fehler-/Dublettenbericht und expliziter Übernahme neuer Kunden bzw. Kontakte. Kein Überschreiben oder automatisches Zusammenführen. Bestehende Repository-Validatoren und eine gemeinsame Transaktion; erneute Vorschau vor geänderten Daten, gleicher Idempotenzschlüssel nach unklarer Antwort. XLSX ohne Makros/Formeln/externe Verknüpfungen, begrenzte ZIP-Grössen, Parser-Worker ohne App-Credentials, Heap-/Zeit-/Konkurrenzgrenzen. Originale Quelldatensatznummern bleiben im Bericht erhalten. Der erste Browserlauf erreichte wegen fehlender echter SSR-QA-Anmeldung nur den Login. Die Titel-Aktionsfläche ist laut CSS auf Mobile verborgen; die vorhandene Command-Bar wird deshalb für Importaktionen verwendet. Dieser statische Befund ersetzt noch keinen erfolgreichen Browsernachweis. Der Test nutzt nun die unveränderte isolierte QA-Session-Foundation; keine Auth-Ausnahme.
7. Noch vollständig abzuarbeiten: atomarer Abgleich aller P0–P2-Klauseln, noch fehlende Merge-/Restore-/Reminder-/Detailreport-Funktionen nach Istprüfung, rollenbezogene KPI-Prüfung jeder Route, vollständige Sprachausgabe/Formatierung und juristische Sprachabnahme, Desktop/Public/Admin-Sonderzustände, reale End-to-End-/visuelle Abnahme. Keine pauschale Erfolgsmeldung für diese Bereiche.

## Nachgewiesene Ursachen und Datenfluss

Wiederherstellung: Kundenarchiv mit paginierter Suche im vorhandenen
Kunden-Aktionsmenü. Nur bestehende customers:delete-Berechtigung und
Kundenmodul-Entitlement; keine neue Rolle. Explizite Bestätigung,
Revisionsvergleich und Dublettenprüfung vor Wiederherstellung derselben ID.
Kein Kopieren, keine Umverteilung von Geschäftsbezügen und keine Änderung an
Kontakten; Replay erzeugt kein zweites Audit-Ereignis. Datenbankregressionen
prüfen erfolgreiche Wiederherstellung, Rollen-/Mandantenablehnung, veraltete
Revision, neue Dublette sowie unveränderte Kontaktdaten. Kontrolliertes
Kundenzusammenführen bleibt gesondert offen.

Systemzustände: 404, Offline, Wartung und Root-/Seitenfehler verwenden den
bestehenden AuthWorkspace als reduzierte Meldungsvariante, gemeinsame
Sprachwahl und Datenschutz-Einstieg. Keine Marketing-Introspalte im Fehlerfall,
keine Fehlerobjekte/Stacktraces; nur begrenzte Referenz-ID. Build bestanden.
Zwölf echte lokale Chromium-/Edge-Renders bei320/1440px und Hell/Dunkel
bestanden (evidence/revision7-system-states im Workspace), darunter echter
HTTP404, kein horizontaler Overflow und kein optionaler Mess-Chunk vor Consent.
Zwei Screens wurden zusätzlich visuell geprüft. Das sind abgeleitete Ansichten,
keine vollständige Originalreferenz- oder Geräteabnahme. Die danach ergänzte
Scrollbegrenzung des Consent-Dialogs bei400px Höhe muss die nächste CI-Runde
noch bestätigen.

Die Rollenmatrix verwendet nun die tatsächlichen Permission-/Orientierungs-
Owner statt alle öffentlichen und Legacy-Einstiege als Mandantenseiten zu
klassifizieren. 77 Routen und4961 geplante Route/Rolle/Zustand-Fälle bleiben
ausgewiesen; Navigationserwartungen sind keine API-/RLS-/Tarif-Abnahme.

Zeitrapport-Paket: bestehende timeWorkspace-Abfrage mit deren Rollen-, Mandanten-,
Datums-, Mitarbeiter-/Kunden-/Auftrags- und Statusfiltern wiederverwendet.
Explizite Projektion nur Datum, Kunde, Auftrag, Mitarbeiter, Tätigkeit, Minuten
und Verrechenbarkeit; keine internen Prüfanmerkungen, Stundensätze oder
Benutzer-/Datei-IDs. Berichte-Menü öffnet das vorhandene FormSheet, Suche und
Statusfilter, PDF-/CSV-Aktionen teilen einen Owner. 500 Einträge pro Rapport,
danach ausdrücklicher Fehler statt stiller Kürzung. PDF nutzt bestehende Fonts,
Logo, Seitenzahlen und Viewer; lange Aktivitäten fliessen mit wiederholtem
Tabellenkopf auf Folgeseiten. Tatsächliche PDF-Text-/Seitenbegrenzungstests und
Datenbanktests für Export, Status/Zeitraum, Rollen und Übergrössen bestehen.
Gruppierung nach Kunden-/Auftrags-/Mitarbeiteridentität ist vorbereitet; deren vollständige visuelle Abnahme sowie direkte Berichts-E-Mails, sichere Freigabelinks und der
vollständige Finanzbericht bleiben offen; Kapitel43 ist nicht vollständig.

Finanzberichte ergänzen nun Rückerstattungen und Netto-Zahlungseingänge getrennt
vom Bruttoeingang, nach tatsächlichem Buchungsdatum und Währung. Künftige
Buchungstage zählen nicht als bereits eingegangen. Kein Bankkontostand und keine
erneute Umsatzkorrektur durch Rückzahlung. Der reale Ledger-Test bestätigt
unveränderten Bruttoeingang und exakt40CHF Differenz in Rückerstattung/Netto.
Die bestehende zentrale KPI-Kachel formatiert numerische Währungswerte nach der
aktiven Profilsprache; SSR-Regression mit echtem LocaleProvider für alle vier
Sprachen bestanden. Andere alte Display-Formatierer sind damit noch nicht
pauschal internationalisiert oder vollständig abgenommen.

Support-Paket: Die Kundenprojektion lieferte den rohen Datenbankstatus
waiting_for_customer, während UI und Operator-API waiting_customer erwarten.
Zusätzlich fehlte beim Statusfilter das verpflichtende eq.-Präfix. Die zentrale
Projektion und der UI-Aufruf sind korrigiert; gespeicherte Statuswerte bleiben
erhalten. Ticketanlage und Antworten schreiben datensparsame Audit-Ereignisse
in derselben Transaktion, ein Retry dupliziert sie nicht. Antworten aktualisieren
den Listenzeitpunkt. Es wird kein Live-Chat angelegt; Formulartext und Aktionen
benennen das asynchrone Ticket. Tote lokale Demo-Antwortpfade wurden entfernt.
Die realen Datenbanktests, Übersetzungsabdeckung und Typecheck bestehen.
Support-Admin-Zuordnung, sämtliche Benachrichtigungen und reale PWA-Tastatur
sind dadurch noch nicht vollständig abgenommen.

| Feld/Defekt | Ursache / Pfad | Korrektur / Grenze |
|---|---|---|
| Registrierungsname | UI übermittelte einen Kontaktnamen; provisioning schrieb nur display_name, Profil las first_name/last_name | Explizite Felder → Register-DTO → provisioning → app_users.first_name/last_name → Profil-API. Keine Namen aus Firmen-/Displaynamen erraten; kein produktives Backfill. |
| Einladung | Aktivierung schrieb ebenfalls nur display_name | Neue UI übergibt beide Namen, Aktivierung setzt sie für neue eingeladene Benutzer. Bestehende aktive Identitäten werden nicht überschrieben. |
| E-Mail/Firma/Sprache | Vorhandene atomare provisioning-/Verifizierungslogik | Beibehalten; Sprache in app_users, Firma in organizations, eine aktive Mitgliedschaft. |
| Avatar | Produktiver ursprünglicher Uploadfehler hier nicht reproduziert. Nachgewiesen war bislang Signaturprüfung ohne vollständige Dekodierung/Metadatenbereinigung. | Sichere Verarbeitung ergänzt; Quarantäne blockiert weiterhin. Tatsächliche Produktionsantwort/Scannerstatus und Geräteprüfung bleiben für die konkrete Fehlermeldung nachzuweisen. |
| Rechnungsentwurf | Bankprüfung in create/update_document_atomic vor Statusprüfung | Bankprüfung gehört in den bestehenden Ausstellungsprozess; positive Entwurf- und negative Ausstellungsregression. |
| PDF-Historie | Rechnungen wurden bei jedem Abruf aus Snapshot neu gerendert | Neue Ausstellungen erhalten unveränderliche PDF-Bytes und SHA256; Altbestand unverändert, fehlende historische Originalbytes nicht nachträglich behauptet. |

## Verifikation und offene Grenzen

CI des Heads6894676f: Build und UX-Compliance erfolgreich, analyze technisch
erfolgreich; der zusätzliche Code-Scanning-Ergebnischeck meldet zwei High-Flows
von der Sprachauswahl. Die zentrale Sprachgrenze gibt nun feste Literale statt
des geprüften Eingabestrings zurück; positive/negative Locale-Regressionen bestehen.
Neue CodeQL-Auswertung bleibt erforderlich; kein Alert wurde unterdrückt.
Der Checks-Job scheiterte zuerst am historischen Wortlaut des Consent-Vertrags;
die Prüfung verlangt jetzt ausdrücklich Ablehnen/Annehmen/Einstellungen.
Der Scannerjob scheiterte im Testloader an der Paketauflösung für den echten
Sharp-Decoder. Der Loader löst installierte Pakete nun absolut auf, ohne Mock;
ein ungültiges altes PNG-Fixture wurde durch ein echt dekodierbares Bild plus
zusätzlichen Korruptbild-Negativtest ersetzt. Auth-/Upload-Regression und
release:check bestehen lokal. Der reale ClamAV-Gesamtlauf bleibt in Linux-CI
erneut nachzuweisen. Ein lokaler pnpm-test-Gesamtlauf stoppt an der vorhandenen
Bash/Azure-CLI-Fake-Prüfung unter Windows (Subprozessstatus null); kein Test
wurde deshalb übersprungen oder als erfolgreich gewertet.

Am Head43c5ce1d sind Build, realer Scanner, UX-Compliance und analyze erfolgreich.
Der CodeQL-Branchfilter für PR307 zeigt0 offene und2 geschlossene Befunde;
keine eigene Unterdrückung vorgenommen. Der zusätzliche Ergebnischeck bleibt
neutral mit «1 configuration not found» gegenüber main: vollständige
Konfigurationsvergleichbarkeit ist damit weiterhin nicht nachgewiesen.
Quality scheiterte diesmal im Protokoll-Peer: sein Signaturdatum wurde für jede
VERSION-Abfrage aus der aktuellen Uhrzeit neu erzeugt. Der Fake hält jetzt den
Zeitstempel einer Signaturversion pro Scan konstant; echte Wechsel, Timeout und
Ausfall bleiben negative Fälle. Windows-In-Memory-Protokollprüfung bestanden;
erneute Linux-CI mit Unix-Socket erforderlich. Der PDF-Timeout-Harness verwendet
nach zusätzlichem Zoom-State keine festen State-Array-Indizes mehr; tatsächliche
Timeout-/Late-result-/Unmount-Prüfungen bleiben erhalten und bestehen.
Die nachgelagerten lokalen Vertragstests liefen bis zum historischen
Typografievertrag durch. Dessen vier überholte Werte sind anhand Revision7
Kapitel20 aktualisiert (15px/600 Buttons,1.3 Titel,1.5 Body); Vertragsprüfung und
Adversarial-Tests bestehen. Historische Snapshots bleiben unverändert archiviert.

CI d79252de: Kompilierung erfolgreich, der Build-Job scheiterte danach am bewusst
strengen HTTP-Abdeckungsvertrag für den neuen /api/customers/archive-Endpunkt.
Unabhängige Owner-/Admin-Erwartung, fremder Mandant, Stale-Revision, erfolgreiche
Wiederherstellung und Replay sind im nativen HTTP-Test ergänzt; Ausführung dort
steht mit der nächsten CI noch aus. Checks scheiterte an einem fehlenden
SystemState-Adapter im isolierten Root-Theme-Test. Dieser verwendet jetzt die
tatsächliche gemeinsame Fehlerkomponente und zusätzliche Geheimnis-/Referenz-
Negativfälle; lokale Theme-Prüfung bestanden. Keine Abdeckungsassertion entfernt.

Die optionale Web-Vitals-Implementierung wird nun erst nach ausdrücklichem
Performance-Opt-in dynamisch geladen. Jeder Versand prüft die aktuelle Zustimmung
erneut. Weil der installierte Next-Reporter seine Observer nicht entfernt,
blockiert der abgemeldete Komponentenlebenszyklus alte Callbacks auch nach einer
erneuten Zustimmung; identische Messungen werden begrenzt dedupliziert.
Gezielte ausführbare Regressionen für Ablehnung, Zustimmung, Widerruf, ungültige
Werte und veraltete Observer sowie Typecheck sind bestanden. Dies ersetzt weder
das vollständige Provider-Inventar noch die juristische Consent-Abnahme.

Tatsächliche Testergebnisse werden in evidence.json und im Paketbericht fortgeschrieben, niemals aus Dateiexistenz abgeleitet. Zwischenprüfungen: Registrierung/PGlite, Bildverarbeitung, PDF-/QR-Berechnungen, Lokalisierungsabdeckung, Navigation und Gestenhelfer. Gebündelte Build-/Browser-/CI-Abnahme steht noch aus.

Die fachlichen Inhalte rechtsverbindlicher Übersetzungen benötigen qualifizierte Prüfung. DNS/TLS/SPF/DKIM/DMARC, reale Graph-Zustellung/Bounces, Push-Infrastruktur und Wiederherstellungsnachweis sind externe Voraussetzungen. Keine neue Berechtigung oder Infrastruktur eigenmächtig anlegen. Physische Geräte-/PWA-/Tastaturprüfungen nicht durch Desktopemulation ersetzen.

SIX-Referenz für die QR-Prüfung: [offizielle QR-Rechnungsstandards](https://www.six-group.com/en/products-services/banking-services/payment-standardization/standards/qr-bill.html), [Version2.4](https://www.six-group.com/dam/download/banking-services/standardization/qr-bill/ig-qr-bill-v2.4-en.pdf). Eigene Layoutvorgabe «oben frei» von SIX-Payload-/Massvorgaben unterscheiden; keine Zertifizierung behaupten.

Für eine spätere Integration/Produktion braucht dieses neue Paket eine eigene exakte SHA-Freigabe einschliesslich Migration0070 sowie vorheriger, noch nicht integrierter Migrationen0067–0069. Kein Merge, keine Migration und kein Deployment ausgeführt.

## Projektlokale Abhängigkeiten

Die bisherige node_modules-Verknüpfung in einen anderen Checkout wurde unverändert
als Junction ausserhalb des Repositories unter Workspace-.qa-tools erhalten.
Das Projekt hat nun eigene node_modules und über .npmrc einen eigenen
Workspace-Store ../.qa-store. Keine globalen pnpm-/Node-/Codex-Einstellungen oder
Versionen geändert. Der externe Checkout wurde nicht verändert. Die zeitweilige
Junction-Kopie im Repository hätte TypeScript fremde Paket-Deklarationen einlesen
lassen; sie liegt deshalb ausserhalb des Compiler-Suchbereichs. Keine falschen
nullable-Hooks durch Änderungen an allen App-Seiten kaschiert.

ExcelJS4.4.0 ist für den verpflichtenden XLSX-Import gepinnt. Die gefundene
UUID-Advisory [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq)
wurde mit einem ausschliesslich auf exceljs>uuid begrenzten Override auf11.1.1
beseitigt. Die tatsächlich verwendete v4-Schnittstelle wird auch durch einen
XLSX-Test mit bedingter Formatierung ausgeführt. Registry-Produktionsaudit nach
der Korrektur: keine gemeldeten Advisories zum Prüfzeitpunkt. Dies ist keine
Garantie allgemeiner Fehlerfreiheit; Gates und bestehende Meldungen auf Main
bleiben verbindlich.

Die Prüfklauseln wurden von groben Absatzgruppen auf einzelne Sätze verfeinert.
Ein alter Teilnachweis wird nur bei exakt identischem Klausel-Hash übernommen;
verschobene IDs dürfen keinen Nachweis versehentlich einer anderen Anforderung
zuordnen. Das Register bleibt damit bewusst konservativ. Die Import-UI-Abnahme
ist lokal durch den fehlenden nativen QA-PostgreSQL blockiert und muss über die
bestehende CI-Umgebung erfolgen, nicht über eine geschwächte Sessionprüfung.
