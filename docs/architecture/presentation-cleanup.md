# Sichtbare Microsoft-Oberfläche: zentraler Bereinigungsstand

Basis: ausgelieferter Commit `51024b18`, Branch `ux/consolidate-visible-interface`.
Der aktuelle Nutzerauftrag ersetzt historische Material-/Freeze-Vorgaben durch
konsequente Anwendung der vorhandenen Microsoft-Foundation. Keine zweite Foundation.

## Umfang und tatsächliche Korrekturen

Der Quellenabgleich umfasst 410 Runtime-Dateien, davon 129 JSX-Dateien, sämtliche
14 aktiven CSS-Owner, 76 Framework-Seiten und 12 Operator-Varianten. Geprüft wurden
auch die 60 nativen Control-Vorkommen und 41 gemeinsamen Status-Vorkommen.
Das bestehende generierte Route-/Importinventar bleibt die vollständige Zuordnung.

Entfernt wurden 291 verwaiste Selektoren für 63 ungenutzte Klassen, 73 sicher
überlagerte Deklarationen und 64 nicht mehr erreichbare Token. Darunter alte
Settings-Schalter, Shell-/Marketing-/Monitoring-Varianten und generische Glass-
Token. Klassen mit dynamischen Präfixen, unterschiedliche Media-/Support-Kontexte,
Selector-Listen, Prioritäten und progressive Browser-Fallbacks bleiben erhalten.
Identische Selektoren mit unterschiedlichen Aufgaben sind keine automatischen
Duplikate und werden nicht zusammenverschoben.

Statusanzeigen behalten echte fachliche Werte/Farben, verwenden aber gemeinsame
Schrift-, Markerabstands- und Umbruchregeln. Verkleinernde lokale Overrides sind
entfernt. Metadaten und Navigation sind mindestens 12px; Labelhöhe und Zeilenhöhe
sind darauf abgestimmt. Der neue Quellvertrag entsteht ausschliesslich über den
bestehenden Generator. Im Operator-Dock passen „Start“/„Status“ statt
„Dashboard“/„Monitoring“ auch bei 320px; vollständige zugängliche Namen bleiben.
Die gerenderte Prüfung erkennt horizontales wie vertikales Abschneiden.
Intrinsische Navigationsspalten mit mindestens 44px berücksichtigen auch andere
Browser-Schriftmetriken; die Aussenmasse des Docks bleiben geschützt.
Historische Referenzen und gerenderte v3-Bounds bleiben
unverändert. Header, Listen, Dokumente, Einstellungen, Marketing und Operator
verwenden die bestehenden Schriftrollen statt winziger Sonderstufen.

Schalter haben eine 44px Bedienfläche um eine kompakte 24px Spur. Coarse-Pointer
verwenden 44px Controls und 16px Eingabeschrift auch auf Tablets. Buttons folgen
den vorhandenen Rollen: normale Aktion, Formularprozess und Authentifizierung;
konkurrierende lokale Höhen sind entfernt. Lange Quick-Actions dürfen umbrechen.
Headeraktionen, Dialogschliessen und mobile Dossieraktionen bleiben erreichbar.
Reduced Motion folgt den zentralen Motion-Tokens; Switches erhalten Systemfarben
und Konturen im Forced-Colors-Modus.

Geschäftslogik, Statuszuordnung, Auth/RBAC, Daten, URLs und Rechte bleiben erhalten.
Vorhandene Seitenmuster, Header, Suche/Filter, Tabellen-, Diagramm-, Chat-, Formular-
und Lade-Komponenten bleiben ihre gemeinsamen Owner. Dokument-/PDF- und E-Mail-
Renderer bleiben getrennte Ausgabemedien; deren rechtliche Inhalte wurden nicht
für eine optische Vereinheitlichung verändert. Sichtbare Lade-Kurztexte werden
weiterhin vom gemeinsamen LoadingState verborgen; Screenreader-Texte bleiben.

## Nachweise und Grenzen

`docs/assets/20261018/presentation-cleanup.json` dokumentiert die Entfernung je
Owner, entfernte Klassen/Token und die sechs gezielten Light-/Dark-Renderfälle.
Dabei wurden echte Status-/Toggle-Renderer bei 320/768/1440px mit langen Labels,
Coarse-Pointer, Reduced Motion und Forced Colors geprüft. Alle zehn Statusvarianten
haben mindestens 5,50:1 (Light) beziehungsweise 7,81:1 (Dark) Textkontrast.
Negativkontrollen weisen winzige Statusschrift, fehlende Markerabstände und zu
kleine Schalter nach. Diese isolierten Komponentenfälle ersetzen keine Seitenabnahme.

`presentation-consistency-test.mjs` ist über den vorhandenen Foundation-Test in
`pnpm test` eingebunden und prüft sichere Cascade-Bereinigung einschliesslich
Gegenproben. Die bestehenden gerenderten Seitentests prüfen Status-/Switch-
Darstellung auf allen besuchten Routen; Navigation enthält zusätzlich eine
Negativkontrolle gegen alte 9px-Labels. Kein bestehendes Gate wird abgeschwächt.

Vollständige GitHub-Quality/CodeQL und die gemeinsame Browserprüfung müssen den
exakten Integrationscommit prüfen. Ein Inventar oder grüner Build ist keine
vollständige visuelle Abnahme. Fehlende Originalzustände/Dark bleiben abgeleitet;
physische iOS-/Android-PWA, Safari/Firefox/Samsung und assistive Hardware sind durch
Desktop-Emulation nicht nachgewiesen. Der PR bleibt bis zur gesonderten Freigabe
offen; dieses Paket löst weder Merge noch Produktivdeployment aus.
