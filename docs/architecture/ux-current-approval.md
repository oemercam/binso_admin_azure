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
- Die Sammelfreigabe vom 19.10.2026 ersetzt die bisherige mobile Neu-Zeile:
  Auf Mobile wird die bestehende CreateAction als blauer Plus-Kreis unten rechts
  oberhalb Navigation/Safe Area dargestellt, mindestens 44px, mit vollständigem
  zugänglichem Namen. Bei Erfassung, Dialog, Tastatur und Chat ist er verborgen.
  Desktop behält den beschrifteten Button neben Suche/Filter. Keine zweite Aktion.
- Auswahlfelder nutzen den gemeinsamen App-Popup-Owner mit Tastaturbedienung,
  Disabled-Zuständen und echter Formularvalidierung. Suche, Dialoge und Auswahl
  sperren den Hintergrund; verschachtelte Dialoge behalten ihre Scroll-Sperre.
- Der Header zeigt keine laufende Zeitmessung. Der vorhandene Wiederöffnungs-
  Hinweis bleibt der Einstieg zur aktiven Messung. Kein zweiter Timer und keine
  zusätzliche Headerzeile.
- Kundenneuanlage benötigt Vor- und Nachname einer Kontaktperson; Speicherung
  von Kunde und erstem Kontakt erfolgt atomar. Bestehende Kunden ohne strukturierte
  Kontakte bleiben bearbeitbar, ohne Namen zu erfinden. Registrierung verlangt
  einen eigenen Kontaktnamen zusätzlich zur Firma.
- Alle Erfassungen/Bearbeitungen verwenden den bestehenden modalen FormSheet-
  Owner: Mobile von unten, Desktop zentriert. Lange Formulare erweitern denselben
  Dialog; Inhalt scrollt, Aktionen bleiben am unteren Rand. X und Abbrechen teilen
  die Rückfrage nur bei ungespeicherten Eingaben. Browser-Zurück, Entwurfs-Recovery,
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
Der aktuelle blaue mobile Plus-Kreis folgt der Entscheidung vom 19.10.; der alte
schwarze Kreis und die zwischenzeitliche mobile Neu-Zeile sind historische Nachweise. Gezielte lokale Prüfungen,
anschliessend gemeinsame GitHub-Quality-/CodeQL-Prüfung
und Browsermatrix. Physische iOS-/Android-PWA-, native Tastatur- und Assistive-
Technology-Nachweise bleiben getrennt offen, bis sie tatsächlich ausgeführt sind.
Kein automatischer Merge und kein Deployment aus dieser Implementierungsfreigabe.

## Einheitlicher Inhaltseinstieg

Mobile Seiten beginnen nach dem gemeinsamen Header mit dem normalen Seitenabstand.
Keine zusätzliche Leerfläche für bereits im Header sichtbare Titel. Tabs, Suche,
Filter und fachliche Aktionen folgen unmittelbar; die Übersicht behält Titel in der Inhaltszeile. Leere Detailköpfe entfallen, echte Datensatzmetadaten
bleiben erhalten. Die anschliessend freigegebene Orientierung ergänzt auf Hauptseiten und
Einstellungsbereichen jeweils einen kurzen Zweck-Satz aus lib/page-orientation.ts.
Keine doppelten Beschreibungen; Detailseiten behalten Datensatzmetadaten, Chat
und Bearbeitungsformulare bleiben kompakt. Kurze Hilfen erklären zusätzlich
unklare oder noch nicht begonnene Aufgaben. Lade-, Leer-,
Fehler- und Read-only-Zustände behalten ihre jeweilige Bedeutung.

## Ergänzende Sammelfreigabe nach Release #287

- Pro Menüpunkt stehen die jeweilige Aufgabe und wenige wichtige Informationen
  im Vordergrund. Details/Tabs verwenden denselben Such-, Filter-, Zeilen- und
  Aktionsvertrag wie eigenständige Listen. Kundenkontext bleibt erhalten.
- Status rechts und vertikal zentriert; Nummern und Werte nicht durch bewusst
  gestapelte Metadaten auseinanderreissen. Gleichrangige Abschnitte gleich setzen.
- Kundenvorgaben vor Firmenstandard für neue Dokumente, bewusste Eingaben und
  gespeicherte Snapshots unverändert erhalten. Keine Bestandsänderung durch Defaults.
- Finanzverläufe und Rechnungsbestandsanteile trennen; Ring nur für echte Teile
  desselben Totals, keine Vermischung von Ein-/Auszahlungen oder Währungen.
- Interne Navigation ohne Balken; kurzlebige Speichersnapshots nur innerhalb
  derselben Sitzung und Datenrevision, mit Hintergrundaktualisierung.
- Chat besitzt genau einen einzeiligen, begrenzt wachsenden Composer. Keine
  zweite App-Leiste bei Tastatur; iOS-Systemleisten separat auf realem Gerät prüfen.
