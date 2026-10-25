# Gesamtaudit und zentrale Korrekturen – 25. Oktober 2026

## Auftrag und Basis

Zweistündiger lokaler Auftrag ab 17:56:51 UTC, spätestens 19:56:51 UTC beenden.
Basis ist der veröffentlichte Main-Commit `28686510c822afd8da70c15aa2d36d8d27697210`.
Branch: `fix/full-app-audit-20261025`. Verbindlich bleiben V7.1 und das freigegebene
Kundendetail-Kartenmuster; Geschäftsprozesse, Finanzdefinitionen, RLS, MFA,
Navigation/FAB und Tarife werden erhalten. Fachmodule bekommen ihren Hauptort
unter Mehr, ihre Datensätze und Berechtigungen ändern sich nicht.

Die [frisch aus dem Code abgeleitete Inventur](full-app-audit-20261025/inventory.json)
enthält sämtliche Quellrouten, Admin-Varianten, APIs und konkrete Übersetzungslücken.
Die Inventur ist kein Nachweis, dass jeder dynamische Zustand ausgeführt wurde.

## Belegte Befunde und Umsetzung

| ID | Problem / Codebeleg | Korrektur / Nachweis |
| --- | --- | --- |
| A01 | Freistehende `.detail-list`, `.action-list` und `.plan-hero` fehlen im Material-Owner. Produkt-/Vertragsdetails und Sonderansichten bleiben flach. | Vorhandenen Owner in `app/design-system/layout.css` erweitert. Ein Rahmen je Gruppe; verschachtelte Gruppen bleiben ohne zweiten Rahmen. Die erweiterte Browserprüfung scheitert am alten Build nachweislich an einer rahmenlosen Datenliste. |
| A02 | `.detail-list` verwendet alte 13-px-Texte und teils 42/44-px-Zeilen. | Zentral 14 px, 48 px Mindesthöhe, vertikal ausgerichtete und rechtsbündige Werte; mobile Formularschrift bleibt 16 px. |
| A03 | Fachmodule stehen im Einstellungskatalog. Die mobile Mehr-Navigation bietet einige vorhandene Module nicht direkt an. | Produkte, Lieferanten, Verträge, Mitarbeiter und Abwesenheiten im vorhandenen berechtigungsgefilterten Mehr-Katalog; Fachmodule aus Einstellungen entfernt. Bottom-Navigation/FAB-Geometrie unverändert. |
| A04 | `EmployeeForm` berechnet einen abweichenden Zeitstatus und übergeht Einreichung/Rückweisung. | Verwendet `timeEntryStatus`. Regression führt die tatsächliche Mitarbeiterzeilen-JSX mit allen kanonischen Statusfällen aus. |
| A05 | `accessFromSession` erfindet bei fehlendem Tarif Pro. | Fehlende Rolle oder unbekannter/fehlender Tarif werden abgelehnt; sichtbarer Fehler mit Wiederholung statt Freigabe oder endlosem Start. Tatsächliche Guard-Deklaration positiv und negativ ausgeführt. Backend-Sicherheitsgrenzen unverändert. |
| A06 | Einladungsbetreff, -inhalt und -link sind fest deutsch. | Bestehende Mail-Lokalisierung mit fünf Sprachen, gewählter UI-Sprache und sprachgebundenem Link. Gleiche persistierte Outbox wie Versand; Rollen, frische Bestätigung, Rotation, Replay und RLS bleiben geprüft. Keine echte Mail versendet. |
| A07 | Datenabhängige Produkttypen, Zahlungsarten und Datumshelfer umgehen die gewählte Sprache. Produktbeschreibung kann mit einem Katalogwort kollidieren. | Vorhandene Übersetzungs-/Datums-Owner verwenden; Namen und Beschreibungen bleiben echte Benutzerdaten. Bestehende Zahlen, Preise und Kalendertage bleiben erhalten. |
| A08 | `readSetupGuide` benötigt drei sequenzielle Datenbankabfragen. | Eine mandantengebundene Abfrage für Firma, eigene Ausblendung und unveränderte Kapazitätsprädikate. Echter migrierter/RLS-Test prüft Ergebnis, Rollen, eigene Präferenz und genau einen Aufruf. Keine Berechtigungs- oder Abo-Caches. |
| A09 | Unbenutzter Modulkatalog in `lib/modules.ts` enthält veraltete, nicht vorhandene Navigationsziele; Listen enthalten alte Demo-ID-Fallbacks. | Nach Importprüfung unbenutzten Katalog entfernt, benötigten `ModuleKey` erhalten. Produkt-/Mitarbeiterlisten verwenden reale IDs. |
| A10 | Berichte rendern bei fehlenden Zahlungs-/Spesenrechten eine leere Informationskarte. | Ganze Karte bedingt rendern; fachliche Erklärungen bleiben bei zugehörigen Daten erreichbar. |
| A11 | Mobiler Zurück-Test misst Existenz und Sichtbarkeit in verschiedenen DOM-Zuständen. | Wartet auf sichtbaren Button und misst Sichtbarkeit, 44-px-Zielfläche sowie nicht abgeschnittenes Icon atomar. Keine Fehlerunterdrückung oder Zeitlimit-Erhöhung. |
| A13 | Desktop-Detailaktionen belegen eine eigene 68-px-Zeile samt zusätzlicher Trennlinie. | Vorhandene `DetailHeading` bringt Aktionen direkt in die Titelzeile; mobile Header und fachliche Formular-Footer bleiben erhalten. |
| A12 | Türkisch ist in großen Teilen des Hauptkatalogs nicht vorhanden. | 174 fehlende Kerntexte ergänzt. Übrige fehlende Texte werden im Inventar vollständig aufgeführt; keine vollständige türkische oder rechtliche Abnahme behauptet. |

## Prüfung und tatsächliche Grenzen

Die gezielten Rollen-/Modul-/Tarifprüfungen, Registrierungsintegration,
MFA-/RLS-/Identitätsprüfungen, Mail-MIME-Prüfung, fünfsprachiger tatsächlicher
Einladungs-/Outbox-Ablauf, Einrichtung und Status-/Sprachregressionen bestanden
während der Umsetzung. Frühere fehlgeschlagene Versuche werden nicht als Erfolg
gezählt. Der erste Build fand einen bei der Bereinigung versehentlich entfernten,
tatsächlich benötigten `domainConfig`-Import; er wurde wiederhergestellt.

Eine echte lokale API-Messung ohne Antwort-Mocks ergab für acht parallele
Anfragen 433 ms im ersten Durchgang und 175/163 ms in den Folgedurchgängen,
jeweils HTTP 200. Einzelne warme Antworten lagen bei 66–174 ms. Das ist ein
isolierter leerer Testmandant auf lokalem PostgreSQL, kein Azure-, Last- oder
iPhone-PWA-Nachweis. Daraus folgt keine Zusage zu produktiven Ladezeiten.

Abschließende vollständige Code-/Browser-/HTTP-Prüfungen: noch in Arbeit.
Die bisherigen Ergebnisse sind keine pauschale Abnahme jeder Rolle und jedes
bedingten Formular-/Fehlerzustands. Echte iPhone/iPad-PWA, externe Zustellung,
Providerkonfiguration, vollständige fünfsprachige Sichtprüfung und juristisch
freigegebene Rechtsübersetzungen bleiben eigenständige offene Nachweise.

Keine produktiven Datenänderungen, Migrationen, GitHub-Pushes, Merges oder
Deployments wurden in diesem Auftrag ausgeführt. Lokale Tests verwenden
ausschließlich ausgewiesene isolierte Testdatenbanken und synthetische Konten.
