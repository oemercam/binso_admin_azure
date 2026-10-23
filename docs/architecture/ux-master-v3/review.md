# Master V3 — lokale Vorschau zur visuellen Freigabe

Stand: 23.10.2026. Quelle: [unveränderte Spezifikation](source.md), SHA256 `38a6141004ea1dd4e965e6b62a943e3e4307519d02301842478cec4984a29488`.

Umgesetzt sind die zentralen Komponenten und die ersten fünf Kunden-App-Seiten. Weitere Seiten, Admin-Routen und Landingpage warten auf Freigabe. Keine GitHub-Aktion, kein Push, Commit, Deployment oder produktive Migration in diesem UX-Auftrag.

## Tatsächliche Vorschau und Daten

Die Screenshots zeigen die regulären authentifizierten App-Routen und vorhandenen APIs auf `http://127.0.0.1:3100`. Die früheren `/dev/*`-Ansichten leiten im Entwicklungsmodus auf diese echten Seiten um. Kein separates Mockup.

Die Daten stammen ausschliesslich aus einer isolierten Testfirma in der lokalen Datenbank `binso_ui_test`: Profilvorname **Vorschau**, zwei Testkunden und drei bezahlte Testrechnungen. Sie sind keine produktiven Geschäftszahlen. Die vorhandene Fixture prüfte das bestehende Schema; keine Migration war nötig. Der lokale Starthelfer und synthetische Zugangsdaten liegen ausserhalb des Repositorys. Produktive E-Mail-/Billing-Konfiguration ist für diesen Prozess deaktiviert.

## Zentrale Änderungen

- Vorhandene CSS-Owner und Tokens: Inter, Seitenraster, Abstände, Karten, Felder, Typografie und semantische Diagrammfarben. Der neue Raster-/Tokenumfang ist auf die fünf Seiten und die bestehende Einstellungsfamilie begrenzt.
- AppShell: zentrale Headeraktionen; vorhandene Desktop-Popovers und mobile ActionSheets. Originales Binso-Logo auf den fünf Desktopseiten. Mobiles Dock und FAB verwenden unverändert ihre bestehenden Owner und Geometrievariablen.
- ListSearch: ein einziges sichtbares Lösch-X, natives Browser-X unterdrückt; Löschen behält den Eingabefokus. Auch die globale Suche und Einstellungssuche nutzen denselben Owner.
- Metric/MetricTile/CashOverview: gleiche Kartenhöhe und Baselines, CHF direkt beim Wert, echte Vorperiodentrends, neutraler Platzhalter ohne Vergleichsbasis. Lange Geldwerte verwenden die bestehende optionale kompakte Anzeige; exakter Betrag bleibt zugänglich.
- ListRow/RecordRow: kompakte Informationszeile, volle Navigationsfläche. Zeitdetails verwenden den vorhandenen FormSheet, einschliesslich bisheriger Prüfaktion.
- Toggle: bestehender zentraler Switch und vorhandene sichere Speicherhandler. Binäre Benachrichtigungen in einheitlichen Zeilen; keine Änderung an Consent, Reauth oder mehrwertigen Einstellungen.
- Einrichtung: nur bei fehlenden Pflichtangaben, Anzahl und zentraler schmaler Fortschrittsbalken, Link zum nächsten Pflichtfeld.
- Begrüssung: echter Profilvorname, bestehender Profilrequest und Locale, gespeicherte Zeitzone mit bestehendem Zürich-Fallback. Ein Timer bis zur nächsten Tageszeitgrenze, zusätzlich Fokus-/Sichtbarkeitswechsel; keine Profilabfrage im Hintergrund.

## Seiten-/Quellenmatrix

