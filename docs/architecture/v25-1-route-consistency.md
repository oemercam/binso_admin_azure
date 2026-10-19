# V25.1 – verbleibende Darstellungsabweichungen

Basis: ausgelieferter Main `11eff375f6ebfd86ef660236004503edd1dd964f`.
Branch: `ux/v25-1-route-consistency`. Kein Merge/Deployment aus diesem Auftrag.

Die bestehende [Routenmatrix](v25-audit.md), [V25.1-Anforderungen](v25-1-requirements.md)
und [Abnahmematrix](v25-1-acceptance.md) bleiben Grundlage. Dieses Dokument ergänzt
konkrete Befunde; es ersetzt die Matrix nicht durch eine zweite Foundation.

## Ursachen und Korrekturen

| Befund | Ursache / Owner | Korrektur | Nachweis |
| --- | --- | --- | --- |
| Profilbildauswahl im Hintergrund | AccountSettingsPage rendert den Picker ausserhalb des geöffneten, modalen Formulars; der Hintergrund ist absichtlich inert | FileUpload im tatsächlichen Formular, Busy-Sperre, Fehler am Feld, anschliessend Profil neu abrufen | Browser: sichtbare Bedienung innerhalb des Dialogs; Quarantäne/Ausfall/Erfolg bleiben geprüft |
| Unterschiedliche Dateiauswahl | Profil, Supportformular und Komponentenreferenz besitzen eigene sichtbare Controls | Gemeinsamer FileUpload, vorhandene kontextgebundene Anhangsmenüs bleiben erhalten | Tatsächliche FileUpload-Callbacks; Supportentwurf auswählen/entfernen ohne Ticketanlage |
| Unterschiedliche Dateigrenzen | Nur manche Picker prüfen Dateityp und Grösse; leere Dateien werden teils erst serverseitig abgewiesen | Gemeinsames fileSelectionError für Formulare, Chat, EntityFiles und Kamera/OCR; gleicher erlaubter Typumfang je Zweck | Positive exakte Grössengrenzen; leere/zu grosse/ungültige Metadaten, falscher Typ, Busy/Read-only; Server bleibt unverändert |
| Uneinheitliche Leerzustände | Kundenübersicht/Kontakte/Aktivitäten, Dashboard, Sitzungen, Operator und Monitoring zeichnen einfache Absätze | Gemeinsamer EmptyState mit unveränderten vollständigen Meldungen; Suche ohne Treffer von fehlender Aktivität unterscheiden | AST-Regel über sämtliche aktiven App-/Komponentenquellen und tatsächlicher EmptyState-Renderer |
| Titel-/Aktionsdrift | Dokumenteditor und Operator umgehen SectionTitle; alte direkte CSS-Kindselektoren passen nicht zur gemeinsamen Aktionsgruppe | SectionTitle verwenden; Links/Icon-Aktionen am tatsächlichen Gruppenknoten gestalten, normale Buttons nicht überschreiben | Renderer-/AST-Gegenfälle; Browser prüft Titel/Aktionen auf Überlappung und Containergrenzen |
| Uneinheitliche Auftragsdetails | Eigene Zeiteintragsliste und Rechnungsnavigation ohne die bereits gelieferten Beträge/Statuswerte | TimeEntryRow und RecordRow mit zentraler Währungs-/Statusbeschriftung | Browser prüft Zeitbeschreibung sowie Rechnungsbetrag und Status; keine zusätzlichen Datenabfragen oder Berechnungen |
| Einladungsdarstellung | Überschrift trotz ausschliesslich abgelaufener Einladungen; direkte Einzelaktion und verschobene Grid-Spalten | Nur ausstehende gültige Einladungen anzeigen, gemeinsamer Titel, Mail-Icon und kontextgebundenes Menü; bestehendes Zurückziehen bleibt gleich | Fehler/Retry/Doppelklick und leere Sektion als Browsergegenfälle; Rollen- und API-Regeln unverändert |
| Tote Sondergestaltung | Supportformular besitzt eigenen attachment-button-Stil | Nach Migration unbenutzten Selektor entfernen | Quellprüfung und vollständige CSS-Kaskadenprüfungen |
| Widersprechende aktive Anleitung | reference-foundation verlangt noch Betrag/Label im Ring | Aktive Anleitung auf die bereits freigegebene V25.1-Aussenposition aktualisieren | Originalreferenzdateien unverändert; Rangfolge bleibt erhalten |

Profilbildauswahl bleibt wie bisher eine ausdrückliche unmittelbare Dateiaktion
über die vorhandene API. Sie wird nicht als rückgängig machbarer Profilentwurf
ausgegeben. Kein neuer Entfernen-Befehl ohne vorhandene Profil-API.

## Prüfung nach Seitenfamilie

