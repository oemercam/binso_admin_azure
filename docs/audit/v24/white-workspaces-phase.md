# Weisse Arbeitsbereiche – Implementierungsphase

Ausgangsstand: `116ad260d98123b433449f5d53f47f64b09827c5` (Main, PR #255). Arbeitsbaum vor Beginn sauber. Branch: `ux/v24-white-workspaces`. Keine erneute ZIP-Sicherung als Voraussetzung. Git-Bundle der Ausgangshistorie war bereits geprüft; kein produktiver Datenbank-/Infrastruktureingriff in dieser Phase.

## Verbindlicher Auftrag

[Neuer Auftrag](white-workspaces-request.md), vom Nutzer am 15.10.2026 beigefügt. Seine konkreten Designentscheidungen haben Vorrang vor älteren widersprüchlichen Gestaltungsanforderungen. Weisse Grund-/Header-/Inhaltsflächen im Light Mode; dezente blaue Aktionen und Zustände; separate konsistente Dark-Variante; eigenständige Desktop- und mobile Bedienung. Die bestehende mobile Bottom-Navigation bleibt geschützt.

Die Referenzen wurden nach dem ersten Foundation-Paket im Gesprächskontext und anschliessend als aktuelle Datei `binso-one-ux-referenzpaket.zip` gefunden (15.10.2026, 19:35 UTC). `reference/IMPLEMENTIERUNG.md` wurde zuerst gelesen; die vier zugehörigen HTML-Ansichten liegen unverändert unter `reference/`. Microsoft-Variante ist verbindlich. Dark Mode und vollständige Adminansichten sind laut Paket noch nicht visuell freigegeben. Exakte Referenzparität wird ohne Browservergleich nicht behauptet. Anforderungen des gesamten V24 bleiben offen, bis sie individuell nachgewiesen sind.

## Ursachen und zentrale Korrekturen

| ID | Ursache | Korrektur | Status |
| --- | --- | --- | --- |
| WHITE-001 | Mobile gruppierte Flächen beziehen Grau aus `--app-surface` und `--app-chrome` | Bestehende Light-Tokenwerte weiss; Dark-Werte und Navigation/Glass-Token unverändert | implementiert; Browser offen |
| WHITE-002 | Desktop-Linkzustände verwenden Schwarz/Invers bzw. Unterstreichung | Gemeinsame blaue Akzentfläche und Akzenttext in vorhandenen Styles | implementiert; Browser offen |
| WHITE-003 | Desktop-Shell hat keinen Einklappzustand | Gemeinsamer Desktop-Navigationshook und Button; standardmässig offen, gespeicherte manuelle Auswahl, Speicherfehler toleriert, `aria-expanded`/`aria-controls`, zugängliche Iconleiste; nur ab 1101 px | implementiert; Browser offen |
| WHITE-004 | Benachrichtigungen bieten weiterhin eine separate Massen-Leseaktion | Aus Headerpanel und Übersichtsseite entfernt; Öffnen markiert den einzelnen Eintrag weiterhin gelesen | implementiert; Browser offen |
| WHITE-005 | Gemeinsamer Ring enthält keinen zentralen Wert-/Labelblock | Gemeinsamer geometrisch zentrierter Innenblock; Legende und Tastatur-/Detailinteraktionen erhalten | implementiert; Browser offen |
| WHITE-006 | Globale Desktop-Suche steht links | Suche zusammen mit Timer/Glocke/Profil rechts; Einklappsteuerung links | implementiert; Browser offen |

Die weissen Eingabeflächen benötigen eine sichtbare Abgrenzung: der gemeinsame mobile Suchfeld-Owner verwendet die bestehende Control-Border statt transparent. Gemeinsame Primärbuttons nutzen Akzent und kontrastierenden Theme-Text; die vorhandene runde Erstellen-Aktion behält ihren eigenen unveränderten Invers-Owner.

Entfernte Altlasten: zwei UI-Massen-Leseaktionen und ihre unbenutzten Handler/Props; keine API gelöscht. Keine neue Foundation, keine neue Bibliothek, keine lokalen Seiten-CSS-Dateien. Die vorhandene Seitenmatrix wurde aus dem AST aktualisiert; das ist kein Laufzeitnachweis.

## Prüfungen

- Frozen Install mit projektgebundenem pnpm 10.17.1 erfolgreich. Vorinstalliertes pnpm 11 verursachte einen Konfigurationskonflikt; Lockfile blieb unverändert.
- Fast-QA einschliesslich TypeScript, UX-Vertrag, Regression, Theme/Glass, Foundation, Navigations- und CSS-Architektur sowie QA-Plan auch nach der letzten Desktop-Suchpositionierung bestanden.
- Separater unveränderter Navigation-Contract bestanden: keine Referenzregeneration.
- Finaler Produktionsbuild, vollständiger ESLint, Statistiktests, Repository-/Dokumentations-/Releasechecks und Dependency-Audit bestanden; keine bekannten produktiven Dependency-Schwachstellen. Lokales HTTP-Gate ebenfalls bestanden: 57 Routen, fünf Stylesheets, Demo-Flow und Theme-/Storagezustände.
- Neues Browsergate prüft weisse Flächen, Desktop-Einklappen/Rückgewinnung der Breite/Storage und geometrische Ringzentrierung. Der bestehende Flächentest wurde wegen der expliziten neuen Weiss-Vorgabe von Grau auf Weiss geändert. Keine Screenshotreferenz erneuert.
- Lokaler vollständiger Testlauf der Ausgangsbasis scheitert unverändert im Scanner-Test an `listen EPERM`. Keine Prüfung deaktiviert.
- Lokale Browserinstallation scheitert am Download/Entpacken des Chromium-Archivs. Kein Browser-/Gerätenachweis dieser Phase.

Der Token-Snapshot und der zentrale UX-Vertrag enthalten die neue schriftliche Weiss-/Desktop-Vorgabe; ältere graue Snapshotwerte sind ersetzt. PR #256, Implementierungscommit `e480261b8088f67e5cb144982ac9b1b2939ccdf4`: GitHub Quality/CodeQL laufen. Browser werden für den Draft gemäss bestehendem Workflow zurückgestellt und nicht als bestanden gewertet.

## Verbleibender Umfang

Gesamtauftrag nicht abgeschlossen. Offen sind tatsächlicher visueller Referenzvergleich, vollständige Prüfung jeder Route/Zustands-/Rollen-/Sprachkombination, kontrollierter Desktop-Aktionsoverflow, aktuelle Firmen-/Arbeitsbereichsauswahl, Admin-Suche/Benachrichtigungen mit realen Daten, sämtliche Layout-/Overlayvarianten und vollständige Legacy-Nutzungsbereinigung. Das Repository unterstützt derzeit DE/FR/IT/EN; TR ist im neuen Auftrag gefordert, aber noch nicht implementiert. Keine funktionslosen zusätzlichen Schaltflächen dafür eingeführt.

Issue #238 und seine Scanner-/Ingress-/Betriebs-/Geräte-/Abnahmenachweise bleiben offen. Der aktuelle bereits ausgelieferte Stand ist ein dokumentierter Entwicklungsumfang; dieser Nachtrag erklärt ihn nicht zur vollständigen Produktionsabnahme. Kein Merge/Deploy dieses Pakets ohne bestandene Pflicht-Gates und zulässigen Review.

## Referenzgebundene Pilotansichten

`AuthWorkspace` bildet den gemeinsamen Desktop-Rahmen für Login, Codeprüfung und Passwortanforderung/-zurücksetzung. Bestehende Formular-, Fehler-, Doppelsubmit-, Reset- und Session-Handler bleiben erhalten. Auf Mobile/Tablet wird die Marketing-Einleitung ausgeblendet, Formular und echte Navigation bleiben erreichbar. Sprache und Rechtslinks sind funktional; Original-Logo statt Textlogo. Registrierung behält vorläufig den vorhandenen Wizard/Sheet-Prozess.

Die Ausgangswerte des Referenzpakets werden in bestehenden Tokens verwendet: Primäraktion `--app-action-accent:#2566bd`, weiche Fläche `#edf4ff`, Buttonradius 7 px, Feldradius Desktop 7 px/Mobile 8 px. `--app-accent` der eingefrorenen Navigation bleibt unverändert; nur Inhalts-/Overlay-/Desktop-Shell-Kontexte binden den freigegebenen Aktionsakzent ein. Native Dateiauswahl verwendet den gemeinsamen dezenten blauen `::file-selector-button`; Dateinamen, native Auswahl und Disabled-Verhalten bleiben erhalten.

Der bestehende Browser-Controltest erwartet aufgrund der neuen expliziten Referenz 8 statt 12 px. Keine Referenzbilder oder Gate-Entscheidungen angepasst. `ux-reference-capture.mjs` rendert die unveränderten Referenzdateien in einem separaten, netzwerkgesperrten Browserkontext mit bereits gebündeltem Lucide. Ein zusätzlicher Evidenzschritt im bestehenden Chromium-Job legt diese Bilder bei den tatsächlichen Produkt-Screenshots ab; keine automatische Baselinefreigabe. Keine Vorschau-Daten/Handler ins Produkt übernommen.

Vor der Referenz-Pilotänderung bestanden auf `4c39191da8c84ba83ea17b2ce995e7c768fc1010` GitHub Quality #38796209547 und CodeQL #38796209578. Der vollständige lokale Diagnoselauf bestand 41 von 42 Einzeltests; nur der Scanner-Unix-Socket scheiterte an EPERM. Dies ersetzt nicht das vollständige Pflichtgate. Neue Pilotänderungen benötigen eigene CI-/Browsernachweise.

## Kaskaden- und Browserkorrekturen des Pilotpakets

- Chromium #38797350820: Desktop `.page-container` hatte einen transparenten statt eigenen weissen Hintergrund. Weisser Parent allein erfüllte das explizite neue Surface-Gate nicht. Der vorhandene Container und Operator-Inhalt besitzen jetzt `--app-canvas` unabhängig vom Viewport; die redundante mobile Deklaration ist entfernt. Erwartung blieb unverändert.
- WebKit desselben Laufs: zweite historische Control-Geometrieprüfung erwartete noch 12/10 px. Die Implementierung lieferte 8 px entsprechend der neuen Referenz. Beide Controlprüfungen erwarten nun die ausdrücklich dokumentierten 7 px Desktop bzw. 8 px bis 1100 px; Höhen/Insets/Validierungs-/Keyboardgates unverändert.
- Vererbungsprüfung: der globale Fokus gehört auch zur eingefrorenen Navigation. `:focus-visible` bleibt deshalb bei `currentColor`; blau wird nur für die vorgesehenen gemeinsamen Button-/Iconbutton-Kontexte gesetzt. Das Navigationsgate prüft zusätzlich diesen geerbten Owner. Keine Navigationsreferenz regeneriert.
- Auswahlzustände von Tabs/Chips/Benachrichtigungen verwenden jetzt im bestehenden Basisowner die weiche blaue Fläche; die identische mobile Sonderdeklaration wurde entfernt. Dateiauswahl-Touchziel beträgt mindestens 44 px.

Die Pilot-Referenzbilder wurden im Chromium-Runner erfolgreich erzeugt und zur Prüfung geladen. Ein vollständiger visueller Vergleich mit den tatsächlichen Pilotseiten bleibt bis zum korrigierten Browserlauf offen; der fehlgeschlagene Lauf wird nicht als bestanden ausgewiesen.
