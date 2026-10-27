# Verbleibender Monitoring-Audit: Abonnementgrenzen

Der ältere Architektur-Audit rief weiterhin einen Shell-Check auf, der Insights,
Aktionsgruppen und Alarme nur im aktuell angemeldeten App-Abonnement zählte.
Die App und PostgreSQL liegen im Sponsorship-Abonnement; die vorhandenen
Monitoring-Ressourcen liegen im MCPP-Abonnement. Deshalb konnte dieser Check
trotz existierender korrekter Ressourcen „Application Insights is missing“ melden.

Der Shell-Einstieg delegiert nun an die beiden bestehenden, unveränderten und
exakt auf Ressourcen begrenzten Readiness-Verträge. Geprüft werden App-Zustand,
Ressourcen-IDs und Zuordnungsmetadaten, HTTP-5xx-Kriterien, App-Scope, aktivierte
Aktionsgruppe und Empfänger sowie die Workspace-Zuordnung. Falsche oder fehlende
Ziele und Berechtigungsfehler bleiben Fehler. Es werden nur GET-Anfragen ausgeführt.
Eine Zählung beliebiger Ressourcen im falschen Abonnement genügt nicht mehr.

Der Integrationstest führt den echten Shell-Einstieg und beide echten Node-CLIs
aus. Nur die Azure-GETs werden durch einen temporären Peer ersetzt. Geprüft werden
beide vollständigen Ressourcenmengen, verweigerte Zugriffe, fehlende Ressourcen,
falsche Scopes, fehlende Zuordnung, falsche Alarmkriterien, fehlende Empfänger und
ungültige API-Antworten. Bestehende Runtime-/RLS-/Issuer-Gegenproben bleiben erhalten.

Im Zuge der GitHub-Bereinigung wurde die fehlende `hidden-link`-Zuordnung der
bereits im Projektregister festgelegten Insights-Ressource zur App korrigiert.
Dabei wurden ausschließlich Ressourcen-Metadaten ergänzt. App-Einstellungen
wurden nicht geändert, keine zusätzliche Telemetrie-Aufzeichnung aktiviert und
keine kostenpflichtige Infrastruktur eingerichtet.

Diese Konfigurations-/Zuordnungsprüfung beweist keine SDK-Telemetrie, tatsächliche
Alarmzustellung oder menschliche Abnahme. Die bestehenden externen Nachweisgrenzen
und Produktionsfreigaben bleiben unverändert.
