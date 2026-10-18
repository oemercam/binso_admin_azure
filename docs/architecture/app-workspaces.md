# Microsoft-App-Arbeitsbereiche, 18.10.2026

Grundlage ist die ausdrückliche Gesamtfreigabe nach der 76-Routen-Diagnose.
Aktive Rangfolge: [ux-current-approval.md](ux-current-approval.md).

## Zusammenhängende Umsetzung

| Bereich | Gemeinsamer Owner | Ergebnis |
| --- | --- | --- |
| Kunden-App | AppShell / AppHeader | Kontexttitel, Zurück auf Unterseiten, Original-Icon + One auf der Übersicht; Erstellen im mobilen Listenheader |
| Operator | OperatorPage / AppHeader | Kontexttitel statt wiederholtem Produktlogo im mobilen Bereichsheader; Rollen und Ziele unverändert |
| Navigation | MobileDock / navigation.css | Deckende volle Breite und untere Safe Area; Labels bleiben beim Scrollen sichtbar; Tablet/Desktop-Seitenleiste ab 761px |
| Aktionen | CreateAction / primitives.css | Sichtbarer Kreis wie Avatar, unveränderte 44px Touchfläche, Plus ohne leeren Flex-Wrapper, sichtbarer Fokus |
| Erfassungen | FormSheet workspace / FormWizard | Kunden, Produkte, Mitarbeiter, Projekte, Zahlungen, Spesen, Support, Angebote und Rechnungen ohne Vollbild-Dialogkulisse |
| Rechnung / Angebot | DocumentPage / DocumentReview | Getrennte Eingabeschritte, App-Zusammenfassung mit Bearbeitungsaktionen, eigene PDF-Vorschau; eindeutiges Entwurf-Speichern |
| Einstellungen | SettingsNavigation | Darstellung und Sprache als getrennte, eindeutig bezeichnete Ziele |
| Chat | MessageBubble / display-format | Echte Tagesgrenzen und Uhrzeiten in Europe/Zurich statt pauschalem Heute |
| Versionswechsel | AppVersionNotice | Nur Foreground-/Resume-Prüfung, zusammengefasste Requests, explizites Aktualisieren; kein Reload bei ungespeicherter/beschäftigter Aufgabe |

Die gemeinsamen Komponenten gelten auch für bestehende Detail-, Finanz-, Listen-,
Chat- und Einstellungsunterseiten. Öffentliche Marketing-/Rechtsseiten behalten
ihre fachlich passende Website-Struktur. Login, initialer Splash und LoadingState
bleiben bei ihren bereits zentralen Ownern. Keine zweite Foundation.

## Bereinigung und Schutz

- Scroll-Kompaktierung, transparente Dock-Ränder und drei ungenutzte Dock-Tokens entfernt.
- Leerer Buttontext-Wrapper wird auf Mobile vollständig aus dem Layout genommen.
- Doppelte Dokument-Vorschauaktion, doppelte Metadaten-Schritte und überlappender Spracheinstieg bereinigt.
- Zwei nicht mehr verwendete Migrationshelfer und ein nachweislich überlagerter CSS-Wert entfernt.
- Gemeinsame mobile Bereichstitel haben einen CSS-Owner; neue Workspace-Wrapper sind durch die vorhandene ESLint-Regel geschützt.
- Alte Quell-/Geometrieverträge bleiben unveränderte historische Belege. Aktive Verträge und Gates verwenden die neue Freigabe; Tests erzeugen keine Referenzen.
- Auth, RBAC, APIs, Geldberechnung, PDF/QR, Entwurfs-Recovery, Idempotenz, Fehlermeldungen und Kinddialog-Fokus bleiben geschützt.
- Neue Regionen haben keinen modalen Fokusfang. Escape, Abbrechen, Link-Navigation und Browser-Zurück fragen bei Dirty-State nach. Ein Kindeditor kann den Hauptentwurf nicht verwerfen.

## Nachweisgrenzen

76 Seiteneinstiege und zwölf Operator-Varianten sind statisch zugeordnet. Die
generierten Inventare enthalten keine daraus abgeleitete visuelle Freigabe.

Gezielte lokale Nachweise: Typecheck, Lint, UI-/CSS-/Navigationsverträge,
unveränderte Zugriffs-/Ziel-/Icon-Invarianten, tatsächliches Workspace-/Dialog-
Rendering, Update-/Dirty-State-Logik, Prozess-Recovery, Doppel-Speicherschutz,
Rollen und unveränderte PDF-/QR-Funktionen. Acht isolierte Renderfälle bei
320/390/760px in Light/Dark prüfen echte zentrale Button-/Navigationsstrukturen
und sämtliche CSS-Owner, mit Scroll-, 34px-Safe-Area-, Detailheader-/Titel- und negativen Layoutproben.

Der erste CI-Lauf hat den sauberen Produktionsbuild und CodeQL bestanden. Er
hat ausserdem einen veralteten Router-Mock sowie alte 40px-Dokumentheader-
Overrides und einen Status innerhalb der H1 gefunden. Diese Ursachen sind
korrigiert: zentrale Touchmasse, eigenständige Status-Semantik und aktualisierte
Testumgebung ohne abgeschwächte Assertions. Der vollständige aktuelle Lauf bleibt
bis zu seinem tatsächlichen Abschluss offen.

Ein zusätzlicher lokaler Next-Dev-Versuch für drei Routen bei zwei Breiten wurde
beim Warm-up mit HTTP 500 und `Unexpected end of JSON input` gestoppt. Er ist
kein bestandener App-Browsernachweis. Die geprüften generierten JSON-Manifeste
waren danach gültig; die genaue lokale Compilerursache ist nicht nachgewiesen.
Die saubere CI-Kompilierung und vollständigen Browserläufe sind verbindlich.

Physische iOS-/Android-PWA-, native Tastatur-, Screenreader- und vollständige
visuelle Abnahme bleiben offen, bis echte Nachweise vorliegen. Kein Merge und
kein Deployment durch dieses Paket.
