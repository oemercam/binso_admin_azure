# V23 – Adminportal-Konsolidierung und Observability

Stand: 2026-10-11. **Teilweise implementiert; keine vollständige Enterprise-Abnahme. Kein V23-Produktionsrelease.**

## Ausgangsbasis und Release

Geprüftes GitHub-main und Live: `e33af0192e8c810aebf1845e5622089ec325b8e0`. Ausgangs-Quality 38155460995, CodeQL 38155460994 und Azure-Deployment 38156421695 erfolgreich; health `ok`, ready `ready`. Diese Erfolge betreffen die Ausgangsversion, nicht V23.

Feature-Branch: `feature/v23-enterprise-consolidation`. Zielcommit wird durch den PR-Head eindeutig bezeichnet; dieser Bericht enthält keinen selbstreferenziellen Commit-Hash. Änderungen werden nur mit erwarteter Branch-SHA veröffentlicht. Alte Arbeitsverzeichnisse/uncommittete Arbeiten wurden nicht zurückgesetzt oder übernommen.

Offene PRs: #237 (Auth/Runtime-Rolle/Readiness; 10 Commits vor und 20 hinter main), #231 (zentrale Formulare), #222 (PDF/UX). Kein automatischer Merge oder pauschales Cherry-Picking. Überlappende Dateien wurden geprüft; bestehende getrennte Arbeiten bleiben getrennt.

## Inventar und Nachweisgrenzen

[Funktionsinventar](function-inventory.md), `function-inventory.json`: 14 Adminansichten, 20 Operator-Endpunkte, neun Workflows und 2504 statisch erreichbare JSX-Elementvorkommen samt Props, Bedingungen und Rendering-/Importpfaden. Das ist ein Quellinventar, keine Behauptung vollständig getesteter Geschäftsprozesse. Tabellen- und Testreferenzsuche enthält Kandidaten; exakte Abfragen und vorhandene Rollenprüfungen sind über Dateipfade nachvollziehbar.

[Prüfmatrix](requirements.md), `requirements.json`: eindeutige IDs, Dateien, Methode, Erwartung, tatsächliches Ergebnis, Status und Nachweis. Vollständige End-to-End-Abnahme aller Kunden-/Operator-Mutationen, Provider-Prozesse, Exporte und Audit-Race-Conditions bleibt offen. Keine fehlende Geschäftsregel wurde erfunden. Rückerstattungen und zusätzliche Prozessfunktionen werden nicht allein aus Modulnamen als vorhanden eingestuft.

## Nachgewiesene Korrekturen und Erweiterungen

- Kundendetails: offene Tickets, CHF-Zahlungen und aktuell wirksame Einschränkungen aus tatsächlichen Tabellen. Nicht berechtigte Rollen erhalten null/Keine Berechtigung statt falscher Nullerfolge. Standardtarife sind als Listenpreise bezeichnet.
- Zahlungen: Fremdwährungen bleiben in ihrer Originalwährung in der Liste; CHF-Kennzahl und Verlauf summieren nur CHF mit zentraler Dezimalarithmetik.
- Monatlicher Vertragswert: Jahres-Abopreise werden durch zwölf geteilt; UI bezeichnet die Kennzahl ausdrücklich als monatlich. Migrierter API-Test: 1200 CHF jährlich ergeben 100 CHF monatlich.
- 30-Tage-Zahlungsfenster: heute minus 29 bis heute, inklusive. Der alte Dashboard-Ausdruck minus 30 enthielt 31 Kalendertage. Grenzwert-, Demo- und Währungsfixtures prüfen den tatsächlichen GET.
- Monitoring: Servicequote ist kein Verfügbarkeits-SLA mehr; konfiguriert/implementiert ist ohne Probe nicht Healthy. Keine erfundenen historischen Latenzen, Balken oder Uptime-Prozente. Demo zeigt keine simulierten Systemwerte.
- Gemeinsames Observability-Modell für Healthy, Warning, Critical, Unknown und Maintenance, Datenherkunft, Einheit, Messzeit, Messfenster und Frische. Fehlende, verweigerte, ungültige/future und über 120 Sekunden alte Messwerte können nicht Healthy werden.
- Ein read-only PostgreSQL-Snapshot mit Repeatable Read und Statement-Timeout liefert aggregierte Daten. Erfasste DB-Abfragefehler ergeben Critical/Unknown, niemals eine Nullzahl als erfolgreichen Bestand. Bei Ausfall der Authentifizierungsdatenbank ist die API selbst nicht zugänglich; die UI kennzeichnet Abruf-/Frischefehler.
- Monitoring-Bereiche: Übersicht, Infrastruktur, APIs, Datenbank, Jobs, Integrationen, Fehler/Ereignisse, Sicherheitsereignisse, Deployments, Alarmzentrale und gemessene Web-Vitals-Historie.
- `/operator/wallboard`: authentifizierte eigenständige Ansicht mit Technical/Business/Combined, Light/Dark, native Vollbildfunktion, automatischer Aktualisierung und letztem erfolgreichen Abruf. Keine Kundennamen, E-Mail-Adressen, Fehlermeldungspayloads oder Zugangsdaten. Finanz/Auditdaten nur mit ihren vorhandenen Berechtigungen.

