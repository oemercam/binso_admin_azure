# Aufgabenbezogene App-Bedienung – 18.10.2026

Grundlage: Microsoft-Referenzpaket vom 15.10. und nachfolgende explizite
Sammelfreigabe. Aktive Rangfolge: [ux-current-approval.md](ux-current-approval.md).
Keine zweite Foundation, keine neuen fachlichen Prozesse oder Infrastruktur.

## Gemeinsame Muster und Bereichszuordnung

Die bestehende Zuordnung von 76 Seiteneinstiegen und zwölf Operator-Varianten
bleibt die Grundlage; kein neues paralleles Routeninventar.

| Bereich | Aufgabe und gemeinsame Darstellung |
| --- | --- |
| Übersicht | Kennzahlen, Schnellaktionen, letzte Vorgänge; Original-Icon + One |
| Kunden, Projekte, Produkte, Mitarbeiter | RecordsControls/RecordsView, Suche/Filter/Sortierung und Erstellen in einer Inhalts-Command-Bar |
| Kundendossier | Wesentliche Kontakt-/Finanzdaten zuerst; Dokumente mit Suche, Kontakte mit Aktionen, Aktivitäten mit Suche und Schweizer Tagesgruppen |
| Finanzen | CashOverview mit Zeitraum; eigene berechtigte Analyse als früher Tab, Dokument-/Zahlungslisten mit passenden Filtern |
| Zeit | Timer bleibt live; Einträge über gemeinsamen Datenzugriff, vorhandene Zeitraum-/Mitarbeiter-/Abrechnungsfilter |
| Routegebundene Erfassungen | Vorhandener FormSheet-Workspace mit Fokus, Validierung, Entwurfsschutz und eindeutigen Abschlussaktionen |
| Einstellungen und Unterseiten | Bestehender Katalog und Kontextheader; Einladen im Inhaltsbereich statt im globalen Header |
| Chat, Benachrichtigungen, Support | Vorhandene fachliche Owner, erreichbare Aktionen; Such-/Dialoghintergrund gesperrt |
| Operator | Bestehende zwölf Varianten und Rechte; Erstellen bleibt in der Inhaltsüberschrift, Auswahl verwendet den gemeinsamen Owner |
| Login, Registrierung, Splash | Bestehende Auth-/Bootstrap-Owner; Registrierung fragt Firma und Kontaktname getrennt ab |
| Öffentliche/Rechtsseiten | Fachlich passende Website-Struktur; keine künstliche Listen- oder Suchleiste |

Suche wird nur dort eingesetzt, wo Datensätze/Informationen gefiltert werden.
Leere mobile Bereichsüberschriften ohne Aktionen werden ausgeblendet; Dashboard
und echte Kontext-/Detailüberschriften bleiben erhalten.

## Konkrete Änderungen

- AppShell bündelt Suche/Filter/Erstellen; beschrifteter blauer Button, Mobile
  Kurzlabel „Neu“, vollständiger zugänglicher Name und mindestens 44px Touchziel.
- SelectControl behält das echte Formularfeld, Validierung und Change-Verhalten;
  gemeinsame Popup-Darstellung mit Pointer/Tastatur, Disabled und Escape.
- Ref-counted Scroll-Sperren verhindern, dass eine geschlossene Kindauswahl
  einen weiterhin offenen Dialog entsperrt. Fokusführung bleibt beim Dialog.
- Suchfeld-Fokus wird nicht abgeschnitten; Benachrichtigungs-Zurückgrafik und
  Inhalt teilen die linke Ausrichtung. Aktive Zeit ist zentriert, ruhig blau.
- Zentrale Buttons/Navigation behalten ihre vorhandene Press-/Fokusdarstellung.
  Echte Dokument-/Aktionszeilen erhalten Feedback im jeweiligen CSS-Owner;
  Statuspuls respektiert Reduced Motion.
- Kundenanlage speichert Kontakt atomar mit dem Kunden; der letzte aktive
  Kontakt kann nicht entfernt werden. Legacy-Datensätze bleiben editierbar.
- Gemeinsame Query-Snapshots leben nur im Arbeitsspeicher, maximal 60 Einträge,
  30 Sekunden, getrennt durch Session- und Domainrevision. Mutation, Sessionwechsel,
  explizites Neuversuchen und bestehende Revalidierung bleiben wirksam.

Die Snapshot-Änderung reduziert wiederholte Navigation-GETs; sie ist kein
Nachweis einer verbesserten Azure-/Datenbank-Antwortzeit. Timer und Downloads
werden nicht als Navigation-Snapshots behandelt.

## Prüfung und Grenzen

Gezielt: Typecheck, Lint, Kontakt-/Registrierungsintegration und Cache-, Kontakt-,
Tagesgruppen-/Scrollsperren-Regressionen. Sechs isolierte echte React-Renderfälle
bei 320/390/1024px in Light/Dark sowie zehn bestehende Workspace-Renderfälle
prüfen Tastatur, Fokus, Scroll, Safe Areas und negative Layoutproben.
Die bestehende CI-Browserprüfung erhält echte Popup-/Formular-/Nested-Lock- und
Warm-Navigation-Prüfungen; verpflichtende Gates bleiben bestehen.

Keine vollständige lokale Browsermatrix oder Produktionsbuild. Gesamt-Quality,
CodeQL und Browserabnahme folgen gemeinsam am finalen PR-Head. Bis zum tatsächlichen
Ergebnis sind sie offen. Kein stilles Akzeptieren neuer Screenshot-Baselines.
Physische iOS-/Android-PWA, VoiceOver/native Tastatur und alle Hardwarekombinationen
sind durch Desktop-Emulation nicht nachgewiesen. Keine Behauptung vollständiger
visueller Abnahme allein aufgrund der Routen-/Quellinventare.

Ein gemeinsamer PR, kein automatischer Merge und kein Deployment.
