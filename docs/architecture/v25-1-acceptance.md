# V25.1 – Korrekturen und Abnahme

Basis: Main `eb21e4d4cea579bf16e452e4dea8a87bc53405a5` (ausgeliefertes V25).
Auftrag: [V25.1](v25-1-requirements.md). Bestehende [Routen-/Owner-Matrix](v25-audit.md), [Einstellungszuordnung](v25-settings-matrix.md) und generierte Inventare werden weiterverwendet. Kein zweites Inventar und keine neue Foundation.

## Nachgewiesene Ursachen

| Bereich | Ursache / betroffene Owner | Korrektur / erhaltener Stand | Nachweis |
| --- | --- | --- | --- |
| Ringdiagramme | `statistics.tsx` setzt Betrag und Beschriftung in ein fest begrenztes Ringzentrum; `analytics.css` kann grosse Beträge nur umbrechen | Vollständiger Betrag und Label ausserhalb des Rings, schmale Ansichten stapeln die Legende; keine Kürzung oder Berechnungsänderung | statistics-test: echter Renderer, grosse Beträge, ungültige Zusammensetzung; responsive Browsergeometrie |
| Auswahlmenüs | `select-control.tsx` positioniert mit 320px angenommener Höhe statt tatsächlichem Inhalt; Sheet-Scroll verschiebt den Trigger | `select-geometry.ts` berücksichtigt Inhalt, sichtbaren Viewport, Tastatur und Scroll; gemeinsame Maximalhöhe bleibt erhalten | ui-foundation: kurze/lange Menüs, oben/unten, versetzter Keyboard-Viewport; app-select-browser: echte Popup-Grenzen |
| Formular-/Filterabstände | `.bottom-sheet .form-field{margin:0}` ohne Abstand zwischen direkten Geschwistern | Gruppenabstand im gemeinsamen `overlays.css`; bestehende Form-Grid-Abstände erhalten | responsive Filter-/Formprüfungen, Abstandsregression der Kundenerfassung |
| Sheet-Leerraum | Vollhöhe für jeden Wizard und expanded FormSheet unabhängig von Inhalt | Inhalt bestimmt Höhe bis zur vorhandenen Viewport-Grenze; scrollbarer Body und erreichbarer Footer bleiben erhalten | Registrierung/Kunden/Wizard-/Keyboard-Browserregressionen |
| Firmenlogo | Sichtbares natives File-Input, keine Grössenprüfung vor Auswahl, keine Vorschau im Editor | `FileUpload` verwendet Input/Button/Field, Vorschau, Ersetzen/Entfernen, lokale Prüfung, Busy-/Fehleranzeige; vorhandene File-API und Scan-Gates bleiben verbindlich | echte Komponenten-Callbacks für Typ/Grösse/Leere/Read-only; Browser: Quarantäne, Ausfall, sauberes Upload und Formularabstände |
| Berichte | Separater Exportbutton, rohe h2 statt SectionTitle | CSV im bestehenden ActionsMenu, gemeinsame Abschnittstitel; Export, Fehler und Replay-Sperre erhalten | Browser: fehlgeschlagener Export und erfolgreicher deduplizierter Download; bestehende CSV-/Rollenprüfungen |
| Asynchrone Menüaktionen | Erster CI-Lauf belegt Doppelklick-Durchfall auf die unterliegende Zurück-Navigation, weil ActionsMenu sofort schliesst | Gemeinsames Menü bleibt während `busy` modal und schliesst nach dem Vorgang; keine künstliche Grünsetzung | Tatsächliche ActionsMenu-Zustandsübergänge im app-workspace-Test; unveränderte Doppelklick-/Download-/Routenerwartung im Browser |
| Zeiterfassung | Zuordnungsfelder stehen im DOM vor Status, Zeit und Steuerung | Timeranzeige/Steuerung zuerst, Zuordnungen danach; Speicherung und Rollenlogik unverändert | Timer-/Entwurfs-/Monatsreport-Browserregression; gezielte Reihenfolgeprüfung |
| Benachrichtigungen | Abschnitt wiederholt Seitentitel | Abschnitt benennt Zustellung; unabhängige E-Mail-/Push-Toggles und Speicherwege bleiben erhalten | vorhandene Lokalisierungs-/Einstellungs-/Rollenprüfungen |

## Bestehende zentrale Verträge

