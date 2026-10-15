# Weisse Arbeitsbereiche – Implementierungsphase

Ausgangsstand: `116ad260d98123b433449f5d53f47f64b09827c5` (Main, PR #255). Arbeitsbaum vor Beginn sauber. Branch: `ux/v24-white-workspaces`. Keine erneute ZIP-Sicherung als Voraussetzung. Git-Bundle der Ausgangshistorie war bereits geprüft; kein produktiver Datenbank-/Infrastruktureingriff in dieser Phase.

## Verbindlicher Auftrag

[Neuer Auftrag](white-workspaces-request.md), vom Nutzer am 15.10.2026 beigefügt. Seine konkreten Designentscheidungen haben Vorrang vor älteren widersprüchlichen Gestaltungsanforderungen. Weisse Grund-/Header-/Inhaltsflächen im Light Mode; dezente blaue Aktionen und Zustände; separate konsistente Dark-Variante; eigenständige Desktop- und mobile Bedienung. Die bestehende mobile Bottom-Navigation bleibt geschützt.

Die zuletzt freigegebenen Desktop-, Mobile/PWA- und Landingpage-Designvorschauen liegen dieser Arbeitsumgebung nicht vor. Schriftliche Anforderungen können umgesetzt werden; exakte Referenzparität wird nicht behauptet. Anforderungen des gesamten V24 bleiben offen, bis sie individuell nachgewiesen sind.

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
- Fast-QA einschliesslich TypeScript, UX-Vertrag, Regression, Theme/Glass, Foundation, Navigations- und CSS-Architektur sowie QA-Plan bestanden vor der letzten Desktop-Suchpositionierung.
- Separater unveränderter Navigation-Contract bestanden: keine Referenzregeneration.
- Erster Produktionsbuild erfolgreich; finaler Build/ESLint und weitere Prüfungen laufen.
- Neues Browsergate prüft weisse Flächen, Desktop-Einklappen/Rückgewinnung der Breite/Storage und geometrische Ringzentrierung. Der bestehende Flächentest wurde wegen der expliziten neuen Weiss-Vorgabe von Grau auf Weiss geändert. Keine Screenshotreferenz erneuert.
- Lokaler vollständiger Testlauf der Ausgangsbasis scheitert unverändert im Scanner-Test an `listen EPERM`. Keine Prüfung deaktiviert.
- Lokale Browserinstallation scheitert am Download/Entpacken des Chromium-Archivs. Kein Browser-/Gerätenachweis dieser Phase.

## Verbleibender Umfang

Gesamtauftrag nicht abgeschlossen. Offen sind genaue Referenzbindung, vollständige Prüfung jeder Route/Zustands-/Rollen-/Sprachkombination, kontrollierter Desktop-Aktionsoverflow, aktuelle Firmen-/Arbeitsbereichsauswahl, Admin-Suche/Benachrichtigungen mit realen Daten, sämtliche Layout-/Overlayvarianten und vollständige Legacy-Nutzungsbereinigung. Das Repository unterstützt derzeit DE/FR/IT/EN; TR ist im neuen Auftrag gefordert, aber noch nicht implementiert. Keine funktionslosen zusätzlichen Schaltflächen dafür eingeführt.

Issue #238 und seine Scanner-/Ingress-/Betriebs-/Geräte-/Abnahmenachweise bleiben offen. Der aktuelle bereits ausgelieferte Stand ist ein dokumentierter Entwicklungsumfang; dieser Nachtrag erklärt ihn nicht zur vollständigen Produktionsabnahme. Kein Merge/Deploy dieses Pakets ohne bestandene Pflicht-Gates und zulässigen Review.
