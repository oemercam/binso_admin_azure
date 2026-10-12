# Adminportal: Funktionen, Fehler und UX-Korrekturen

Prüfbasis: Main `d23ace81bcf24f2bfebe478d0d3a7de367981064`, am 12.10.2026. Umfang: sämtliche Operator-Seiten, beide Detailseiten, Login, Konto und Wallboard samt Datenquellen, Rollen und Mutationen. Produktionsdaten werden bei der Prüfung nicht verändert. Die ergänzten Browserprüfungen verwenden eine eigene leere PostgreSQL-Testdatenbank und echte APIs.

## Was ein Adminportal leisten muss

Mandanten und Verträge überblicken, Support bearbeiten, kontrolliert eingreifen, Betrieb und Störungen erkennen, Rollen beachten und kritische Änderungen nachvollziehbar protokollieren. Dabei müssen Zahlungen, Vertragswert, Kontostatus, Abonnementstatus und technische Verfügbarkeit unterscheidbar bleiben. Eine fehlende Anbindung darf keinen erfolgreichen Zustand ergeben. Das Kundenportal bleibt die Grundlage für Suche, Filter, Listen, Kennzahlen, Tabs, Sheets und Zustandsanzeigen.

## Jede Seite: tatsächlicher Funktionsumfang und Befund