- Formulare: `ui.tsx` mit Field/Input/Select/DateInput/CurrencyInput, Feldfehlern, Beispielen und Disabled-Zuständen. Beispiele sind keine gespeicherten Werte. Native Datumseingaben bleiben wegen der verlässlichen mobilen Bedienung erhalten; Browser-Picker sind kein selbstgestalteter App-Dialog.
- Listen/Details/Kunden: RecordsControls/RecordsView, DetailHeading/DetailTabs und gemeinsamer Status-Renderer; Kundenfirma mit Pflichtkontakt, Privatkunden und atomare Speicherung aus V25 bleiben erhalten. Kein neues Datenmodell und keine Migration.
- Aktionen/Leerzustände: bestehende ActionSheet/ActionsMenu und kompakter EmptyState. Primäre Formular-, Wiederholungs- und Timeraktionen bleiben direkt erreichbar. Kein Zeilen-Clipping von Sicherheitsmeldungen.
- Einstellungen: bestehender SettingsNavigation-Katalog und SettingsGroup; persönliche/unternehmensbezogene API-/Rollen-Owner bleiben getrennt. Mehr bleibt eine einfache Liste. Keine Zusammenführung allein wegen ähnlicher Bezeichnungen.
- Chat: bestehende `use-workspace-viewport.ts`, Thread-Messages und einzeilig wachsendes Textarea; Browser-/PWA-Tastatur-Nachweise bleiben geräteabhängig. Keine neue Chat- oder Navigationsimplementierung.
- Navigation und blauer Plus-Button: Gestaltung, Position und Funktion unverändert; bestehende Contract-/Geometrieprüfungen bleiben aktiv.
- CSS: Änderungen ausschliesslich in den vorhandenen Komponenten-Ownern; keine Route-CSS, keine `!important`-Ausnahmen, keine pauschale Löschung responsiver Selektoren.

## Fachliche Finanzdefinitionen (unverändert)

| Kennzahl | Quelle und Zeitbezug | Abgrenzung |
| --- | --- | --- |
| Zahlungseingänge | Zugeordnete, nicht archivierte Zahlungen am Zahlungsdatum; Finanzanalyse berücksichtigt Rückerstattungen gemäss bestehendem Ledger | Kein Rechnungsvolumen und kein Bankkontostand |
| Ausgaben Finanzanalyse | Nachgewiesene Auszahlungen aus dem zentralen Cash-Ledger | Unvollständige Auszahlungsdaten werden gekennzeichnet |
| Zahlungssaldo | Einnahmen minus nachgewiesene Auszahlungen im gewählten Zeitraum | Kein vollständiger Cashflow, Gewinn oder Kontostand |
| Forderungen | Zentraler Financial-Snapshot zum angegebenen Stichtag; bestehende Teilzahlungs-/Gutschriftregeln | Bestandswert, kein Zeitraumumsatz |
| Berichte Kunden/Aufträge/Mitarbeiter | `repositories/reports.ts`: aktueller nicht archivierter Bestand; neue Kunden separat im Zeitraum | Kein Vermischen mit Zeitraum-Summen |
| Berichte Zeit/Zahlungen/Spesen | Arbeitsdatum, Zahlungsdatum bzw. tatsächliches Erstattungsdatum innerhalb des Berichtszeitraums | Spesenerstattungen sind nicht sämtliche Betriebsausgaben |

Nicht freigegebene Module liefern im Report `null` und werden nicht als Nullwerte dargestellt. Leere berechtigt gelesene Mengen sind von Ladefehlern und fehlenden Quellen getrennt. Die bestehenden echten PostgreSQL-Statistiktests prüfen Tenant, Zeitraum, Teilzahlungen, Gutschriften, Zahlungsbestand und Zeitzonen. Kein festgestellter Berechnungsfehler wird als Darstellungsänderung verdeckt.

## Prüfstatus und Grenzen

Lokal erfolgreich: Lint, Typecheck, Produktionsbuild, ui-foundation (einschliesslich Popup-/Upload-Gegenfällen), statistics-test mit echten PostgreSQL-Metrikabfragen, Lokalisierungsabdeckung, task-focused-ux, navigation-contract, app-workspace, foundation-integration und ux-contract. GitHub-Quality/CodeQL und die Browsermatrix prüfen den Integrationscommit; ihr aktueller Status wird im PR dokumentiert. Ein früherer V25-Erfolg gilt nicht automatisch für V25.1.

Im V25.1-Anhang sind keine tatsächlichen iPhone-Bilddateien enthalten. Konkrete Screenshot-Abweichungen ohne Route/Zustand/Viewport bleiben deshalb fehlende Evidenz. Die Diagnose oben stützt sich auf die tatsächlichen Komponenten; sie behauptet keine Sichtprüfung unbekannter Screenshots.

Physische iPhone-Safari-/iOS-PWA-Startup-, Tastatur-, Browserleisten- und Safe-Area-Abnahme bleibt offen. Chromium-/WebKit-Emulation und eine Quellmatrix sind keine vollständige Geräte- oder Sichtabnahme aller Zustände. Fehlende Originalreferenzzustände und Dark/Operator bleiben abgeleitet. Kein Merge oder Deployment aus dieser Implementierungsfreigabe.
