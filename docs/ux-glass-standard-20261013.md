# Binso One – zentraler UX-Standard vom 13.10.2026

## Freigabe und Geltungsbereich

Der Benutzer hat in dieser Sitzung die gemeinsame Farbfläche von Header und Seite, Glasmaterial für Header-Aktionen und Bottom-Navigation, einen separaten Erstellen-Button sowie die zentrale Standardisierung von Kunden- und Adminportal ausdrücklich beauftragt. Diese Freigabe erweitert die frühere unveränderte Bottom-Navigation ausschliesslich für Material und Platzierung des Erstellen-Buttons. Finanzen bleibt ein direkter Navigationspunkt. Navigationsziele, bestehende Icon-Pfade sowie Zugriffs- und Scroll-Logik bleiben erhalten und werden gegen den ursprünglichen Quellvertrag geprüft.

Der Standard gilt für bestehende Hauptseiten, Detailseiten, Erfassungsprozesse und gemeinsame Dialoge beider Portale. App-Ansichten reichen bis 1100 CSS-Pixel; darüber bleiben die vorhandenen Desktop-Arbeitsbereiche bestehen. Öffentliche Seiten und der Monitoring-Wallboard behalten ihre fachlichen Layouts und verwenden die gemeinsamen Formulargrundlagen.

## Wiederverwendbare Verantwortlichkeiten

| Verantwortung | Einziger gemeinsamer Besitzer |
| --- | --- |
| Deckender App-Header, Zurück/Titel, Aktionskapsel | `components/app-chrome.tsx#AppHeader` |
| Navigation und separater Erstellen-Button | `components/app-chrome.tsx#MobileDock` |
| Erlaubte Erstellen-Ziele und Reihenfolge nach Bereich | `config/create-actions.ts` |
| Erstellen-Menü und leere Listen | `QuickCreateAction`, `EmptyRecordAction` in `components/binso-ux.tsx` |
| Aktions-, Formular- und Filter-Sheets | `ActionSheet`, `FormSheet`, `FilterSheet` in `components/binso-ux.tsx` |
| Aktionszeilen und Detail-Tabs | `ActionRow`, `DetailTabs` in `components/binso-ux.tsx` |
| Suche, Filteranzahl, Sortierung und Listenstatus | `RecordsControls`, `RecordsView` in `components/records.tsx` |
| Formulare, native Controls, Fehler und Rückmeldungen | `components/ui.tsx` |
| Globale Suche, Benachrichtigungen, Konto | `HeaderPanel`, `SearchPanel`, `NotificationPanel`, `AccountPanel` |
| Chat-Nachrichten und fixierter Eingabebereich | `MessageBubble` und bestehende gemeinsame Thread-/Viewport-Regeln |
| Farben und Glasmaterial | `app/styles/tokens.css` |

Neue Seiten müssen diese Komponenten nutzen. Die zentrale ESLint-Regel verbietet kopierte native Formularfelder, eigene Sheet-Wrapper und eigene App-Header-/Dock-Wrapper. Es werden keine parallelen CSS-Dateien oder `!important`-Reparaturen eingeführt.

## Gestaltungs- und Bedienvertrag

- Header und Seitenfläche verwenden `--app-canvas`. Der gesamte Header bleibt deckend und ohne Blur.
- Nur Aktionskapseln, Navigation und dockseitiges Plus verwenden das gemeinsame Glasmaterial. Der Inhalt und die Icon-Konturen bleiben scharf. Ohne Backdrop-Unterstützung, bei reduzierter Transparenz und in Forced-Colors gibt es einen deckenden Ersatz.
- Die App-Palette besitzt eine einzige Zuordnung für Text, sekundären Text, Flächen, Trennlinien, Formularrundungen und Fehlerzustände. Die vorhandenen Kontrasttests bleiben aktiv.
- Erstellen ist eine Aktion, kein Navigationsziel. Rechts neben der Navigation erscheint genau ein Plus. Unter 375 Pixeln steht es knapp darüber, damit alle bestehenden Navigationspunkte mindestens 44 × 44 Pixel behalten. Auf Detailseiten und in Erfassungsprozessen erscheint kein zusätzliches globales Plus.
- Das Erstellen-Menü prüft die tatsächlich erlaubten Schreibpfade pro Aktion. Die Aktion zum geöffneten Bereich steht zuerst. Interne Zeit verwendet weiterhin `manual=1`; Formulare behalten ihren sicheren lokalen Rückkehrpfad.
- Admin-Erstellen-Aktionen werden zusätzlich durch `restrictions:manage` bzw. `announcements:manage` begrenzt. Das Kunden-Erstellen-Menü wird nicht in den Adminbereich übernommen.
- Suchfeld und Filter befinden sich in einer Zeile, Status-Tabs darunter. Aktive Filter/Sortierungen haben eine zugängliche Anzahl; Entwurfsfilter werden erst mit Anwenden übernommen.
- Sheet-Höhen folgen dem Inhalt und dem Visual Viewport. Ein Sheet besitzt genau einen Titel, einen scrollbaren Inhalt und einen gemeinsamen, sichtbaren Aktionsbereich. Native Formzugehörigkeit, Dirty-Guard, Fokusfalle und Rückkehr zum auslösenden Element bleiben erhalten.
- Eine Zeilengrenze besitzt genau eine Trennlinie. Gemeinsame Aktionszeilen nutzen eingerückte Linien; Listen haben keine zusätzliche Abschlusslinie.
- Letzte Suchanfragen leben nur im aktuellen Shell-Speicher. Löschen kann innerhalb der Suchansicht rückgängig gemacht werden. Es werden keine Suchbegriffe dauerhaft oder firmenübergreifend gespeichert.
- Die gemeinsame Rückmeldung unterstützt eine tatsächliche Rückgängig-Aktion. Persistierte Löschungen oder sicherheitsrelevante Adminaktionen werden dadurch nicht zu scheinbar reversiblen Aktionen erklärt.