## Wiederverwendung und Bereinigung

Wiederverwendet: `WorkspaceSection`, `MetricTile`, `MetricTiles`, `Status`, `Button`, `Select`, `LoadingState`, `ErrorState`, `EmptyState`, `useApiQuery`, zentrale Theme-Funktion, Rollenregeln und bestehende Statistics/CashStatistics. Die neue gemessene Zeitreihenkomponente wird von Portal und Wallboard gemeinsam verwendet; vorhandene Finanzdiagramme bleiben erhalten. Keine neue Diagrammabhängigkeit, kein konkurrierendes CSS-System, bestehende sechs Stylesheets/Design Tokens und Breakpoints bleiben Grundlage.

Der alte MonitoringCockpit und die alte MonitoringView-Implementierung wurden nach Prüfung ihrer tatsächlichen Aufrufer entfernt. Der kleine bestehende MonitoringView-Einstieg delegiert an die gemeinsame Ansicht. Kein sonstiger Legacy-Code wurde ohne Abhängigkeitsnachweis entfernt.

Bottom-Navigation und Mehr-Renderingblock sind bytegleich zu main; `navigation-evidence.json` enthält den Hash. Bestehende Navigationstests schützen darüber hinaus Styles, Tokens, Icons, Scroll-/Anzeigeverhalten. Kein neuer Navigationseintrag wurde hinzugefügt.

## Tatsächlich verfügbare Datenquellen

- `organizations`, `organization_subscriptions`: aggregierte Konten, neue Konten, aktive/überfällige Abonnemente; Demo ausgeschlossen.
- `platform_billing_payments`: erfasste CHF-Zahlungseingänge, kein als Umsatz umbenannter Cashflow.
- `mail_outbox`: wartende, fehlgeschlagene, unklare und länger als fünf Minuten hängende Zustellungen; keine Versandaktion.
- `billing_webhook_events`: protokollierte Verarbeitungsfehler; keine vollständige Zahlungsfehlerrate.
- `application_events`, `platform_incidents`, `platform_audit_events`: protokollierte Ereignisse und aggregierte Bestände; keine angenommene vollständige Auth-/Exception-Telemetrie.
- `web_vitals`: neueste maximal 5000 Proben in 24 Stunden, p75 und gemessene Stundenpunkte. Browserdaten aus allen Portalen, keine API-Latenz. Die bestehende öffentliche Telemetrie ist keine manipulationssichere SLO-Datenquelle.
- Read-only Provider-Proben: bestehende Stripe-Account-/Graph-Authentifizierungsprüfungen. Graph-Authentifizierung belegt keine erfolgreiche E-Mail-Zustellung; konfigurierte Blob-/QR-/Bankfunktionen werden nicht als gemessene Verfügbarkeit dargestellt.
- Node-Worker-Uptime, Monitoring-Gesamtdauer und SQL-Abfragedauer; Einzelmessungen, keine Azure-CPU/RAM-/SLA-Historie.
- `BINSO_BUILD_SHA`: aktueller Worker-Commit; keine Behauptung über vollständigen Deployment-Erfolg oder Versionsabweichungen.

## Azure und sicherheitsrelevante Blocker

`baseline.json` enthält datierte Ressourcen und Actions-Nachweise. Der Read-only-Audit 38127890961 belegt App Service `binso-admin-prod` und PostgreSQL `binso-platform-db` (Version 18). Blob Storage, Insights, Metric-/Query-Alerts und Action Groups im beobachteten Resource Group: keine. Managed Identity: nicht vorhanden. Ressourcen ausserhalb dieses Groups sind nicht vollständig verifiziert.

