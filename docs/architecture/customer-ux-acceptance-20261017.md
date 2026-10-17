# Kundenbereich: Referenzabgleich und Abnahme, 17.10.2026

## Quelle und Umfang

Microsoft-Paket vom 15.10.2026 unter docs/audit/v24/reference/, mit der ausdrücklichen Rangfolge vom 17.10.2026. Originaldateien, Hashes und Navigationsverträge bleiben erhalten. Kein Deployment und keine Infrastrukturarbeit.

Desktop- und mobile Kundenliste sowie Dossier wurden mit den Originalrenderings bei 1440 × 1000 und 390 × 1000 verglichen. Lokale Referenznachweise: ux-next-reference/reference-customers-{1440,390}.png und reference-detail-{1440,390}.png. Vorher: cleanup-orphan-ui-after/light-{1440,390}-_kunden*.png. Alle Produktnachweise nutzen isolierte synthetische API-Fixtures, keine produktiven Kundendaten. Unterschiedliche Namen, Beträge und Zeilenzahlen sind keine kopierten Geschäftsanforderungen.

## Nachgewiesene Korrekturen

- DetailSections bündelt Kontakt und ergänzende Adresse in einer gemeinsamen Desktop-Kontextspalte. Bisher war die Adresse an die linke Rechnungszeile gekoppelt; jetzt folgt sie direkt dem Kontakt. Mobile bleiben Finanzen, Kontakt, Rechnungen und aufklappbare Zusatzdaten in dieser Reihenfolge.
- Bestehender Collections-Owner enthält die Geometrie. Keine Seiten-CSS-Datei, neue Foundation, zusätzliche Kennzahl oder Geschäftsberechnung.
- Kontaktbearbeitung verwendet einen nativen Button mit separater Aktionsschaltfläche statt eines interaktiven div mit verschachteltem Button. Native Tastatursemantik und Read-only-Sperre bleiben eindeutig; Aktionen mindestens 44 px.
- Dossier-Laden und Fehler verwenden LoadingState und ErrorState mit gezieltem Retry. Bestehende API-, Auth-, Rollen-, Session- und Finanzlogik bleibt unverändert.
- Screenshot-Dateinamen des vorhandenen Browserwerkzeugs bereinigen jetzt auch Query-Zeichen für Windows. Keine Assertion oder Baseline wird abgeschwächt.

## Bereits korrekte und erhaltene Bestandteile

Zentrale Shell mit echtem Markenasset, Header-Suche und Commandbar; RecordsControls/RecordsView mit Filter-, Such-, Sortier-, Seiten- und Rückkehrzustand; DetailTabs mit Pfeiltasten/Home/End; reale Finanzkennzahlen und Statistik im Dokumenttab; Kontakte, Dokumente und Aktivitäten; gemeinsame Sheets/Dialoge mit Escape, Fokus und Safe Areas. Gemessene Kennzahlspalten waren bereits korrekt verteilt und wurden nicht verändert. Nicht verwendete Kunden-Wrapper oder fachliche APIs werden nicht pauschal entfernt.

## Visuelle Einordnung

| Bereich | Einordnung |
| --- | --- |
| Weisse Flächen, blaue Auswahl, offene Kennzahlen, Zeilentrenner, Dossier-Kontextspalte | Originalreferenz |
| Reales Logo, vollständige erlaubte Fachnavigation, Neuer-Kunde-Aktion | Bewusst erhaltene Produktfunktion; Entwurfs-Platzhalter nicht kopieren |
| Zusätzlicher Kontakte-Tab, vollständige Adresse, Dateiverwaltung und echte Finanzstatistik | Fachlich erforderliche Ergänzungen, aus bestehenden Komponenten abgeleitet |
| Dark Mode, Lade-/Leer-/Fehler-/Read-only-Zustände, Tablet und 320 px | Abgeleitet, nicht als separat original-freigegeben behauptet |
| Bestehende Glass-/Dock-Navigation gegenüber schematischer mobiler Referenz | Getrenntes kontrolliertes Navigationspaket; aktuelle Schutztests unverändert |

## Prüfstatus

Lint, Typecheck und Produktionsbuild bestanden. Foundation-/CSS-/UI-/Referenz-/Navigations-/Lokalisierungsprüfungen sowie kundenbezogene Finanzprojektion über Währungen, Gutschriften, Zeitgrenzen und Mandanten bestanden. Die neue Dossierprüfung schlägt gegen den alten Build tatsächlich fehl (kein gemeinsamer Kontext-Owner). 40 gezielte Chromium/Edge-Routen-/Viewport-/Theme-Fälle bestanden: Kundenliste und vier Dossier-Tabs bei 320/390/820/1440 px in Light/Dark. Die Kunden-Interaktionen bestanden in beiden Themes: Suche, Filter, Sortierung, Seiten-/Rückkehrzustand, minimale Erfassung und Wiederaufnahme, Dialoge im kurzen Viewport sowie neue Lade-/Fehler-/Retry-/Leer-/Read-only-/Tastatur-/Fokusprüfungen. Nachher: ux-customers-final-after mit Screenshots und DOM-Geometrie. Sichtprüfung von Desktop/Mobile, Dark Mode, Kontakt-Sheet, Read-only und Dokumenttab durchgeführt. GitHub-Pflichtchecks und vollständige Releaseabnahme bleiben vor Integration beziehungsweise Release erforderlich.

## Nächster Schritt

Kundenpaket mit vollständigen lokalen Zustandsnachweisen und GitHub-Pflichtchecks abschliessen. Danach Navigation separat gegen die dokumentierte Rangfolge prüfen; erst mit konkretem Ersatz und Fokus-/Tastatur-/Safe-Area-Nachweisen Verträge kontrolliert anpassen. Vollständige Browser-/Releaseabnahme bleibt vor Release erforderlich.