| Bereich | Was heute implementiert ist | Befund und Korrektur in diesem Änderungssatz |
|---|---|---|
| Login | Microsoft Entra/Easy Auth, fünf Operator-Rollen, separate Demo | Keine eigene Passwort-/MFA-Verwaltung im Portal. Entra-Konfiguration bleibt extern. Synthetische Rollenprüfung ersetzt keine Anmeldung am realen Entra-Tenant. |
| Dashboard | Kundenbestand, aktive Abos, Testphasen, zuletzt aktive Sessions, 30-Tage-CHF-Zahlungen, monatlicher Vertragswert, Supportfälle, erfasste Störungen | Nicht berechtigte Finanz- und Supportdaten wurden angezeigt. Jetzt maskiert die API diese Werte; die Oberfläche zeigt keine unberechtigten Aktionen oder erfolgreichen Nullwerte. „Aktive Nutzer“ ist jetzt ausdrücklich ein 15-Minuten-Fenster. Zusätzliche Kennzahlen stehen in umschaltbaren Ansichten für Abrechnung und Support; eine spätere CSS-Regel, die die konfigurierte Kennzahlen-Spaltenzahl ignorierte, wurde entfernt. Erfasste Störungen sind kein vollständiger Verfügbarkeitsnachweis. |
| Tickets | Suche/Filter, Priorität, Status, öffentliche Antworten und interne Notizen | Mutationsantwort enthielt nur eine ID, Chronologie wurde ignoriert, Audit war nicht atomar. Jetzt vollständige Daten, chronologische Konversation, gegen Wiederholung gesperrter Versand und gemeinsamer Commit mit Audit. |
| Ticketdetail | Konversation und Kundenkontext | Klare Rückkehr zur Ticketliste ergänzt. Der Support-Zugriff auf das Kundenkonto ist weiterhin nicht verfügbar. |
| Kunden | Mandantenliste, Suche/Filter, Tarif-Listenpreis, Kontostatus | Sichtbare Einschränkungsaktion wird an die Rolle gebunden. Der Listenpreis ist kein verifizierter MRR und bleibt so bezeichnet. |
| Kundendetail | Firmenkontakt, Nutzer/Limit, Vertragswert, CHF-Plattformzahlungen, Support und Audit gemäß Rolle | Rückkehr zur Kundenliste ergänzt. Fehlende Pläne, Status und Benutzergrenzen bleiben unbekannt; sie werden nicht als kostenlose Testphase oder unbegrenztes Konto ausgegeben. Kundenspezifisches Audit berücksichtigt jetzt auch Aktionen ohne alten `platform_tenants`-Datensatz. |
| Zahlungen | Tatsächlich erfasste Plattformzahlungen; Währungen separat; CHF-Kennzahl und Verlauf | Zentrale Suche/Filter/Liste ergänzt. Datumsreihenfolge wird nun beachtet. Das Zahlungs-Repository liefert nur verbuchte Zahlungen; offene/stornierte Vorgänge und Stripe-Dunning sind damit noch keine vollständige Verwaltung. |
| Finanzen | Periodenfilter, CHF-Zahlungseingänge, Plattform-Cash-Umsatz, Betriebskosten, Ergebnis | Mindesthöhe von 8 % verzerrte kleine Beträge. Jetzt proportionale Balken. Es handelt sich nicht um vollständige Buchhaltung, Profitabilitätsprognosen oder steuerliche Auswertungen. |
| Abonnemente | Planbestand, interner Status, Benutzerlimit, Kundenverknüpfung | Vollständige Mutationsantwort, atomarer Audit und Schutz vor parallelen Änderungen. Fehlende Kontoberechtigungen erzeugen einen Fehler statt einer vermeintlich gespeicherten Benutzergrenze. Die Finanzrolle kann Kontosperren nicht über die Konto-API umgehen. Extern über Stripe verwaltete Pläne/Status können nicht mehr lokal widersprüchlich überschrieben werden. Testphase wird anhand des Abonnementstatus gezählt. Stripe-Planwechsel und Kündigung werden weiterhin über Stripe verwaltet. |
| Sperrungen | Voll-/Schreibsperre, Begründung, Ablauf, Aufheben mit Bestätigung | Vollsperre konnte durch zusätzliche Schreibsperre abgeschwächt werden. Jetzt stärkste wirksame Sperre, serialisierte Transaktion und atomarer Audit; ungültiger/vergangener Ablauf wird abgelehnt. Oberfläche zeigt nur aktuell wirksame Einträge. Automatische Rücksetzung eines gespeicherten Kontostatus allein durch Ablauf braucht weiterhin einen Lifecycle-Prozess. |
| Monitoring | Datenbank-Messung, Dienstprüfungen, protokollierte Fehler, Mail-Warteschlange, Browser-Vitals und berechtigungsabhängige Geschäftsaggregate | Vier Hauptanzeigen; Details in ersetzenden Tabs statt einer langen Gesamtliste. Zentrale Sheets für Quellen und Messwertdetails. Aktive Alarme lassen sich direkt öffnen. Messpunktwahl hebt den Punkt hervor; fehlende Werte unterbrechen Linien. p75 nutzt den Nearest-Rank-Wert. Keine künstlichen Azure-/SLA-Werte. |
| Wallboard | Authentifizierte technische/geschäftliche/kombinierte Profile, 60-Sekunden-Aktualisierung, Hell/Dunkel, Vollbild | Bestehender eigenständiger Aufbau bleibt erhalten. Ausfall/Wiederherstellung und 16:9-Ansicht werden geprüft. Es ist kein historisches SLA- oder Eskalationssystem. |
| Ankündigungen | Hinweise für alle Kunden oder einen bestimmten Mandanten | UI und API hatten verschiedene Felder und ungültige Typen. Jetzt konsistente `message`, `kind`, `active`, `organizationId`, `createdAt`; gültige Typen Info/Erfolg/Warnung. Mandanten-Audit-Fremdschlüssel korrigiert. Keine vorgetäuschte Tarif-Zielgruppe. Bearbeiten, Rückzug und Planung sind noch keine Portal-Aktionen. |
| Zugriff & Rollen | Synchronisierte Entra-Identitäten, Rolle, Status, Sync-Zeit | Zentrale Suche/Filter/Liste ergänzt, doppelte Erklärung entfernt. Rollen und MFA werden nicht in Binso geändert. |
| Audit | Protokollierte Operator-Aktionen, Identität, Zeitpunkt, Ziel; Suche/Sortierung | Kundenbezogene Zuordnung korrigiert. Fehlende Zeit bleibt ausdrücklich unbekannt. Export, serverseitige Zeitfilter, langfristiges Retentions-/Archivkonzept sind keine implementierten Portal-Funktionen. |
| Benutzerkonto | Identität, Wechsel ins Kundenportal, tatsächliches Abmelden mit Fehlerbehandlung | Kein vollständiges eigenes Adminprofil oder Benutzerverwaltungsmodul. Identität und Berechtigung kommen aus Entra. |

## Zentrale Ursachen und Grenzen

- Client und Server hatten teilweise unterschiedliche Verträge. Der bisherige Browsertest prüfte überwiegend synthetische Listen und das Öffnen von Sheets, nicht die echten gespeicherten Mutationsantworten.
- Alle Rollen bekamen denselben Seiteninhalt. Eine gemeinsame Seiten-Berechtigungsmatrix und rollenabhängige Aktionen folgen jetzt den API-Grants. Die unveränderbare untere Navigation bleibt identisch; nicht berechtigte Ziele zeigen einen erklärten Zugriffszustand und starten keine privilegierte Datenabfrage.
- Der Catch-all zeigte unbekannte Unterseiten als Dashboard. Ungültige Pfade werden jetzt als nicht gefunden behandelt.
- Audit und Mutation liefen teils in getrennten Transaktionen. Geprüfte Ticket-, Sperr- und Kontomutationen speichern beide gemeinsam.
- Es gibt weiterhin begrenzte Listenabfragen (meist maximal 500 Datensätze); vollständige serverseitige Pagination, Suche und Export über den Gesamtbestand fehlen teilweise. Die Finanzansicht ist eine Cash-Auswertung der vorhandenen Daten.

