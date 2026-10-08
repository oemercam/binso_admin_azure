# Final Visual UX Blueprint

Der Blueprint ergänzt UX-Master Ergänzung 3 in PR #217. PR #215 war bei Arbeitsbeginn bereits gemergt; Basis ist dessen Nachfolger mit PR #216. Vorher-Build für diesen Vergleich: `da59dbde9847b497e9bf0bf915fcee9b26a00a5a`. Originalreferenzen und PDF-/QR-Entscheidungen sind weiterhin in [ux-master-ergaenzung-3.md](ux-master-ergaenzung-3.md) dokumentiert.

## Ursache und Umsetzung

Die Startseite hatte zwei auseinanderlaufende Implementierungen, späte Schnellzugriffe und eine monatliche statt gesamte Kundenanzahl. Sie verwendet jetzt dieselbe API-basierte Darstellung im Tenant und Demo: vier Kennzahlen, Schnellzugriffe, Umsatzentwicklung, letzte Rechnungen und letzte Zahlungen. Es gibt keine künstlichen Diagrammwerte. Vier Kennzahlen stehen auf Mobile in zwei Spalten und auf Desktop in vier Spalten.

Finanzen hatte unmittelbar wirksame Zeitraum-Kurzfilter, eine Monatstabelle und redundante Listensteuerung. Der zentrale Zeitraumdialog übernimmt Änderungen erst mit „Anwenden“. Die drei/sechs Monate sind abgeschlossene Kalendermonate; eigene Zeiträume schließen den Endtag ein. Kennzahlen und echte Einnahmen-/Ausgabenbalken verwenden dieselben Grenzen. Offene Rechnungen sind periodenunabhängiger Bestand, nach Währung getrennt. Finanz-Tabs und bestehende Detailprozesse bleiben erhalten.

`DocumentSummaryRow` wird für Rechnungslisten und kompakte Zusammenfassungen wiederverwendet. Listen zeigen den offenen Betrag mit Kontext; Zusammenfassungen zeigen den Rechnungsbetrag. Datum und Status sind separat und lesbar. Rechnungsdetails haben Zahlungsfrist und einen eigenen Zahlungsstand; bei vollständiger Zahlung bleibt das Bezahldatum ohne offene Null-Kennzahl erhalten.

`ActionsMenu` verwendet dieselbe `ActionSheet`-Komponente wie die anderen Aktionen. Gemeinsame Zeilen statt Aktionskarten behalten Fokusführung, Escape und sichere Dialog-Schließung. Suchleisten ordnen Suche, kompakten Filter, Status-Tabs und Ergebnisinformationen in dieser Reihenfolge an.

Der Chat verwendete widersprüchliche feste/sticky Composer-Positionen und scrollte mit der Gesamtseite. Die Konversation ist jetzt ein Flex-Arbeitsbereich innerhalb des VisualViewport. Nur Nachrichten scrollen; Header und Eingabe bleiben sichtbar. Alte Composer-Höhen/Positionierungsregeln wurden entfernt, Navigation und andere globale Elemente nicht geändert.

Die heutige abgeschlossene Timerzeit folgt der aktuellen Kunden-/Projekt-/Intern-Auswahl und bleibt von der laufenden Zeit getrennt. Eintragsfilter und Sammelverrechnung gehören nur zur Eintragsansicht. Timerpersistenz, Pausen, genaue Minuten, eingeklappte Gruppen und die Formular-/Upload-Validierungen aus Ergänzung 3 bleiben erhalten.

Neue Größen und Oberflächen verwenden `app/styles/tokens.css`. `components/app-shell.tsx` und sämtliche Regeln der bestehenden Bottom-Navigation sind unverändert.

## Verbindliche Zielbilder

| Blueprint | Seite / Komponente | Nachweis |
| --- | --- | --- |
| 1 | AppShell, Inhaltsrahmen | Kein horizontaler Seitenüberlauf; unveränderte Navigation; Safe-Area-Abstände |
| 2 | `/dashboard` | Reihenfolge, vier Kennzahlen ohne Icons, 2/4 Spalten, vier Schnellzugriffe, zweizeilige Zusammenfassungen |
| 3 | `/finanzen` | Zeitraum-Sheet, vier echte Kennzahlen, Balkendiagramm, eine Rechnungssektion, Handlungsbedarf |
| 4 | gemeinsame RecordsView / Zeit | Suche und Filter gleiche Zeile, Status separat, Tab-Scroll ausschließlich intern |
| 5 | `/rechnungen` | Nummer/Status, Kunde/Datum, eindeutig beschrifteter offener Betrag, vollständige Zeilenlinks |
| 6 | `/rechnungen/[id]` | Positionen, MWST/Total, Zahlungsfrist und Zahlungsstand; Vorschau im Aktionsmenü |
| 7 | `/zeit`, Timer | Einheitlicher Timer in allen Zuständen; aktuelle Auswahl und heutige abgeschlossene Zeit |
| 8 | `/zeit`, Einträge | Kunde/Projekt-Gruppen starten eingeklappt, exakte Summen und bestehender Verrechnungsschutz |
| 9 | manuelles Zeitsheet | Fixer Header/Footer, eigener Inhalts-Scroll, Datum/Dauer/Kunde/Projekt/interne Tätigkeit/Beschreibung |
| 10 | `/mitarbeiter/[id]` | Status einmal neben Name, vier Tabs, kompakte Arbeitszeiten/Spesen, Dokument-Leerzustand |
| 11 | zentrale ActionSheet | Gleichmäßige Zeilen und Trennlinien, keine einzelnen Aktionskarten, Fokus/Escape |
| 12 | Erstellen/Bearbeiten | Eine primäre Formularaktion nach allen Feldern, gemeinsame Feldgrößen/Fokus/Validierung |
| 13 | `/support/[id]` | Nur Nachrichten scrollen; Header und Eingabe auch bei 400 px Höhe sichtbar |
| 14 | Integration / Regression | Geschäftsprozesse, CSS-Architektur, Build, Browsermatrix und GitHub Quality |

