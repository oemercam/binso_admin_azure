# Seiten- und Prozessprüfung 06.10.2026

## Gemeinsamer Standard
Übersichten: Kopfzeile, Hauptaktion, Suche/Filter, Tabelle. Details: Hauptinhalt und kompakte Kontext-/Aktionsleiste. Dokumente: Übersicht oder Dokument; keine gleichzeitige doppelte Darstellung. Formulare: Pflichtangaben zuerst, konsistente Speicheraktion. Mobile bleibt einspaltig.

## Korrekturen dieser Änderung
- Angebot und Rechnung wechseln zwischen Übersicht und Dokument statt permanenter Doppelanzeige.
- Bearbeitung und Dokumentöffnung stehen in der Kopfzeile; keine zweite Aktion in der Desktopleiste.
- Zahlungsstand der Rechnung zeigt bezahlt/offen.
- Kunden-/Personal-/Zahlungsdetails nutzen zwei statt drei erzwungene Spalten; redundant vorhandene linke Kurzansicht entfällt.
- Spesen-API sperrt Genehmigung/Ablehnung für Mitarbeiter und andere nicht genehmigungsberechtigte Rollen.

## Prüfgrenzen / offene Abläufe
Die Route-Inventur und Quellcodeprüfung ist keine vollständige Live-Abnahme jeder Rolle. Nicht abgeschlossen: tatsächlicher Dokumentversand, Angebotsannahme/Statusübergänge, vollständiger Spesenprozess mit Erstattung/Weiterverrechnung, Zuordnung von Zeiten zu bestehenden Rechnungsentwürfen, separate Aufträge/Projekte/Lohn/MWST/Berichte-Module, vollständige Übersetzung und rollen-/planabhängige Navigation. Keine dieser Funktionen wird durch diese Änderung als fertig ausgewiesen.
Zeitfreigabe ist serverseitig auf owner/admin/project_manager eingeschränkt, Verrechnung nur für freigegebene, unverrechnete kundengebundene Zeiten. Tenant-Integrität und Datenbanksperren bleiben Bestandteil der bestehenden Tests.

## Vollständiges Seiteninventar
- /agb
- /angebote
- /angebote/[id]
- /angebote/neu
- /auftragsbearbeitung
- /belege
- /benachrichtigungen
- /dashboard
- /datenschutz
- /demo
- /einstellungen
- /einstellungen/abonnement
- /einstellungen/benachrichtigungen
- /einstellungen/darstellung
- /einstellungen/datenschutz
- /einstellungen/dokumente
- /einstellungen/firma
- /einstellungen/konto
- /einstellungen/sicherheit
- /einstellungen/sprache
- /einstellungen/team
- /email-bestaetigen
- /finanzen
- /impressum
- /kunden
- /kunden/[id]
- /kunden/neu
- /login
- /mitarbeiter
- /mitarbeiter/[id]
- /mitarbeiter/neu
- /offline
- /operator
- /operator/[...section]
- /operator/login
- /page.tsx
- /passwort-vergessen
- /passwort-zuruecksetzen
- /portal
- /portal/login
- /portal/registrieren
- /preise
- /preview/dashboard
- /preview/rechnungen
- /preview/zeit
- /produkt
- /produkte
- /produkte/[id]
- /produkte/neu
- /rechnungen
- /rechnungen/[id]
- /rechnungen/neu
- /registrieren
- /spesen
- /spesen/[id]
- /spesen/neu
- /support
- /support/[id]
- /support/neu
- /unterauftragsbearbeiter
- /willkommen
- /zahlungen
- /zahlungen/[id]
- /zahlungen/neu
- /zeit