Der neuere Audit 38128629567 scheitert ausdrücklich an Easy Auth/AAD-Registrierung/Tenant-Issuer, fehlendem Application Insights und privilegierter Runtime-Datenbankrolle. `binsoadmin` kann RLS umgehen bzw. administrative Rechte annehmen. **Ein grüner alter Architekturjob ersetzt diese fehlgeschlagenen Sicherheitsprüfungen nicht.** PR #237 behandelt separate Sicherheitsarbeiten; V23 ändert keine Produktionsrolle, Entra-Konfiguration oder Geheimnisse ohne Freigabe.

Keine direkte authentifizierte Azure-Control-Plane-Verbindung in dieser Arbeitsumgebung. Azure-CPU/RAM/Neustarts, HTTP-Anzahl/Fehlerrate, vollständige Auth-/Registrierungs-/Rechnungsfehlerströme, Log Analytics, Alert-Historie, Deployment-Zeitpunkt/Ergebnis/Post-Deployment-Fehlertrend sind deshalb nicht als verfügbare Messwerte ausgewiesen. Ressourcenbereitstellung, Zugriffsmodell, Kostenrahmen und Betriebskonfiguration sind offene Entscheidungen.

## Alarmbetrieb und Entscheidungen

Vier lokale Regeln mit stabilen IDs (Deduplizierung), messbaren Bestands-/Zeitfenstern und expliziter Wiederherstellung bei frischen Messwerten. Schwelle eins für erfasste Mail-/Billing-Fehler bzw. unklare/hängende Zustellung. Unknown/Stale wird nicht als Wiederherstellung behandelt.

Persistente Alarminstanzen, Acknowledgement, Alarmhistorie, Benachrichtigung, Zuständigkeit und Eskalation sind **nicht aktiviert**. Owner/Eskalation erscheinen als nicht eingerichtet. Vor Aktivierung erforderlich: freigegebene Betriebsverantwortliche, Kanäle/Empfänger, Schwellen/Fenster, Wartungsmodell, Eskalations- und Datenaufbewahrungsregeln. Keine E-Mail/Alarmnachricht wurde zum Test gesendet.

## Qualität und bekannte Grenzen

Neue `observability-test.mjs`: tatsächlich migriertes PGlite-Schema, Demo-/Währungsausschluss, Rollenmaskierung, echte Messhistorie, fehlende/stale/future Daten, Alarmgrenzen/Wiederherstellung und DB-Ausfall. Bestehender Migrationstest prüft die korrigierte Dashboard-API.

Neue `observability-browser-test.mjs`: leere isolierte PostgreSQL-Datenbank, alle fünf tatsächlichen Operatorrollen, anonymer Zugriff verweigert, drei Profile, beide Themes, 390/768/1920/2560/3840 px, tatsächlicher automatischer Abruf, API-Ausfall und Wiederherstellung. Beide CI-Engines führen diesen zusätzlichen Gate aus; bestehende Gates bleiben erhalten. Der allgemeine Browserkatalog prüft zusätzlich, dass eine Demo-Sitzung die Wallboard-Route nicht öffnet.

Lokale Unit-/Migration-/Architektur-/Navigations-/CSS-/Dokumentationsprüfungen, vollständiger Lint, Typecheck und Build wurden ausgeführt. Nach abschliessenden Änderungen sind CI-Ergebnisse und visuelle Browser-Artefakte massgeblich und im PR nachzutragen. Physische PWA-Geräte, permanente 27-/32-/55-Zoll-Kioskdisplays und Langzeitbetrieb sind nicht abgenommen. CI PostgreSQL 16 beweist nicht automatisch jeden PostgreSQL-18-Produktionsfall.

## Freigabe, Rollback und Abnahme

V23 ist nicht gemergt und nicht produktiv deployt. Kein Produktionsdatum geändert oder gelöscht; keine Zahlungen, E-Mails oder Kontosperren ausgelöst. Keine Datenbankmigration erforderlich; Anwendungskorrekturen sind durch Rückkehr zum bisherigen Quality-geprüften Release reversibel. Vor Deployment: grüner PR-Head, Sicherheitsbefunde klären, Produktivfreigabe einholen und bekannten Artefakt-/Commit-Rollback bereithalten (`docs/production-rollback.md`).

Nach freigegebenem Deployment sind live SHA/health/ready, anonyme/rollenbasierte Monitoring-Zugriffe, nicht destruktive Admin-Smokes sowie verfügbare Fehlertrends erneut zu prüfen. Bis dahin ist der Abnahmestatus **teilweise umgesetzt, nicht vollständig freigegeben**.
