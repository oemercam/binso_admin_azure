# Zusammenhängende Codebereinigung und Microsoft-UX

## Arbeitsgrundlage und Grenzen

Gesamtbranch: `ux/final-microsoft-implementation`, ab aktuellem `origin/main`
`bcdacb1428c24c589f575a14e80f14a3c1ca59b2`. Die integrierten PRs #272–#277
bleiben erhalten. PR #277 wurde nach SHA-, Pflichtcheck-, Schutzregel-,
Mergefähigkeits- und Threadprüfung exakt für den freigegebenen Head
`04d98ae9e037f3b883cfc6a145d02c5b2fc67212` regulär integriert.
Main Quality 39056880051 (alle 14 Jobs) und CodeQL 39056879935 sind erfolgreich.

Bei Beginn dieses Gesamtauftrags waren nur #271 und Draft #267 offen.
`next.config.ts`, Workflows, Readiness, Production, RBAC/OIDC und Infrastruktur
werden nicht übernommen oder bearbeitet. Ihre Branches und der lokale
Sicherheitscommit `c1da9ebb` bleiben bestehen. Keine parallelen Agenten oder
Codex-Arbeiten in diesem Branch; keine laufende GitHub Action abgebrochen.
Kein PR je Unterbereich, kein automatischer Merge und kein Deployment.

Verbindlich bleiben das unveränderte Microsoft-Paket vom 15.10.2026 und die
neueren ausdrücklichen Entscheidungen. Bestehende 14 CSS-Owner und zentrale
React-Komponenten werden verwendet, keine zweite Foundation. Die bisherige
Bottom-Navigation wird nicht pauschal als Zukunftsvorgabe eingefroren; ohne
konkrete neue Navigationsreferenz bleiben ihre geprüften Verträge erhalten.

## Tatsächlich bereinigt

- Unreferenzierte `Divider`-/`Skeleton`-Renderer und `getModule` entfernt.
  Framework-Metadaten, Layout-Exports, Sicherheits-/Mail-/Storage-APIs und
  dynamisch getestetes `responsiveQrSvg` bleiben ausdrücklich erhalten.
- Sieben unbenutzte Demo-Tabellenexporte und zwei nicht verwendete Imports
  entfernt. Der tatsächlich benötigte Kundendemo-Fallback bleibt erhalten.
- 297 verwaiste Selektorvorkommen an acht bestehenden CSS-Ownern entfernt.
  Aktive TS/TSX/JS/MJS-Quellen einschliesslich Tests und dynamischer Präfixe
  wurden geprüft. Vier verbleibende logische Selektoren haben ebenfalls einen
  nachweislich nicht erzeugten positiven Vorfahren und entfallen. In einer `:is`-Liste
  entfällt nur die tote Alternative; alle Alternativen besitzen dieselbe
  Einzelklassenspezifität, die aktive Kaskade bleibt daher gleich. Der Nachweis
  listet jede Entfernung und diese begründete Umschreibung:
  [Selektoren/Exporte](final-ux-retirements-20261017.json).
- 16 identische, später nochmals gesetzte Deklarationen entfernt; Media-Kontexte,
  Selektorspezifität und verbleibende Reihenfolge bleiben erhalten. Keine
  unterschiedlichen Werte oder progressiven Fallbacks pauschal zusammengelegt.
  [Deklarationsnachweis](final-ux-css-deduplication-20261017.json).
- Die beiden Demo-Rechnungs-PDFs in `public/demo` bleiben erhalten. Der erste
  Bereinigungslauf hatte ihre dynamisch zusammengesetzte Verwendung in der
  Abonnement-Demo übersehen; die CI-Vorschauprüfung deckte diesen Fehler auf.
  Beide Originaldateien wurden exakt aus Main wiederhergestellt. Eine neue
  Regression leitet Pfade und Rechnungsnummern aus der tatsächlichen UI ab und
  prüft vorhandene einseitige PDF-Dateien sowie fehlende/falsche Assets.
