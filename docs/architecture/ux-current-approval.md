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
- Die neuere ausdrückliche Sammelfreigabe ersetzt die frühere Plus-Kreis-Regel:
  Erstellen sitzt neben Suche/Filter in der gemeinsamen Inhalts-Command-Bar,
  niemals im globalen Header oder in der Navigation. Beschrifteter blauer Button,
  auf Mobile kurze sichtbare Beschriftung „Neu“, vollständiger zugänglicher Name,
  mindestens 44px Touchfläche. Keine konkurrierende zweite Erstellen-Aktion.
- Auswahlfelder nutzen den gemeinsamen App-Popup-Owner mit Tastaturbedienung,
  Disabled-Zuständen und echter Formularvalidierung. Suche, Dialoge und Auswahl
  sperren den Hintergrund; verschachtelte Dialoge behalten ihre Scroll-Sperre.
- Aktive Zeit ist im mobilen Header zentriert, mit ruhigem blauem Statuspunkt.
  Reduced Motion deaktiviert das Pulsieren. Keine alarmartige Daueranimation.
- Kundenneuanlage benötigt Vor- und Nachname einer Kontaktperson; Speicherung
  von Kunde und erstem Kontakt erfolgt atomar. Bestehende Kunden ohne strukturierte
  Kontakte bleiben bearbeitbar, ohne Namen zu erfinden. Registrierung verlangt
  einen eigenen Kontaktnamen zusätzlich zur Firma.
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
Die frühere Plus-Kreis-Entscheidung bleibt im historischen App-Workspace-Bericht
nachvollziehbar, ist aber keine aktive Vorgabe mehr. Gezielte lokale Prüfungen,
anschliessend gemeinsame GitHub-Quality-/CodeQL-Prüfung
und Browsermatrix. Physische iOS-/Android-PWA-, native Tastatur- und Assistive-
Technology-Nachweise bleiben getrennt offen, bis sie tatsächlich ausgeführt sind.
Kein automatischer Merge und kein Deployment aus dieser Implementierungsfreigabe.
