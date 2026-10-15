# Landingpage, Sprachen und Betriebsabläufe – 15.10.2026

## Implementierung

Die bestehende Landingpage verwendet App-Flächen und eine ausdrücklich als Beispieldaten markierte Produktvorschau. Die freigegebene Kunden-/Adminnavigation wird nicht verändert. Öffentliche Seiten und beide Portale verwenden einen zentralen Sprachkatalog für DE/FR/IT/EN, serverseitige Sprachwahl, zugängliche native Attribute und eine dauerhafte Sprachauswahl. Nutzereingaben, IDs und Optionswerte bleiben unverändert. Das Vorschaubild für Social-Media wird ohne Client-Komponenten serverseitig erzeugt.

Bei Anmeldung ist die dauerhafte Sitzung eine explizite Wahl. Ohne Häkchen gibt es ein HttpOnly-Sitzungscookie ohne Expires mit maximal zwölf Stunden serverseitiger Laufzeit. Mit Häkchen gilt die konfigurierte, begrenzte SESSION_TTL_HOURS-Laufzeit (Standard 168 Stunden). Browser können Sitzungscookies beim Wiederherstellen einer Browsersitzung behalten; daher bleibt die serverseitige Ablaufprüfung entscheidend. Anmeldung hat einen Request-Lock und Timeout. Abmeldung bleibt serverbestätigt. Passwort-Reset widerruft bestehende Sitzungen atomar.

Die globale Fehlergrenze funktioniert unabhängig vom Root-Layout und liest die gewählte Sprache. Nicht gefundene Operatorpfade erhalten die gemeinsame 404-Ansicht und HTTP 404. Die App prüft die Sitzung bei Rückkehr in den sichtbaren Zustand erneut. Wiederherstellbare Entwürfe sind nach Benutzer, Firma, Rolle und Prozess getrennt, auf 24 Stunden begrenzt und werden bei Sessionwechsel gelöscht. Zeit- und neue Spesenformulare nutzen denselben Mechanismus wie bestehende Kunden-/Dokumentformulare. Dateianhänge und Zugangsdaten werden nicht als Entwurf persistiert. Manuelle Zeiteinträge unterstützen serverseitig atomaren Idempotency-Key-Replay.

Wartungsmodus: neue Migration 0050, Operator-API und Bedienung unter Monitoring. Änderungen benötigen security:manage, Same-Origin-Prüfung und einen erfolgreichen Audit-Eintrag in derselben Transaktion. Aktivierung ist auf 5–240 Minuten begrenzt. Nach Ablauf ist die Sperre automatisch unwirksam. Kundenseiten antworten währenddessen mit 503/Retry-After und Wartungsansicht; requireSession blockiert die darüber geschützten Kunden-APIs. Operator, öffentliche Seiten, Healthchecks und Provider-Webhooks werden dadurch nicht gesperrt. Bereits laufende Anfragen werden nicht abgebrochen. Dies ersetzt keine unabhängige Azure-/Datenbankwiederherstellung.

## Nachweise und Grenzen

Lokale Katalog-/SSR-, CSS-, Sitzungs-, Auth-Race-, RLS-, Idempotenz- und Wartungsprüfungen prüfen konkrete Implementierung. Die vollständige CI ergänzt Chromium/WebKit für vier Sprachen bei 390/768/1440 Pixeln, persistente Auswahl, Portal-/404-Aufruf und Überlauf. Browsernachweise und Live-Abnahme sind erst nach erfolgreichem Lauf gültig; ein lokaler Build ist keine Produktionsfreigabe.

## Noch offene Konzeptfunktionen

Ein eigener Projektarbeitsbereich mit Liste, Details, Versionsschutz und Statuspflege sowie rollen- und paketabhängige Berichte mit CSV-Export sind implementiert. Laufende oder pausierte Projektzeit verhindert den Abschluss; geschlossene Projekte erlauben keine neue Zeiterfassung. Datenbank-, Mandanten-, Rollen- und Exporttests bestehen; die Browserabnahme steht noch aus. Lohnabrechnung, vollständige MWST-Abrechnung und umfassende Infrastrukturverwaltung sind weiterhin nicht implementiert. Diese Bereiche dürfen nicht als vollständig abgenommen ausgewiesen werden. Schweizer Lohn-/Steuerberechnung benötigt zusätzlich definierte Berechnungsgrundlagen und fachliche Abnahmetests. Es werden keine leeren Navigationsziele als fertige Funktionen ergänzt.