- Originalbranding, PWA-/Kompatibilitätsicons, Fontlizenz, PDF-Fonts und verwendete
  Produktcaptures bleiben erhalten. Datierten Audits/Referenzen wird keine neue
  Anweisungspriorität gegeben; historische Evidence wird nicht gelöscht.

## Zentrale UX-Korrekturen

Späte mobile Regeln überschrieben die vorgesehene Touchgrösse wieder mit 40 bzw.
36 px. Eine neue Messprüfung scheitert gegen den vorherigen Build tatsächlich.
Die konkurrierenden Regeln entfallen; die vorhandenen Header-Owner verwenden
`--touch`. Desktop-Iconbuttons verwenden den vorhandenen Desktop-Aktionstoken
ohne Änderung ihres Desktopmasses. Bottom-Nav-Quellen und Hashverträge unverändert.

Die Zeiterfassung verwendet jetzt `ListSearch`, `IconButton`, `FormActions` und
`TimeEntryGroup` im bestehenden Records-Owner statt eigener paralleler Wrapper.
Der Filter gibt seinen tatsächlichen Dialog-/Expanded-Zustand über ARIA weiter.
Gruppenschlüssel, Minutenaggregation, Status, Rollenentscheidungen, Auswahllogik,
API-Aufrufe, Replay-/Doppelklickschutz und Recovery bleiben in der Fachlogik.
Unerreichbare Wochen-Demozweige samt sechs alten Styles entfallen.

Der französische SSR-Negativnachweis zeigte ausserdem, dass Zeitgruppen echte
Kunden-/Projektnamen wie „Rechnungen“ übersetzten. Der zentrale Gruppenrenderer
unterscheidet jetzt explizit Verbatim-Namen von UI-Fallbacks. Der echte Aufrufer
setzt die Kennzeichnung nur bei vorhandenen Datennamen. Der neue Test war vorher
rot und ist danach grün; Fallback-Beschriftungen werden weiterhin übersetzt.

Auch die übrigen 13 identischen Sheet-Footer in zehn Dateien verwenden jetzt
`FormActions`: Shell, Sheet-Renderer, Dokumente, Kunden, Spesen, Projekte,
Berichte, Einstellungen, Statistik und Teamverwaltung. Mit den drei Zeit-Footern
sind das 16 migrierte Stellen. Eine verstärkte zentrale Lint-Regel verhindert
neue native Kopien von Sheet- und Seiten-Footern; bestehende Page-/Wizard-Footer
verwendeten bereits die zentrale Komponente. Kinder, Handler, Busy-/Write-Sperren
und die tatsächliche `div`-/CSS-Struktur bleiben erhalten.
Ein AST-Vergleich mit der festen Main-Basis bestätigt für alle 16 Stellen die
exakt gleichen Kinder, Handler, übrigen Attribute und Sheet-/Seiten-Semantik.
Der [Migrationsnachweis](final-ux-footer-migration-20261017.json) nennt die Dateien.

Neue Browserprüfungen bedienen Suche, Gruppen per Enter/Space, Filterdialog und
Fokusrückkehr. Absichtlich falsche Expanded-Werte und verkleinerte Header-Ziele
müssen scheitern. Die vorhandenen Zeit-, Abrechnungs-, PDF-, Entwurfs- und
Navigationsregressionen bleiben aktiv. Keine Baselines oder Assertions reduziert.

## Bereichsübergreifende Abnahme

Die vorhandenen zentralen Implementierungen werden über alle Routenfamilien
geprüft; bereits passende Seiten werden nicht aus kosmetischen Gründen neu gebaut.

