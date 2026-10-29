# Globale Darstellungslogik vom 27. Oktober 2026

Status: lokal umgesetzt und gezielt geprüft, keine visuelle Gesamtabnahme,
kein Merge und kein Deployment freigegeben. Der neue Auftrag ersetzt nur
widersprechende Darstellungsregeln; Geschäftslogik und Sicherheitsregeln gelten weiter.

## Fachliche Entscheidung

| Art | Gemeinsamer Owner | Anwendung |
| --- | --- | --- |
| Umfangreiche Erfassung/Bearbeitung | FormPage im bestehenden AppShell | Kunden, Mitarbeitende, Produkte, Lieferanten, Ausgaben, persönliche/Firmenangaben, Dokumenteinstellungen |
| Mehrstufiger Fachprozess | FormPage mit vorhandenem FormWizard | Verträge, Vertragsrevisionen, Familien-/Anstellungs-/Lohndaten, Lieferantenrechnungen, manuelle Zeiterfassung, Zeitpreisquelle |
| Vorschau mit Tabellen/Übertragungen | FormPage | Kundenimport und Dubletten-Zusammenführung |
| Vollständige Detailansicht | Bestehende Route und AppShell | Bestehende fachliche Detailrouten bleiben erhalten |
| Kurze Eingabe/Auswahl | FormSheet | Kontakt, Zahlung, Projekt, Support, Erstattung, Bankwechsel, Einladung, Rollen-/Rechteauswahl, Berichtversand, Dokumentposition und Rabatt |
| Kontextaktion/Filter | ActionSheet, FilterSheet, ActionsMenu, HeaderPanel | Bestehende Listenfilter und Drei-Punkte-Menüs bleiben erhalten |
| Kritische Bestätigung | ConfirmDialog, zentraler Fresh-Auth-Owner | Verwerfen, Löschung, kritische Kontoänderungen |
| Spezialisierte Darstellung | Vorhandener zentraler Viewer/Consent-Owner | PDF, Datenschutz; keine neuen lokalen Modal-Implementierungen |

Fachrechte sind eine begrenzte Liste von Schaltern ohne Unterprozess; sie bleiben
eine kurze kontextbezogene Auswahl. Zeitabrechnungs-Auswahl, Diagnose-Kurzinfos,
Operator-Plan/Status und öffentliche Angebotsentscheidung bleiben kompakt.
Die Feldanzahl allein ist kein Entscheidungskriterium: Dokumentpositionen gehören
als Kontext zum übergeordneten Dokument, Importtabellen benötigen dagegen eine Seite.
QA-Lab-Beispiele sind Testoberflächen, keine zusätzlich umgebauten Fachprozesse.

## Gemeinsame Umsetzung

FormPage verwendet den vorhandenen Shell-Header und dessen Seitenränder. Der
Hintergrund bleibt für Zustandswiederherstellung montiert, ist während der
Bearbeitung unsichtbar. Nacheinander geöffnete Seiten zeigen nur die aktuelle
Seite. Es entsteht kein zweiter modaler Header. Formularinhalt scrollt innerhalb
der verfügbaren Höhe; die Aktionszeile nimmt eigenen Platz ein. VisualViewport,
Safe Area und bestehende Navigation begrenzen die verfügbare Höhe. Bestehende
Menü-Sperren während laufender Aktionen bleiben erhalten.

Die Firmenvervollständigung enthält Firmenname, Adresse und Zahlungskonto in
einem Formular. Eine atomare Änderung speichert alle Pflichtbereiche gemeinsam.
Frische Sicherheitsbestätigung, Rollenprüfung und Tenant-Isolation gelten weiter.
Steuern, Texte, Logo und andere optionale Einstellungen bleiben in ihren Bereichen.
Historische Setup-Links werden auf dieselbe Seite geführt; es gibt keinen Schrittwechsel.

## Nachweise und offene Abnahme

Verhaltenstests prüfen eine Seite, fehlende Pflichtangaben, Fehler, ausstehende
Speicherung, schreibgeschützten Zugriff und unveränderte optionale Einstellungen.
Der migrierte isolierte Datenbanktest prüft den echten API-Pfad einschliesslich
Rollen-/Tenant-Verweigerung und vollständigem Rollback bei einem erzwungenen Fehler.
Die gezielte Browsermatrix ist mit Chromium und WebKit, Telefon/Tablet/Desktop sowie
Light/Dark grün (12 Kombinationen). Sie prüft Firmenvervollständigung, Kundenerfassung,
manuelle Zeiterfassung und eine kompakte Passwortaktion, einschliesslich reduziertem
Sichtbereich, Entwurfsschutz, Browser-Zurück und Tastatur-Fokusrückkehr. Die zentrale
Platzierung zeigt keine editierbaren Felder vor dem stabilen Portalziel; frühe Eingaben
bleiben erhalten. Laufende Schreibvorgänge sperren den Eingabebereich. Das Schliessen
einer untergeordneten Seite gibt keinen übergeordneten Entwurf pauschal frei.
Diese Emulation ist kein Nachweis für physisches iPhone
Safari, installierte iOS-PWA, reale Bildschirmtastatur oder physisches iPad.
Die vollständige bestehende Routenmatrix und reale Geräteabnahme bleiben Pflicht
vor einer behaupteten visuellen Gesamtabnahme. Keine Baselines werden automatisch akzeptiert.

Das [Inventar](../audit/global-surfaces-20261027/inventory.md) enthält 155 zentrale
Surface-Aufrufe. Die kanonische statische Architekturprüfung umfasst 88 Routen und
12 Operatorvarianten. Details und Einschränkungen: [Prüfbeleg](../audit/global-surfaces-20261027/validation.md).
