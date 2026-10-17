# Zentrale Formularbereinigung, 17.10.2026

## Ausgangspunkt und Umfang

PR #276 wurde nach erneuter Prüfung exakt des freigegebenen Heads
`456050269f2889d04b97629d2ba8be622a3a87c0` regulär mit
`fd56231aca0af13652d41c3d986c09ec6ac63763` integriert. Quality und analyze
waren erfolgreich, Reviews und Review-Threads leer. Der aktuelle Main-Schutz
verlangte PR, aktuelle Basis, quality/analyze von GitHub Actions und aufgelöste
Threads; Admin-Bypass, Force-Push und Löschen waren ausgeschlossen.

Das nächste bewusst kleine Paket entfernt ausschliesslich die verwaiste
CSS-Variante `.form-section.clean` aus dem bestehenden Primitives-Owner:
eine eigene Basisregel und einen Selektor aus der mobilen Selektorliste.
Die gemeinsame `.form-section`-Regel bleibt an derselben Kaskadenposition.
Die zentralen `FormSection`-, Feld-, Wizard- und Dokumentkomponenten bleiben
quellgleich. Keine neue Foundation, lokale CSS-Ausnahme oder Verhaltensänderung.

## Nutzungs- und Kaskadennachweis

Die gezielte Suche nach `clean` und `form-section` in App, Komponenten,
Bibliotheken, Konfiguration und Skripten findet keinen Erzeuger dieser
Klassenkombination, auch keinen dynamischen Testaufruf. Die `clean`-Strings
der Datei-/Virenscanlogik sind fachliche Statuswerte und bleiben unverändert.
`FormSection` erzeugt ausschliesslich `className="form-section"`; die
Dokumentabschnitte verwenden andere vorhandene Zusatzklassen.

Ein PostCSS-AST-Vergleich mit `origin/main` entfernt aus der Vorher-Struktur
genau die zwei `.form-section.clean`-Selektoren und verlangt anschliessend
vollständige Gleichheit aller übrigen Selektoren, Deklarationen, Media-Kontexte
und ihrer Reihenfolge. Bestanden. Das lokale Nachweisskript liegt ausserhalb
des Repositorys im Workspace als `verify-form-section-cleanup.mjs`.

Die vorhandenen Inventargeneratoren aktualisieren Routen-/CSS-Zuordnung und
Dependency-Inventar. Die grossen JSON-Diffs entstehen durch verschobene
CSS-Regel-IDs und Quellpositionen, nicht durch weitere Produktänderungen.
Weiterhin 76 Routen, 198 Komponenten, 511 Module und zwölf Operatorvarianten;
2.629 statt 2.630 CSS-Regeln, keine Runtime-Importzyklen oder unreferenzierten
Komponentenmodule. Keine Hashwerte manuell gesetzt.

## UX-Einordnung und Abnahmegrenze

Das Microsoft-Paket vom 15.10.2026 und die spätere ausdrückliche Rangfolge
bleiben verbindlich. Dieses Paket bereinigt einen ungenutzten Formularpfad;
es beansprucht keine neue visuelle Freigabe. Aktive CSS-Regeln, Referenzen,
Navigationsverträge, Geschäftslogik, Auth und Berechtigungen bleiben erhalten.
Deshalb keine zusätzliche lokale Browsermatrix für diese Totcode-Entfernung.
Die bestehenden GitHub-Quality-/Security-Gates bleiben vor Integration Pflicht.
Der neue PR bleibt ohne weitere ausdrückliche Freigabe ungemergt.

Gezielte Prüfungen bestanden: CSS-Architektur, UX-Style-Adversarialtests,
UX-Vertrag, Foundation-Integration, UI-Foundation und beide bestehenden
Navigationsverträge. Auch vollständiges Lint, Typecheck, Produktionsbuild
(141/141 statische Generierungen), Lokalisierungsabdeckung und
Dokumentationskonsistenz sind erfolgreich.

Offen bleiben die übrigen aktiven Formular-/Timer-Zustände und die vollständige
visuelle Geräte-/Releaseabnahme. Daraus folgt keine Infrastrukturarbeit und
keine Deployment-Freigabe. Sicherheitsbranch und Draft-PR #267 bleiben erhalten.