| Route | Anforderung | Bestehende Owner / Datenquelle | Ergebnis / Zustände / Nachweis |
|---|---|---|---|
| `/dashboard` | §§18–21,25 | `components/pages/dashboard.tsx`, `cash-statistics.tsx`, `setup-guide.tsx`, `lib/client/user-profile.tsx`; bestehende Dashboard-/Profil-/Finanz-APIs und Rollenfilter | Begrüssung → Zeitraum → vier KPIs → Pflichtaufgaben → echte Entwicklung → maximal drei letzte Rechnungen. Loading/Error/Null und vorhandene Rollen-Gates erhalten. Mobile/Desktop aufgenommen. |
| `/kunden` | §§15,17,19,22 | `components/pages/customers.tsx`, `records.tsx`, `customer-data-actions.tsx`; bestehende Kundenquery und Rechte | Mobile kompakte Suche/Filter, einzeilige ganze Kundennavigation; Desktop vorhandene Tabelle. Import/Archiv/Zusammenführen nur im Header. Suche und Aktionssheet tatsächlich geöffnet. |
| `/finanzen` | §§15,18–20,22 | `components/pages/finance.tsx`, `cash-statistics.tsx`, `report-actions.tsx`; bestehende Overview-/Report-APIs | Umsatz/Offen/Ausgaben/Überfällig, Zeitraum und Export synchron; bestehende PDF-/CSV-/Mail-/Linkfunktionen. Kein historischer Prozentsatz für aktuelle Forderungsbestände. Keine redundanten Überblick-Tabs. |
| `/zeit` | §§15,19,22 | `components/pages/time.tsx`, `timer-controls.tsx`, `records.tsx`, bestehende MonthlyTimeReport-/TimePriceSource-Formulare und Timer-/Zeit-APIs | Kompakte Zeit ohne Kreis; Start/Pause/Stop vor Zuordnung. Pflichtzuordnung, Speicherung, Freigabe und Rechnungsauswahl unverändert. Manuell über Plus; Rapport/Export im Header. Gespeicherter heutiger Eintrag und Details sichtbar. |
| `/einstellungen` | §§16–17,19,22 | `components/pages/settings.tsx`, `settings-navigation.tsx`, `setup-guide.tsx`; bestehende Profil-/Präferenz-/Benachrichtigungs-APIs | Zentrale Suche und kompakte Navigationsgruppen; vorhandene API-Switches. Profil/Sicherheit/Consent bleiben ihre vorhandenen sicheren Abläufe. Einrichtungspräferenz über Reload geprüft und wieder aktiviert. |

Alle fünf Seiten verwenden vorhandene Übersetzungsinfrastruktur. Neue Begrüssungen und kurze Labels sind DE/FR/IT/EN hinterlegt. Die tatsächliche visuelle Aufnahme erfolgte in DE; vollständige Fremdsprachenansichten sind damit nicht abgenommen.

## Aktionszuordnung und tatsächlich ausgeführte Prüfungen

| Funktion | Ort / Berechtigung | Tatsächlich nachgewiesen |
|---|---|---|
| Kundenimport / Archiv / Dubletten | Ein Header-…; bestehende fachliche Rollenprüfungen | Mobile ActionSheet öffnet alle drei bisherigen Aktionen. Kein Import, Merge oder Archivieren ausgeführt. |
| Finanzbericht | Header-…; bestehendes `reports:read` | Mobile Sheet und korrekt verankertes Desktop-Popover geöffnet. CSV über vorhandenen Downloadhandler erfolgreich. Zeitraum nach Wechsel 1 M → 6 M im Menü synchron, dann auf 1 M zurückgestellt. |
| PDF, Mail und Freigabelink | Unveränderte ReportActions-Handler | Erreichbarkeit im Menü geprüft. Kein Mailversand/Freigabelink erzeugt; tatsächliches PDF-Rendering hier nicht erneut geprüft. |
| Manuelle Zeit | Unverändertes blaues Plus | Vorhandenes Erfassungsformular geöffnet und geschlossen, keine zusätzliche manuelle Zeit gespeichert. |
| Monatsrapport | Zeit-Header-… | Vorhandenes Monatsformular öffnet nach dem Schliessen des Aktionssheets korrekt. Keine Einreichung. |
| Timer | Direkte Start/Pause/Stop-Ausnahme des Masters | Interne Administration gewählt; gestartet; pausierte 00:03:49 nach Reload erhalten; nach ausdrücklicher Nutzerfreigabe gestoppt. Gespeicherter Eintrag von gerundet 0:04 h auch nach Reload vorhanden. Details öffnen mit bestehender Aktion „Zur Prüfung“; nicht eingereicht. |
| Einrichtungshilfe | Switch in Einstellungen; vorhandene sichere Präferenz-API | Ausgeschaltet, Reload zeigt aus, wieder eingeschaltet. Keine sicherheitskritische Einstellung verändert. |
| Kunden-/Einstellungssuche | Zentrale ListSearch | Nichtleerer Text zeigt genau ein eigenes X, ein Klick leert vollständig, Fokus bleibt auf dem Suchfeld und Ergebnis wird zurückgesetzt. |

Der automatische Browserprüfer hatte den Timer-Speicherschritt zunächst wegen einer fehlenden ausdrücklichen Schreibfreigabe blockiert. Nach der Nutzerantwort „Ja, Testzeit speichern“ wurde derselbe normale UI-Schritt erfolgreich durchgeführt. Keine Umgehung.

## Trendnachweis

Im ausgewählten Fenster 01.–23.10.2026: 4’820 CHF Umsatz und Zahlungseingang. Gleich langer Vorzeitraum 08.–30.09.2026: 4’000 CHF. Anzeige `(4820−4000)/abs(4000)×100 = +20,5 %`. Im 6-Monatsfenster ohne nichtnull Vorbasis wird neutral „–“ angezeigt. Fehlende Quellen werden nicht als Null interpretiert. Offen/Überfällig bleiben aktuelle Bestände ohne erfundene historische Snapshots. Finanzabfragen, Aggregationsformeln, Währungs-/Tenant-/Statusregeln sind unverändert.

## Rendernachweise

