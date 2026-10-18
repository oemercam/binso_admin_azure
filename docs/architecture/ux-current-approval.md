# Aktueller Microsoft-App-Standard

Die ausdrückliche Gesamtfreigabe nach der Diagnose vom 18.10.2026 ersetzt ältere
Material-, Kompakt-, Dock-Geometrie- und Dokumenteditor-Vorgaben. Das unveränderte
Microsoft-Referenzpaket vom 15.10. bleibt die visuelle Grundlage. Fehlende Screens,
Dark Mode und Operator-Varianten sind abgeleitet, keine behauptete Originalfreigabe.

## Verbindliche gemeinsame Bedienung

- Mobile Navigation bleibt beim Scrollen vollständig beschriftet. Deckende Fläche
  bis zu allen Bildschirmrändern und über die untere Safe Area; kein schwebendes
  Dock, Glass, Blur, Schatten oder automatisches Ausblenden. Desktop/Tablet ab
  761px behält die bestehende Seitenleiste. Ziele, Rechte und Icons bleiben gleich.
- Auf der Übersicht originales BINSO-Icon mit One. Hauptbereiche zeigen ihren
  Bereichstitel. Unterseiten besitzen Zurück und Kontexttitel. Kein wiederholtes
  Produktlogo in jedem App-Header; Login/Start/öffentliche Website bleiben eigene
  Zustände. Desktop-Header behält globale Suche, Benachrichtigungen und Konto.
- Erstellen sitzt auf Mobile im gemeinsamen Listenheader. Sichtbarer Kreis wie
  Avatar (30px), Touchfläche mindestens 44px, zentriertes Plus ohne leeren Label-
  Wrapper. Desktop bleibt beschriftet. Keine konkurrierende zweite Erstellen-Aktion.
- Lange routegebundene Erfassungen verwenden den bestehenden FormSheet-Owner im
  workspace-Modus: keine Scrim-Fläche, kein modaler Fokusfang, ein Kontexttitel,
  erreichbare Abschlussaktionen. Kurze Kindeditoren/Filter/Aktionen bleiben echte
  Dialoge mit Fokusführung. Back, Abbrechen, Browser-Schliessen, Entwurfs-Recovery,
  Validierung, Replay-Schutz und Rollen bleiben verbindlich.
- Rechnung/Angebot: Kunde und Datum, Positionen, Bedingungen, App-Zusammenfassung.
  PDF ist eine separate Vorschau. Keine doppelte Feldbearbeitung in mehreren
  Schritten und keine permanente Speicherbehauptung ohne tatsächlichen Vorgang.
- Listen teilen RecordsControls/RecordsView, Details DetailHeading/DetailTabs,
  Einstellungen den gemeinsamen Katalog, Chat MessageBubble/Viewport-Owner.
  Gleiche Regeln bedeuten nicht identische fachliche Inhalte oder ein Universalformular.
- Neue Versionen werden nur beim Wiederöffnen geprüft und angeboten. Kein
  automatisches Neuladen; ungespeicherte/beschäftigte Aufgaben blockieren Aktualisieren.
- Sprache und Darstellung haben eindeutige getrennte Einstiege. Chat-Tagesgruppen
  folgen echten Zeitstempeln in Europe/Zurich, niemals pauschal Heute.

## Aktive Nachweise und historische Regeln

Aktiver Quellvertrag: docs/assets/20261018/stable-navigation-reference.json.
Erzeugung ausschliesslich explizit über scripts/navigation-reference.mjs mit
unveränderten Access-/Ziel-/Icon-Invarianten gegen Main 1a2813d0.
Die neue abgeleitete Geometriespezifikation ist navigation-baseline.v4.json:
volle Breite, 68px Navigationsinhalt plus reale Safe Area; unabhängige Browser-
Messungen müssen sie bestätigen. Tests generieren oder akzeptieren keine Baseline.

v2/v3, readable-navigation-reference und die alten Freeze-/Glass-Anweisungen sind
historische Nachweise ohne aktive Produktpriorität. Der bisherige Entscheidungsverlauf
liegt unverändert in docs/audit/20261018/ux-approval-before-app-workspaces.md.
Funktions-/Security-Tests bleiben aktiv; nur ausdrücklich abgelöste Darstellungs-
erwartungen werden mit positiven und negativen Regressionen ersetzt.

## Abnahmegrenze

Quellabdeckung aller 76 Routen ist keine vollständige Funktions-/Sichtabnahme.
Gezielte lokale Prüfungen, anschliessend gemeinsame GitHub-Quality-/CodeQL-Prüfung
und Browsermatrix. Physische iOS-/Android-PWA-, native Tastatur- und Assistive-
Technology-Nachweise bleiben getrennt offen, bis sie tatsächlich ausgeführt sind.
Kein automatischer Merge und kein Deployment aus dieser Implementierungsfreigabe.
