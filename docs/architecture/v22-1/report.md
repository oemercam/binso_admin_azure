# V22.1 Arbeits- und Abnahmebericht

**Stand: Teilimplementierung. Der Gesamtauftrag ist nicht abgeschlossen und nicht zur Produktion freigegeben.**

Basis: `main`, `cf1a98a6e783ca4f7a2c06199002d5398fd5edd4`; Arbeitsbranch `feat/v22-1-customer-standard-enforcement`. Die Basis wurde während der Arbeit erneut abgefragt. Azure `/api/health` meldete dieselbe Ausgangs-SHA. Diese Prüfung bestätigt keine Live-Auslieferung der neuen Änderungen. Details: `baseline.json`.

## Inventar und Nachweisgrenzen

`routes.md` und `source-inventory.json.gz` enthalten 71 Seitenrouten, Import-/Render-Erreichbarkeit, Komponenten, JSX-Widgets, Bedingungen, API-Bezüge, CSS-Regeln, Reihenfolge, Breakpoints und Quellzeilen. Das gzip enthält vollständiges JSON, keine gekürzte Zusammenfassung. Statische Erreichbarkeit ist kein Nachweis jedes bedingten Laufzeitzustands.

`data-inventory.json` / `api-inventory.md`: 95 Geschäfts-API-Routendateien, Client-Verbraucher, Repository-Aufrufe, Auth-/Tenant-Aufrufe und 46 Migrationen. Das zusätzliche Manifest erklärt die 96 Route Handler im UX-Inventar. `schema-inventory.json`: alle Migrationen frisch in isoliertem PGlite angewendet; 95 Tabellen, 1’222 Spalten, 514 Constraints, 69 Policies, 335 Indizes. Keine Produktionsdatenbank wurde verändert oder als vollständig geprüft ausgegeben.

`route-states.json` führt die geforderten Zustände pro Kunden-App-Route. Nicht beobachtete Zustände bleiben offen. `root-causes.json` dokumentiert zehn konkret belegte Ursachen mit Route, Komponente, Import-/Render-Pfad, Code-Stelle, zentralen Verbrauchern, CSS-Katalogverweisen, Korrektur und Test. Das ist noch keine vollständige Abweichungsanalyse sämtlicher Zustände. `requirements.json` / CSV enthalten 338 IDs; offene Gesamtanforderungen werden trotz vorhandener Teilnachweise nicht als bestanden übernommen.

## Implementierung

- `components/statistics.tsx`: gemeinsamer dunkler Statistik-Owner mit genau drei Kennzahlen, gruppierten Säulen, dezenter Rasterung, beschrifteter Legende und bedienbaren Säulendetails. Presets 1/3/6/12 Monate; individueller Zeitraum über vorhandenes `FilterSheet`, `Field`, `Input`, `Button`, `ErrorState`. Keine neue Sheet-Familie.
- `lib/statistics-period.ts`: inklusive Kalendergrenzen, valide Datumsprüfung, Tages-/Wochen-/Monats-/Jahresaggregation, begrenzte lange Achsen und gemeinsame Kennzahlen-/Balkenberechnung. Keine künstlichen Transaktionen oder Nullbalken. Auswahl bleibt in derselben Browser-Session erhalten; gespeichert wird nur der Zeitraum.
- `cashStatisticsData` / `CashStatistics`: echte zugeordnete CHF-Zahlungen und tatsächlich erstattete CHF-Spesen nach Schweizer Zahlungstag. Genehmigte, nicht erstattete Spesen, Bruttolohn und undatierte Betriebskosten sind keine nachgewiesenen Auszahlungen. Historisch fehlende Zahlungsbasis wird offengelegt. Das Ergebnis ist der Saldo erfasster Zahlungen, kein buchhalterischer Gewinn und keine Vollständigkeitsbehauptung für alle Betriebsausgaben.
- Übersicht: Titel, eine bestehende Erstellaktion, Finanzentwicklung, echte überfällige Rechnungen, zuletzt bearbeitete Rechnungen. Die Überfälligkeit wird vor dem Limit über den berechtigten Gesamtbestand ermittelt. Weitere Prozessarten im Cockpit bleiben zu integrieren.
- Finanzen und Finanzanalyse verwenden denselben Statistik-Owner. Aktuelle Forderungen bleiben separat beschriftet und unabhängig vom Diagrammzeitraum. Die Rechnungsliste wird bei einer direkten Suche nicht vom Chartzeitraum begrenzt.
- Kundendetails: echte kundenspezifische Zahlung/Fakturierung/Rechnungszahl, nach Währung getrennt. Keine Forderungsbestände in Zeitbalken. Die alten Overview-Text-KPIs wurden ersetzt. Die vier Tabs **Übersicht, Kontakte, Finanzen, Aktivität** bleiben erhalten. Aktiver Bereich im validierten URL-Parameter `tab`.
- `DetailTabs`: zentrale Tab-Semantik, roving focus, Pfeiltasten/Home/End, Sichtbarkeit des aktiven Tabs. Link-Navigation bleibt Navigation. Weitere vollständige Keyboard-/Back-Abnahme bleibt offen.