[Lokale Messwerte](../../../../v3-evidence/measurements.json): alle fünf Routen bei 390×844 und 1440×900 ohne horizontalen Dokumentüberlauf. KPI Mobile zweimal zwei Karten je 104px Höhe; Desktop vier Karten je 107,1875px Höhe. Höhe und Baseline innerhalb jedes Rasters identisch.

Die geschützten Navigationselemente wurden vor/nach den zentralen Änderungen bei gleicher Mobilegrösse vermessen: FAB 44×44px, Kreis, RGB(37,102,189), Position x309/y716; Dock x0/y775, 375×69px, weiss. Identische Werte bei gleicher Scrollbarkonstellation. `navigation.css` unverändert. Unterschiedliche Seitenscrollleisten können die verfügbare Inhaltsbreite unterscheiden; kein Ersatz für echte Safe-Area-Gerätenachweise.

| Seite | Mobile 390×844 | Desktop 1440×900, vollständige Seite |
|---|---|---|
| Dashboard | [Bild](../../../../v3-evidence/dashboard-mobile.png) | [Bild](../../../../v3-evidence/dashboard-desktop.png) |
| Kunden | [Bild](../../../../v3-evidence/kunden-mobile.png) | [Bild](../../../../v3-evidence/kunden-desktop.png) |
| Finanzen | [Bild](../../../../v3-evidence/finanzen-mobile.png) | [Bild](../../../../v3-evidence/finanzen-desktop.png) |
| Zeiterfassung | [Bild](../../../../v3-evidence/zeit-mobile.png) | [Bild](../../../../v3-evidence/zeit-desktop.png) |
| Einstellungen | [Bild](../../../../v3-evidence/einstellungen-mobile.png) | [Bild](../../../../v3-evidence/einstellungen-desktop.png) |

Diese lokalen Bilddateien liegen bewusst ausserhalb des Quellcode-Repositorys. Der Next-Entwicklungsindikator ist in Aufnahmen sichtbar und gehört nicht zur produktiven App-Navigation.

## Gezielte technische Prüfungen

- ESLint aller geänderten TSX-/TS-Komponenten ohne Warnungen; nach abschliessenden Änderungen betroffene Dateien erneut geprüft.
- TypeScript `typecheck` erfolgreich.
- CSS-Architekturprüfung erfolgreich: vorhandene 14 Owner, keine zusätzliche Bibliothek oder routeneigene Styles.
- `ux-master-v3-test.mjs`: gleich lange inklusive Kalenderfenster, Null-/fehlende/negative Basis, endliche Werte, fachliche Trendrichtung; lokale Begrüssungsgrenzen und DST-Terminierung erfolgreich.
- `statistics-test.mjs`: vorhandene Aggregationen, SQL-/Tenant-/Datums-/Status-/Währungsfilter, Credits, Teilzahlungen, signierte Diagramme und DE/FR/IT/EN-Formatierung erfolgreich. Testharness um die neuen Darstellungshilfen ergänzt, keine Finanzassertion abgeschwächt.
- `git diff --check` erfolgreich. Keine Geschäfts-/DB-/Berechtigungsserverdatei und keine Navigation-CSS geändert.
- Kein vollständiger Build, keine vollständige Browser-/Rollen-/Testmatrix und keine Release-Abnahme ausgeführt.

## Offene Abnahmegrenzen

- Visuelle Nutzerfreigabe der fünf Seiten steht aus. Weitere Kunden-/Adminseiten und Landingpage bleiben zurückgestellt.
- Die V3-Datei gibt Textmasse/Komponentenregeln, jedoch keine vollständige pixelgenaue Screenbibliothek für alle fünf Zustände. Die ältere beigefügte englische Dashboardgrafik besitzt andere Inhalte und widerspricht in einzelnen Details den späteren V3-Regeln. Deshalb kein behaupteter pixelgleicher Soll/Ist-Vergleich bei identischen Geschäftsdaten. Die aktuelle Aufnahme ist die konkrete prüfbare Umsetzung von V3.
- Bisheriger 760/761px-Navigationsbreakpoint bleibt wegen der expliziten Navigationssperre bestehen; Abweichung vom vorgeschlagenen 768px-Tabellenwert ist offen dokumentiert.
- Tablet, 1920/2560/3840px, 200%-Zoom, Dark Mode, Safari/Edge, echte iOS-/Android-PWA mit Tastatur/Safe Area, alle Übersetzungslängen und sämtliche Fehler-/Readonly-/Offlinezustände wurden in diesem begrenzten Vorschauschritt nicht vollständig geprüft.
- Die echte Admin-Rollenansicht wurde hier nicht zur visuellen Abnahme geöffnet. Wiederverwendung zentraler Owner ist kein Beleg für die vollständige Admin-Mobile-/PWA-Abnahme.
- Bestehende rollenabhängige Links/Formulare und Gates bleiben erhalten; keine neue Funktions-/Berechtigungsabnahme für sämtliche Rollen.