## Noch erforderliche Betriebsanbindungen

Azure Monitor/Application Insights/Log Analytics, echte HTTP-Fehlerraten und Latenzverläufe, Deployment-Historie, SLA-Messung, persistente Alarmhistorie, Zuständigkeiten, Eskalations- und Benachrichtigungskanäle sind nicht angeschlossen. Sichere Support-Impersonation, Stripe-Dunning-/Refund-/Planwechsel-Arbeitsabläufe, geplante Ankündigungen sowie Profil-/Plattformeinstellungen sind getrennte Funktionsausbauten. Diese werden nicht durch Attrappen ersetzt.

## Nachweise

- `scripts/operator-contract-test.mjs`: tatsächliche migrierte SQL-Verträge, Nachrichtenchronologie, Rollen, vollständige Ticket-/Accountantworten, Sperr-Priorität, Ablaufvalidierung und Rollback bei Auditfehlern.
- `scripts/operator-announcement-test.mjs`: Speicherung, Rollen/Origin/Validierung, organisationsbezogene Hinweise und Audit-Rollback.
- `scripts/observability-test.mjs`: Quellen, fehlende/veraltete Werte, Demo-/Währungsisolation, Rollen und echte Zeitreihen.
- `scripts/observability-browser-test.mjs`: alle 13 Portalansichten bei 320/390/820/1440 px in Hell/Dunkel mit echten isolierten APIs; reale Ticketänderung/Antwort; Rollenverweigerung ohne privilegierten API-Aufruf; Wallboard und Ausfall/Wiederherstellung.
- `scripts/ux-browser-test.mjs`: 2×2-Hauptanzeigen, ersetzende Monitoring-Tabs, Dienststatus innerhalb des Viewports, zentrale Sheets und Veröffentlichungspayload.
- `scripts/navigation-contract-test.mjs`: Kunden- und Admin-Bottom-Navigation inklusive Logik, Styling, Icons und abhängigen Tokens unverändert.

Die automatisierten Browsernachweise belegen die getesteten Daten/Viewport-Kombinationen. Eine Sichtprüfung auf dem tatsächlichen iPhone und die Abnahme externer Entra-/Azure-/Stripe-Konfigurationen bleiben davon getrennt.

## Verbindliche Release-Grenze vom 12.10.2026

Der Auftraggeber hat zusätzlich die offenen Voraussetzungen aus PR237 und dessen `docs/remediation/v22-4/ledger.json` verbindlich gemacht. Gefrorener PR237-Prüfstand: `54c7b8436efeb98f05aaab385e2f3c93ba01ac3b`. Das Ledger ist **releaseReady: false** und ist auf der hier geprüften Main-Basis nicht vorhanden. Main besitzt bisher das technische `release-check.mjs`, nicht die vollständige 432-Anforderungen-Gesamtabnahme. Grüne technische Quality-Ergebnisse ersetzen diese Abnahme nicht.

Die Admin-Korrekturen sind deshalb ein separat überprüfbarer Code-/UX-Kandidat. **Kein Main-Merge mit automatischem Deployment und keine Produktionsübernahme unter der neuen Freigabevorgabe.** Keine produktive Azure-Konfiguration, DB-Rolle/RLS-Migration, Scanneraktivierung, historische Datenkorrektur oder pauschale Freigabe quarantänierter Dateien wird durch eine Checklistenzeile autorisiert. Die hier geprüften Schreibvorgänge verwenden ausschließlich isolierte synthetische Testdaten.

Offen bleiben insbesondere: SEC-003 realer authentifizierter Scanner und Provenienz/Faultfälle; SEC-005/007 effektiver Azure-Ingress/EasyAuth und Spoof-Tests; DB-001 tatsächliche Runtime-Rolle/Ownership/BYPASSRLS und Isolation; TEST-003 Original-V21-Freigaben und individuelle Bindungen aller 432 Einträge; namentlich freigegebene Pixelbaselines einschließlich Dark Statistics sowie physische installierte iOS-/Android-PWA; PERF-002/CSS-001/ARCH-001 tatsächliche Payload-/Runtime-Nutzung; DB-002 read-only Klassifikation historischer NOT-VALID-Verletzungen; CI-002/003 aktuelle Next-Advisory-Bereiche zum Freigabezeitpunkt und Ablauf der begrenzten braces-Ausnahme am 24.10.2026 UTC.

Nur ein vollständig geprüftes Artefakt des exakten aktuellen Main-Commits darf nach bestandenem strikten Registry-Gate und allen vorgeschriebenen Quality-Ergebnissen übernommen werden. Fehlende Nachweise werden nicht ausgenommen oder als bestanden markiert. Die Bottom-Navigation bleibt geschützt.