## Daten, APIs und Legacy

Die Änderungen ergänzen lesende Projektionen für Dashboard, Finance und Customer Workspace. Bestehende API-Felder bleiben kompatibel. `updated_at` wird in der sicheren Dokument-Sortierliste freigegeben; Tenant-/Rollenprüfung bleibt serverseitig. Kundenauswertung wird bei fehlenden Invoice-/Payment-Leserechten nicht zurückgegeben.

**Keine neue Migration, keine Mutation historischer Beträge, Referenzen, Nummernkreise oder Dokument-Snapshots.** Für fehlende historische Zahlungsdaten wird kein erfundenes Backfill durchgeführt. Das erforderliche strukturierte Adressmodell und seine Verbraucher sind noch nicht migriert.

Gerenderte alte Dashboard- und Finance-Grafiken sowie die externe Customer-Overview-KPI-Reihe wurden entfernt. `removed-css.json` belegt 120 entfernte unbenutzte Selektorzweige. Operator-Verbraucher von `finance-range`, `month-bars` und Breakdown-Stilen bleiben erhalten. Unbenutzte Imports in den migrierten Seiten wurden bereinigt. Die alten Daten-API-Projektionen bleiben wegen bestehender Verträge und Tests vorläufig bestehen; dies ist ausdrücklich kein abgeschlossener Legacy-Cleanup.

## Feld- und Pflichtfeldmatrix

| Bereich | Aktuelle echte Serverregel | Aktueller UI-/Modellbefund | Ziel und Status |
|---|---|---|---|
| Kunde neu | Name mindestens zwei Zeichen; Ort optional | UI fordert zusätzlich Ort; vollständiger Seitenweg | Pflichtstatus abgleichen, frühe Minimalerstellung im gemeinsamen Sheet: offen |
| Kunde Typ | Aktuell ein Name/Legal-name-Vertrag | Kein durchgängiger Business-/Private-Typvertrag nachgewiesen | Fachlichen Typ-/Minimaldatenvertrag ergänzen: offen |
| Kontakt | Vor-/Nachname, Kunden-/Tenant-Zuordnung | Bestehendes Kunden-FormSheet | Feldregister und komplette Abbruch-/Wiederaufnahme-Abnahme: offen |
| Kundenadresse | Kombiniertes address, zip, city, country | Hausnummer/Zusatz nicht durchgängig strukturiert; QR-Heuristik | Additive Migration, unklare Adressen manuell, historische Snapshots bewahren: offen |
| UID/MWST | Kunde: String trim/Länge | Formatierer vorhanden, kein gemeinsamer Prüfziffer-/Statusvertrag | Offiziellen Algorithmus nachweisen; Client/Server/Register koppeln: offen |
| IBAN/QR | Vorhandene CH/LI-QR-Validierung und Referenzprüfung | Allgemeine internationale IBAN-Verwendung nicht vollständig belegt | Zahlungsformat und internationale Kontodaten getrennt validieren: offen |
| Kunden-Nr. | Counter transaktionssicher | customer_no fehlt in allgemeiner Rückgabeprojektion | Nummer nach Erstellung in Detail/Liste; nie in Neuerfassung: offen |
| Dokumentnummern | Bestehende Entwurfs-/Finalisierungsregeln | Neuerfassungsfeld an draft.id gekoppelt | Alle Wiederaufnahme-/Entwurfsfälle gegen absolute UX-Regel prüfen: offen |
| Zeitraum | Zentrale valide inklusive Von-/Bis-Grenzen | Vorhandenes FilterSheet/Field/Input | In den vier migrierten Ansichten geprüft |

Eine vollständige Feldmatrix aller Prozesse und eine gemeinsame fachliche Feldregistrierung stehen noch aus. Bestehende Prüfungen ersetzen diese Arbeit nicht.