## Reproduzierbare Prüfung

`pnpm test` umfasst tatsächliche PostgreSQL-/RLS-Integration, Timer-/Rechnungs-/Teilzahlungs-/Verrechnungsschutz und Formular-/Dokumentprüfungen. Ergänzt: gesamte Kundenanzahl im Tenant, Kalenderjahresgrenzen und ein eintägiger eigener Finanzzeitraum.

Weitere lokale Checks: `pnpm release:check`, `pnpm lint`, `pnpm typecheck`, `pnpm css:check`, `pnpm build`, `pnpm security:scan`, `pnpm security:scan:all`. Der vollständige Audit verwendet nur die bereits dokumentierte befristete Dev-Tool-Ausnahme.

`scripts/ux-browser-test.mjs` rendert alle 46 bestehenden/ergänzten Routen bei 375/430/820/1024/1440 px in Light/Dark (460 Kombinationen). WebKit prüft zusätzlich 14 betroffene Routen bei 375/430/820 px in beiden Themes (84 Kombinationen). Interaktionen prüfen Zeitraum-Anwenden und Verwerfen, periodenunabhängigen Bestand, Gruppenminuten, Formulare/Sheets bei 400/568 px Höhe, Chat mit 30 Nachrichten, Fehler/Retry/Doppelklick und echtes PDF-Zoom-Verhalten. Unbehandelte API-Fixtures schlagen geschlossen fehl; diese Läufe schreiben keine Produktionsdaten.

Die isolierte Browser-Testversion ist auf Playwright 1.62.1 (WebKit 26.5) festgelegt. Jeder unabhängige Routenfall erhält eine eigene Seite: verspätete RSC-Vorladeanfragen der vorherigen Seite werden dadurch nicht bei einem harten Seitenwechsel abgebrochen. Wiederverwendete Seiten bleiben für die Navigations- und Geschäftsprozess-Interaktionen erhalten. Sämtliche Browserfehler werden weiterhin geprüft und nicht unterdrückt.

Die Quality-Workflow-Matrix enthält Dashboard, Finanzübersicht und Chat jetzt auch in WebKit. Screenshots und JSON-Ergebnisse werden als Workflow-Artefakt hochgeladen. Browsergeräteemulation wird ausdrücklich nicht als physische Geräteprüfung gewertet.

Für den Vorher-Build einen separaten Worktree am genannten Commit anlegen, den aktuellen Browser-Test kopieren und mit `BINSO_UX_BASELINE=1 BINSO_UX_MATRIX_ONLY=1` ausführen. Identische Fixture-Daten verwenden. `BINSO_UX_CAPTURE_ALL=1` erfasst zusätzliche Screenshots und neutrale Navigationsausschnitte. Bei 430 und 1440 px beide Themes erfassen für:

```text
/dashboard,/finanzen,/rechnungen,/rechnungen/RE-TEST-1,/zeit,
/mitarbeiter/employee-one,/mitarbeiter/neu,/support/ticket-one,
/projekte/neu,/kunden,/produkte,/angebote,/zahlungen
```

`python scripts/visual-blueprint-report.py BEFORE AFTER OUTPUT WEBKIT ANDROID` erstellt einen eigenständigen HTML-Bericht mit allen 13 Seiten und zusätzlichen Zuständen. Pillow prüft 22 Navigationsausschnitte pixelgenau (elf Ansichten × zwei Themes). Nur dahinterliegender Inhalt wird für die transparenten Navigationsflächen ausgeblendet; kein Navigationselement wird verändert. Fehlende Screenshots oder abweichende Navigationspixel verhindern die Berichtserstellung.

## Abnahmegrenze

Physische Mobile-Safari-, installierte iPhone-PWA- und Android-Abnahme mit nativer Tastatur, Installation und OS-Teilen ist hier nicht verfügbar. Sie bleibt offen. Gemäß Benutzerauftrag bleibt PR #217 Entwurf; Merge und Deployment sind erst nach vollständiger technischer und visueller Abnahme freigegeben. Es wurden keine produktiven Daten gelöscht oder produktiven Versand-/Zahlungsvorgänge ausgelöst.