| Bereich | Bestehende zentrale Verantwortung / wesentliche Nachweise |
| --- | --- |
| Dashboard / Finanzen / Diagramme | CashOverview/Statistik-Owner; echte Aggregation, Negativwerte, Zeiträume, Ring/Legende |
| Kunden / Kontakte / Dossier | Records/DetailSections; rollenabhängige Finanzdaten, Kontakte, Dateien, Retry/Read-only |
| Angebote / Rechnungen / Zahlungen | Dokument-/Payment-Owner; Entwürfe, Annahme, Restbetrag, Mahnung, QR/PDF und Replay |
| Projekte / Dienstleistungen / Produkte | Gemeinsame Listen/Forms; echte Status-/API-/Entwurfsabläufe |
| Zeit / Mitarbeiter / Spesen | Zentrale Gruppen/Zeilen/Forms; Gruppierung, Freigaben, Verrechnung, Upload und Wiederaufnahme |
| Support / Chat | Gemeinsame Sheets, MessageBubble, Tastatur-/Scroll-/Composer-Verhalten |
| Einstellungen / Profil / Team | SettingsGroup, Controls, Validierung, Rollen-/Read-only-Zustände |
| Auth / MFA / Registrierung | Gemeinsamer Auth-Owner; Code-/Recovery-/Session-/Sprachzustände |
| Operator / Admin | Bestehende Operator-Owner, API-basierte Rollen-/Statusfixtures; kein reales Entra-SSO simuliert |
| Öffentlich / Recht / System | Marketing-, Legal-, Error-/Loading-Owner; Referenzgestaltung und Schutz-/Fehlerzustände |

Originalreferenzen und tatsächlich gebaute Ansichten werden bei 390/1440 px
gegenübergestellt. Vorher-Aufnahmen liegen lokal in `ux-final-before`, die
Referenzrenderings in `ux-next-reference`/`ux-navigation-reference`. Dunkle,
schmale, zusätzliche fachliche und nicht im Original dargestellte Operator- und
Fehlerzustände sind **abgeleitet** und keine separate visuelle Inhaberfreigabe.
Synthetische UI-Fixtures sind keine produktiven Daten. Physische PWA-/Geräteabnahme
und tatsächliches produktives SSO werden nicht durch Browseremulation behauptet.

## Korrigierte Messrace bei animierten Formularen

Der breite Chromium-Lauf fand bei einem 44-px-Feld einen DOMRect-Wert von
43.999969482421875 px. Eine isolierte Reproduktion der vorhandenen Translation
liefert bei unveränderter CSS-Höhe 44 px ebenfalls gerundete Zwischenwerte
(zum Beispiel 43.999996185302734); nach Animationsende beträgt die Höhe exakt 44.
Die Geometrieprüfung wartet deshalb jetzt auf abgeschlossene endliche Animationen.
Keine Animation wird abgeschaltet, keine Rundung/Toleranz akzeptiert und die
bestehende exakte Höhenassertion bleibt erhalten. Eine pausierte endliche
Animation muss den neuen Negativtest blockieren; abgeschlossene endliche Motion
besteht. Endlose Fortschrittsanimationen laufen unverändert weiter und blockieren
nicht die Layoutabnahme. Der bestehende negative 18-px-Touchzieltest bleibt aktiv.

## Prüfstand während der Gesamtarbeit

Lint, Typecheck, Build und gezielte Architektur-/UX-Verträge erfolgreich.
18 Zeit-Routen-/Theme-/Viewport-Fälle und die vollständigen Zeit-Interaktionen
bestanden vor der anschliessenden übergreifenden Bereinigung.

Die vollständige lokale Skriptsuite wird ohne Abbruch nach einem Einzelfehler
protokolliert. Eine prozesslokale Git-Bash-/Python-Pfadbrücke ausserhalb des Repos
führt die unveränderten Bash-Prüfungen auf Windows aus. Die bereits vorgesehene
In-Memory-Scannerprüfung verwendet jetzt eine synthetische Unix-Adresse und
behält alle Protokollassertionen; ein zusätzlicher Windows-Pfad-Negativfall ist
enthalten. Das ist weder ein echter Unix-Socket- noch ein Antivirusnachweis.