## Entfernte Ursachen und Altregeln

1. Getrennte Header-/Seitenfarben wurden durch eine gemeinsame Canvas-Zuordnung ersetzt.
2. Kunden- und Adminnavigation verwenden denselben Dock-Aufbau und dasselbe Material statt unabhängiger Navigationstypen.
3. Die handgeschriebenen Kunden-/Admin-Mehr-Dialoge wurden durch `ActionSheet` und `ActionRow` ersetzt; ihr eigener Fokus-/Scroll-Aufbau und die zugehörigen Legacy-CSS-Regeln wurden entfernt.
4. Frühere Sonderregeln für Einstellungsheader sowie getrennte Navigation-Sheet-/kontextuelle Filter-Sheet-Flächen wurden entfernt.
5. Die generische Admin-Regel für direkte Inhaltskinder schliesst den neuen Dock ausdrücklich aus. Sonst wurde dem fixierten Dock die volle Seitenbreite zusätzlich zu seinem linken Abstand zugewiesen und das Plus rechts abgeschnitten.
6. Die bisherigen Navigationsreferenzen bleiben als historische Freigabe erhalten. Der neue Quellvertrag steht unter `docs/assets/20261013/`; die Abweichung ist in `ux-compliance/requirements.v1.json` explizit dokumentiert. Geometrie-Referenzen dürfen weiterhin nicht automatisch erneuert werden.

7. Ein warmer Build lieferte für die Firmen-Unterseite ältere CSS-Asset-Referenzen (`be416f1b10e76cb7.css`) aus; nach Entfernen der erzeugten Build-Dateien wurde der aktuelle responsive Stand (`c9ace042a01b5fd4.css`) geladen und die Tablet-Prüfung bestanden. `scripts/prepare-ui-build.mjs` verwirft deshalb beim Wechsel des zentralen CSS-Fingerprints den erzeugten Next-Stand vor der Kompilierung. Unveränderte Styles behalten ihren Cache. Der Schutz ist durch isolierte Cache-/Source-Erhaltungsszenarien geprüft.

## CI-Nachprüfung des Chat-Viewports

Der vollständige Lauf zu `c0dd5ac` bestand Build, Tests, Scanner, Chromium und WebKit. Die anschliessende aggregierte Compliance erkannte 16 identische Chat-Abstandsverletzungen bei 768/1024 Pixeln: Der Nachrichten-Composer endete bei 965 Pixeln, die Navigation begann bei 920 Pixeln. Die bestehenden Chat-Regeln für Header-Höhe und reservierten Navigationsraum standen noch im Smartphone-Block bis 700 Pixel. Sie gehören in den gemeinsamen App-Block bis 1100 Pixel und wurden dorthin verschoben. Die direkte Browserprüfung verlangt jetzt, dass der Composer oberhalb der Navigation endet. Gezielte Light-/Dark-Prüfungen bei sieben Breiten sowie verkleinerte/verschobene Visual-Viewport-Szenarien sind bestanden; die Navigation bleibt unverändert.

## Abnahme

Die konkreten lokalen Prüfergebnisse und Einschränkungen stehen in `docs/assets/20261013/validation.json`. Synthetische API- und Browserprüfungen sind keine Live-Azure-Abnahme und kein Test einer realen iPhone-Tastatur. Die Änderung wird über einen separaten GitHub-Branch und Pull Request bereitgestellt; eine Produktionsbereitstellung ist eine separate Release-Stufe.