## Schweizer Prüfgrundlagen

Stand der Recherche: 10.10.2026. Rechtsnormen, Zahlungsstandards, Bankanforderungen und UX-Entscheidungen werden getrennt behandelt.

| Grundlage | Version/Gültigkeit | Nachweis und Konsequenz |
|---|---|---|
| SIX QR-Rechnung | 2.3 seit 22.11.2025 | [Offizielle QR-bill-Seite](https://www.six-group.com/en/products-services/banking-services/payment-standardization/standards/qr-bill.html): strukturierte Adressen und erweiterter Zeichensatz. Aktuelle Kunden-/QR-Verbraucher vollständig migrieren. |
| SIX QR-Rechnung | 2.4, Dokument 24.02.2026, Einführung SIC-Release November 2026 | [Implementation Guidelines 2.4](https://www.six-group.com/dam/download/banking-services/standardization/qr-bill/ig-qr-bill-v2.4-en.pdf), Versionstabelle/Übergang: 2.3 bleibt bis November 2027 zulässig; EUR-Änderungen berücksichtigen. Exaktes Betriebs-/Release-Datum vor Freigabe erneut prüfen. |
| ESTV MWST | 8.1 / 2.6 / 3.8 Prozent seit 01.01.2024 | [Offizielle Steuersätze](https://www.estv.admin.ch/de/mwst-steuersaetze-schweiz). Historische Datums-/Kategoriebehandlung nicht durch UX überschreiben. |
| UID | Offizielles Registerformat CHE-123.456.789 / CHE123456789 | [UID-Register](https://www.uid.admin.ch/). Kein amtlicher Prüfzifferalgorithmus in diesem Arbeitsstand verifiziert; keine Validierungsabnahme behauptet. |
| Rechnungsangaben | MWSTG Art. 26 | [Fedlex](https://www.fedlex.admin.ch/eli/cc/2009/615/de). Vollständiger Abgleich gegen PDF, Versand und Snapshots offen. |
| Datenschutz/TOM | EDÖB Leitfaden 15.01.2024 | [EDÖB Publikation](https://www.edoeb.admin.ch/de/23012024-leitfaden-tom-publiziert). Tenant-/Rollenintegration frisch getestet; vollständige Datenschutzabnahme ist dadurch nicht ersetzt. |

SPS/ISO-20022-Versionen, vollständige IBAN-/QR-IBAN-/QRR-/SCOR-Matrix, internationale Adressen, UID-Prüfziffer, MWST-Status/-Kategorien und zertifizierte QR-Validierung bleiben offen. Vorhandene QR-Unit-Tests sind kein SIX-/Bank-Zertifizierungsnachweis.

## Tests und visuelle Nachweise

Erwartete und beobachtete Ergebnisse stehen in `requirements.json`, Rohlogs und Browser-Ergebnisdateien in `docs/assets/v22-1`. Die API-Browserfixtures sind synthetisch; sie testen gerenderte UI-Verträge, keine produktiven Schreibprozesse. Die Repository-/RLS-Tests laufen separat in einer isolierten Datenbank.

Nachgewiesen: Statistik-/Datums-/Dezimaltests, Rollen/Tenant, Kunden-Währungstrennung, tatsächliche Spesen-Erstattung/Schweizer Datumsgrenze, vollständige vorhandene Unit-/Integrationstests, Lint, Typecheck und Produktionsbuild; gezielte Chromium-Matrix: 4 Routen × 11 Breiten × 2 Themes = 88 Kombinationen. Alle Breiten 320, 360, 375, 390, 430, 768, 820, 1024, 1280, 1440, 1920 wurden dabei geprüft. Die finale lokale CI (`pnpm run ci`: Release-Gate, vollständige Tests, Lint, Typecheck, Produktionsbuild) ist bestanden; `ci-final.txt`. Die breite Routen-/Prozessregression wird separat protokolliert. Fehlgeschlagene QA-Versuche bleiben sichtbar: ein veralteter Button-Selektor nach der Tab-Semantikmigration (korrigiert) und ein Browserlauf während eines Builds, der Next-Chunks austauschte (Lauf verworfen, auf stabilem Build wiederholt). Ein weiterer Vollversuch deckte einen veralteten statischen Dashboard-Cash-Testwert auf: Die synthetische Fixture wurde an die tatsächlich bestätigte Zahlung gekoppelt, die neue Erwartung enthält korrekt die zusätzliche CHF-120-Zahlung. Die erweiterte Replay-/Broadcast-Prüfung besteht für acht gleichzeitig geöffnete Verbraucher inklusive Kundenstatistik (`ledger-final.txt`). Ein anfänglicher exakter Tausender-Trennzeichenvergleich wurde auf zulässige typografische Varianten normalisiert; Währung, Betrag und Dezimalstellen bleiben exakt geprüft. Kalenderfixtures sind jetzt relativ zum tatsächlichen Schweizer Kalendertag, ohne Date.now und Timer zu verfälschen; zusätzliche 16 Kombinationen/Zeitrauminteraktionen bestanden (`calendar-final.txt`). Die ursprüngliche CI-Fingerprint-Abweichung entstand durch temporäre Inventarskripte; diese wurden entfernt und der erforderliche Fingerprint frisch erzeugt, der finale Gate blieb unverändert und bestand.

Beispiele der visuellen Nachweise: `light-320-_dashboard.png`, `dark-390-_kunden_customer-one.png`, `light-1440-_finanzen.png`, Zeitraum-Sheet und zugehörige DOM-/Computed-CSS-Dateien. Browser-Normalzustände sind keine pauschale Erfüllung aller visuellen V22.1-Kriterien. Exakte freigegebene Referenzparität, alle Alignment-/Divider-Zustände und alle mobilen Sheet-Wizards sind noch nicht abgenommen.

Die Bottom-Navigation bleibt in Markup, Access-/Display-/Scroll-Logik, Icons, Styles und transitiven Tokens unverändert. Beide vorhandenen Navigations-Vertragsprüfungen wurden frisch ausgeführt. Keine Nav-Regel wurde zur Behebung von Contentproblemen angepasst.

## Phasen, PRs und Release

| Phase | Beobachteter Stand |
|---|---|
| A | Vollständiges statisches Quell-/API-/Schema-Inventar und Requirements-Register; vollständige zustandsbezogene Root-Cause-Abnahme noch offen |
| B | Zentraler Tab-Owner erweitert; vollständiges Raster/Header/Section/Divider-Enforcement offen |
| C | Ein Statistik-Owner; Übersicht, Finanzen, Analyse und Kunden migriert; weitere geeignete Module offen |
| D | Durchgängige Kontextsuche über den Gesamtbestand, Filter-/Sort-Sheet und Headervertrag offen |
| E | Offizielle Normgrundlagen begonnen; fachliches Feldregister und vollständige Normabnahme offen |
| F | Vorhandene Sheet-/Wizard-Owner überprüft; sämtliche Geschäftsprozesse noch nicht migriert |
| G | Lesende Finanz-/Kundenprojektionen korrigiert und getestet; strukturierte Modell-/API-/Migrationsarbeit offen |
| H | Kundendetail-Statistik und Originaltabs; umfassende Detail-/Listen-/Prozesskonsistenz offen |
| I | Verbraucherbasierte Statistik-CSS-Bereinigung und Regressionstests; vollständiger Legacy-Cleanup offen |
| J | Kein Merge, kein Deployment, keine neue Live-Abnahme |

Relevante offene Arbeiten: PR #231 enthält Wizard-/Formularänderungen auf älterer Basis und ist nicht konfliktfrei integrierbar; Quelländerungen wurden abgeglichen, keine alten Testergebnisse als aktuelle Abnahme übernommen. PR #233 enthält PDF-Font-Follow-up, #222 ältere UX-/PDF-Arbeit, #214 CodeQL. Diese Arbeit überschreibt keine davon.

[PR #234](https://github.com/oemercam/binso_admin_azure/pull/234) bleibt ein Draft. Implementierungscommit `7fe2bfb00b5ce33ec276b16d779b9bcb10d68e04`; nachfolgende Änderungen betreffen QA-Fixtures und Nachweise, nicht den Produktcode. Der GitHub-Quality-Lauf `38046185491` bestand Plan/Checks/Build; die vollständigen Browserjobs und nachfolgenden Läufe werden gesondert nachgewiesen. Für einen Merge fehlen die offenen Implementierungen sowie fachliche und visuelle Endabnahme. Eine grüne Teilprüfung erlaubt keine Gesamtfreigabe. Echte iOS Safari-/Android Chrome-/installierte PWA-/OS-Tastaturtests sind in dieser Umgebung blockiert; WebKit-Binärdownload scheiterte. Kein Force-Push, keine Produktionsmigration, kein Secret-Commit.