Der POSIX-Dateieigentümer-/Rechtemodus-Nachweis in `file-rescan-test.mjs` ist
unter Windows wegen fehlendem `process.getuid()` nicht vollständig ausführbar.
Die Prüfung bleibt unverändert, wird nicht als bestanden gewertet und benötigt
den bestehenden Linux-Gate. Keine POSIX-Rechte emuliert und kein Gate deaktiviert.

Die volle Chromium-/WebKit-Matrix läuft in begrenzten lokalen Breiten-Batches,
mit denselben Timeouts, beiden Themes und allen `fullRoutes`; die abschliessende
Interaktionssuite bleibt vollständig. Der erste überparallelisierte lokale Lauf
mit 14 Ansichten endete im Navigationstimeout; kein Anwendungsfehler daraus
abgeleitet und keine Assertion verlängert oder ausgeschaltet. Endgültige
Ergebnisse, verbleibende Fehler und der einmalige Integrations-PR werden nach
Abschluss hier ergänzt. Noch keine vollständige Abnahme behauptet.

## Kontrollierter Stopp auf Benutzerauftrag

Der Gesamtauftrag wird vor vollständiger Abnahme beendet. Entwicklungsbranch:
`ux/final-microsoft-implementation`. Sämtliche bisherigen Codeänderungen sind
bereits im lokalen Commit `7ad8e9dcc8f892c2d8d1ded7557ad4a42bb4bd1b` und seinen
vorherigen drei Arbeitscommits gesichert; der Arbeitsbaum war vor diesem
Dokumentationsnachtrag sauber. Dieser Nachtrag wird separat lokal committed.

Implementiert: nachgewiesene Export-/Demo-/Asset- und CSS-Bereinigung,
16 zentrale FormActions-Footer, zentrale Zeitgruppen/Suche/Filter,
44-px-Headerziele, unveränderte Kundennamen bei Übersetzung sowie die
Animations-Stabilisierung der weiterhin exakten Browser-Geometrieprüfung.
Geschäftslogik, Sicherheitskontrollen und offene PRs #267/#271 bleiben erhalten.

Verifiziert: Lint, Typecheck und lokaler Build; 42 von 43 lokalen Skriptprüfungen
bestanden. Die unveränderte POSIX-Dateirechteprüfung benötigt Linux und ist kein
lokaler Pass. Betroffene Foundation-/UX-Verträge und die neue positive/negative
Header-/Animationsregression bestanden. Frischer Build:
`27cfiXXA_0Psjvj5HMYIQ`. Im abschliessenden Chromium-Lauf waren beim letzten
bestätigten Zwischenstand alle 170 Fälle bei 320 px (85 Routen, beide Themes)
bestanden. Weitere teilweise ausgeführte Fälle zählen nicht als Gesamtabnahme.

Offen: restliche Chromium-Matrix und Interaktionen, vollständige WebKit-Matrix,
abschliessender Referenzvergleich sowie die im seriellen Abschlusslauf noch
vorgesehenen PWA-/Lade-/Registrierungs-/Sprach-/Komponenten-Lab-Prüfungen.
Frühere einzelne Teilprüfungen ersetzen diesen offenen Gesamtabschluss nicht.
Linux-Pflichtprüfungen, abschliessende visuelle Bewertung und der einzige
Integrations-PR sind noch ausstehend. Keine vollständige UX-Abnahme behauptet.

Die eigenen umfangreichen lokalen Testprozesse werden nach dieser Sicherung
kontrolliert beendet. Vorhandene Logs, Screenshots, Hilfsskripte und Teilresultate
bleiben im Workspace ausserhalb des Repositories erhalten, insbesondere unter
`ux-final-acceptance-27cfiXXA_0Psjvj5HMYIQ` und
`ux-final-sharded-chromium-27cfiXXA_0Psjvj5HMYIQ`.
Kein Push, neuer PR, Merge, Deployment oder Verwerfen von Änderungen.

## Fortsetzung: CI-first auf demselben Gesamtbranch