Quellprüfung bedeutet keine automatische visuelle Freigabe. Bestehende zentrale
Owner werden nicht allein wegen anderer Daten oder semantischer Überschriften
ersetzt. Kein pauschales Löschen responsiver CSS-Regeln oder fachlicher Tests.

| Familie / zugehörige Unteransichten | Prüfumfang und Ergebnis |
| --- | --- |
| Dashboard | Gemeinsame Kennzahlen/Dokumentzeilen erhalten; abweichenden Leerzustand korrigiert |
| Kunden: Liste, Dossier, Kontakte, Dokumente, Aktivitäten, Erfassung/Bearbeitung | Zentrale Records/Details/Sheets erhalten; Leerzustände, Suchergebnis und Dublettenüberschrift korrigiert |
| Angebote/Rechnungen: Listen, Details, Editor, Vorschau, Anhänge | Gemeinsame Dokument-/PDF-Owner erhalten; Editor-Abschnittsaktionen korrigiert; EntityFiles-Dateifeedback vereinheitlicht |
| Finanzen, Analyse, Zahlungen, Berichte | Bestehende Cash-/Statistik-/Status-Owner und Datenabgrenzung erhalten; globale Aktionsgruppen gelten auch hier. Kein Eingriff in Berechnungen |
| Aufträge: Liste, Detail, Erfassung/Bearbeitung | Detailzeilen/Abschnittstitel korrigiert; bestehende Formulare und Navigationsziele erhalten |
| Produkte/Leistungen und Mitarbeitende: Listen, Details, Editor | Bereits Records/Field/FormSheet/Status/EntityFiles; gemeinsame Anhangskorrektur wirkt auch hier |
| Zeit: Timer, Einträge, manuell, Monatsrapport, Verrechnung | Bestehende zentrale Owner, Wiederherstellung und Pflichtzuordnung erhalten; keine Änderung von Timer oder Berechtigungen |
| Spesen: Liste, Detail, Editor, Beleg/OCR | Abschnittstitel und Dateifeedback korrigiert; Kamera, OCR und Freigabeabläufe erhalten |
| Support: Liste, Ticketanlage, Chat, Anhänge | Gemeinsamer Datei-Control im Formular, Kontextmenü im Chat erhalten; Composer/Tastatur/Nachrichtenlogik unverändert |
| Einstellungen: Konto, Firma, Dokumente, Team, Sicherheit, Datenschutz, Sprache, Darstellung, Benachrichtigungen, Zeit, Abo | Profilpicker, Einladungen und Sitzungsleerzustand korrigiert; zentrale Gruppen/Felder/Schalter und unabhängige Präferenzen erhalten |
| Benachrichtigungen/Mehr | Bestehende ActionRows und einfache Navigation erhalten |
| Operator: Überblick, Kunden, Support, Zahlungen/Finanzen, Sicherheit, Audit, Monitoring, weitere Dispatch-Varianten | Globale Aktionsgruppierung und Leer-/Berechtigungszustände korrigiert; Geschäftsdaten, Filter und Rollen unverändert |
| Öffentliche Seiten, Auth, Registrierung, Passwort/MFA, Einladungen, Rechtliches | Alle App-/Komponentenquellen in den Strukturgegenfällen enthalten; semantische Texte und Auth-Schutz unverändert; bestehende Browser-/Registrierungssuiten bleiben Pflicht |
| Offline, Wartung, Vorschau, Fehlerseiten, Komponentenreferenz | Bestehende Zustandsowner erhalten; sichtbaren nativen Test-Dateipicker ebenfalls migriert |

## Nachweise und offene Grenzen

- Lokal: gezielte Komponenten-, Struktur-, Kaskaden-, Lokalisierungs- und
  Workflowregressionen sowie Lint/Typecheck. Offizielle Inventare werden mit den
  bestehenden Generatoren aktualisiert, niemals durch manuelle Fingerprints.
- CI: vorhandene vollständige Routen-/Browsermatrix einschliesslich Light/Dark,
  schmalen und breiten Ansichten und funktionalen Gegenfällen. Lauf und genauer
  geprüfter SHA werden im PR dokumentiert; fehlende Läufe gelten nicht als Erfolg.
- Zusätzliche Screenshots: Profilpicker im Dialog und verknüpfte Auftragsdaten.
  Synthetische Fixtures sind keine Produktivdaten.
- Die Quellprüfung findet eindeutige Strukturabweichungen. Sie kann weder jede
  denkbare Datenkombination noch jede visuelle Abweichung beweisen. Echte
  iPhone-/installierte-PWA-, Tastatur- und Startup-Abnahme bleibt separat offen.
- Navigation und blauer Plus-Button unverändert. Keine Azure-, Datenbank-,
  Workflow- oder Produktionsänderungen; PR #267/#271 bleiben unberührt.