Auf ausdrücklichen Folgeauftrag wird derselbe gesicherte Branch fortgesetzt;
keine neue Gesamtanalyse und keine umfangreichen lokalen Browserläufe.
`origin/main` wurde erneut abgeglichen: keine fehlenden Main-Commits, alle fünf
bisherigen lokalen Arbeitscommits bleiben erhalten. Die offenen PRs #267 und
#271 sind unverändert und werden nicht integriert. Der fachliche Gesamtumfang
bleibt erhalten; CI-first ändert ausschliesslich den Ausführungsort der breiten QA.

| Bereich | Übernommener beziehungsweise ergänzter Stand |
| --- | --- |
| Microsoft-UX / Standardisierung | Bestehende zentrale Foundation und jüngst integrierte Bereiche übernommen; zentrale Footer, Zeitgruppen, Suche/Filter und Headerziele wie oben implementiert. |
| Legacy / Codebereinigung | Nachgewiesene Exporte, Demo-Daten, Assets, verwaiste Selektoren und redundante Deklarationen entfernt; Nachweisdateien bleiben verbindlich. |
| Startanimation | Vorhandener AppStart mit originalem `/brand/icon-black.svg`, readinessgesteuertem Ende und Reduced-Motion-Regel bleibt erhalten; kein künstlicher Starttimer. |
| Light / Dark / System | Bestehender gemeinsamer Resolver vor erstem Paint, Systemwechsel-/Storage-Synchronisierung und Theme-Persistenz bleiben erhalten. |
| Navigation / Laden | Persistente Shell, bestehende Session-Deduplizierung, gezielte Dateninvalidierung und Session-Fences übernommen; keine neue Navigation oder zweite Foundation. |
| Refresh-Zustand | Nachgewiesenen Fehler in useApiQuery korrigiert: manueller/periodischer Retry zählt jetzt als neuer Ladeversuch, ohne dieselben Session-Daten vorzeitig zu verwerfen. |

Die neue Regression führt den tatsächlichen Query-Hook mit kontrollierten
Effekten und verzögerten Antworten aus. Vor der Korrektur scheiterte sie an
`Manual refresh exposes its pending attempt`. Sie prüft zusätzlich Fehler/Retry,
überholte Antworten, Sichtbarkeit/Offline, Mandantenwechsel und Pfadwechsel.
Keine API-, Berechtigungs-, Session-Laufzeit- oder fachlichen Schreibänderungen.

Die vollständige Browser-/Linux-/Quality-/CodeQL-Abnahme wird im einzigen
Integrations-PR ausgeführt. Historische lokale Teilresultate sind keine grüne
Gesamtabnahme des neuen Heads. Fehlende Referenzzustände (insbesondere Dark und
zusätzliche Operator-/Fehlerzustände) bleiben abgeleitet; physische Geräte,
produktives SSO und Infrastruktur-Nachweise werden nicht behauptet.
Kein automatischer Merge und kein Produktivdeployment.


## CI-Korrektur: dynamisch referenzierte Demo-PDFs

Im ersten gemeinsamen CI-Lauf scheiterten Chromium und WebKit beim Warten auf
den PDF-Canvas der Demo-Abrechnung. Ursache waren die zuvor fälschlich als
unbenutzt entfernten zwei PDF-Dateien. Die Anwendung bildet deren Pfade aus
dem Rechnungsdatum; die Originalbytes sind wiederhergestellt. Der bestehende
Dokumenttest überprüft jetzt die tatsächlichen JSX-Daten und den tatsächlichen
URL-Ausdruck, PDF-Seitenzahl/Rechnungsidentität sowie negative fehlende und
nicht-PDF-Antworten. Der gezielte lokale PDF-Test ist erfolgreich. Keine
Browserassertion oder Wartezeit geändert. Andere laufende Actions werden nicht
abgebrochen; die Korrektur wird im selben PR nach deren Abschluss geprüft.
