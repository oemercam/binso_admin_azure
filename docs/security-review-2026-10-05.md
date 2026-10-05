# Binso One – Sicherheits- und Betriebsbewertung

Stand: 5. Oktober 2026. Ausgangspunkt: Main `35fee4ad0236ddd5c08d0b611f5ae0ee3d4f44e8`, anschliessend Änderungen dieses PR. Bewertung durch Quellcodeanalyse und automatisierte Tests; keine Zertifizierung, kein vollständiger Penetrationstest und kein Nachweis vollständiger Normkonformität.

## Gesamturteil

Die Architektur unterstützt logisch getrennte Mandanten in einer gemeinsamen Azure-PostgreSQL-Datenbank. Jede Firma erhält eine eigene Organisation und Mitgliedschaften; keine eigene physische Datenbank pro Firma. Explizite Tenant-Prädikate, transaktionslokaler RLS-Kontext, FORCE RLS und zusammengesetzte Beziehungen bilden mehrere Schutzschichten. Der neue Test provisioniert 50 unabhängige Trial-Firmen mit echten Datenbankfunktionen und prüft Lesen, Einfügen, Ändern und Löschen über Mandantengrenzen mit einer Nicht-Superuser-Rolle. Das ist keine Last- oder Parallelregistrierungsprüfung und kein Beweis für jede einzelne Route.

Das Berechtigungskonzept ist zentral implementiert, aber die Anwendung ist noch nicht als vollständig abgesicherter, vollständig überwachter SaaS-Betrieb nachgewiesen. Besonders Operator-Anmeldung, Malware-Prüfung, Cloud-Konfiguration, Alarmierung, Wiederherstellung und organisatorische Prozesse benötigen weitere Arbeit oder Betriebsnachweise. 50 echte Firmen sind architektonisch vorgesehen; eine uneingeschränkte Sicherheits- und Kapazitätsfreigabe folgt daraus nicht.

## Bezugsrahmen und Methode

- OWASP ASVS 5.0.0 als technischer Prüfrahmen; keine vollständig abgearbeitete Anforderungsliste und kein ASVS-Level bescheinigt.
- NIST CSF 2.0 für Govern, Identify, Protect, Detect, Respond und Recover.
- ISO/IEC 27001:2022 für Anforderungen an ein Informationssicherheitsmanagement; Quellcode allein belegt kein ISMS.

Primärquellen: https://owasp.org/projects/asvs, https://www.nist.gov/cyberframework, https://www.iso.org/standard/27001. Normtexte werden nicht durch diese Bewertung ersetzt.

Analysierte Bereiche: 70 API-Routendateien als Inventar; gemeinsame Session-, Datenbank-, RBAC-, Provisionierungs-, Repository-, Datei-, Finance-, Theme- und Monitoringpfade; 33 PostgreSQL-Migrationen; Quality-, Deployment- und Azure-Audit-Workflows; PWA-Cache und Sicherheitsheader. Nicht jede Zeile und nicht jede Kombination aller Rollen und Geschäftsvorgänge wurde dynamisch geprüft. Produktive Konfigurationswerte und Azure-Steuerungsebene werden separat im Architecture-Audit gelesen; nicht zugängliche Werte bleiben unbestätigt.

## Kontrollbewertung

| Bereich / Rahmen | Nachweis | Bewertung und Grenze |
|---|---|---|
| Mandanten / ASVS Autorisierung | `provisioning.ts`, `session.ts`, `db.ts`, Migrationen 0017/0025/0031, 50-Firmen-Test | Implementiert und in beschriebenen Szenarien getestet. Gemeinsame DB; kein physischer Tenant-Silo. |
| Datenbankzugriff / ASVS Konfiguration | `withTenant` setzt Organisation/Benutzer mit `set_config(...,true)` innerhalb BEGIN/COMMIT | Pool-Kontext transaktionslokal. FORCE RLS schützt auch Tabellenbesitzer, aber nicht Superuser/BYPASSRLS. Produktive Rolle muss separat geprüft werden. |
| Beziehungen / ASVS Datenintegrität | Composite Tenant-FKs; Migrationstest weist fremden Projektbezug ab und prüft validierte FKs | Schutz im Schema vorhanden. Nicht jeder FK-Pfad einzeln getestet. |
| Rollen / ASVS Autorisierung | `lib/permissions.ts`, `rbac.ts`, Operator-RBAC, API-Prüfungen | Owner, Admin, Finance, HR, Projektleitung, Mitarbeiter, Reader und fünf Operator-Rollen. Ungültige Rollen neu ohne Rechte. Vollständige positive/negative Endpunktmatrix noch offen. |
| Eigenbezug / ASVS Autorisierung | Zeit-/Spesen-APIs, Datei-Zweckprüfung, `ownRecordOnly` | Such-API hat Eigenbezug bisher nicht weitergereicht; in diesem PR behoben und Handler getestet. |
| Authentifizierung / ASVS | scrypt, zufällige 256-Bit-Sessiontokens, DB-Tokenhashes, aktive Mitgliedschaft pro Anfrage | HttpOnly/Secure/SameSite; Passwortminimum 12. MFA wird geprüft, falls aktiviert. MFA ist nicht überall verbindlich; Wiederherstellung/Parallelität zusätzlich testen. |
| Operator-Zugang / ASVS | Eigene Sessiontabelle und eigene RBAC; Demo-Cookie reicht nicht für produktive APIs | Loginseite bietet aktuell Demo; `createOperatorSession` ist keinem produktiven Loginhandler angeschlossen. Admin-Betriebszugang nicht vollständig umgesetzt. |
| CSRF / ASVS | `assertSameOrigin`, SameSite-Cookies, Tests fremder Origin | Mutation-Prüfung vorhanden. Fehlende Origin wird zugelassen; Forwarded-Header-Vertrauensgrenze muss Azure-seitig verifiziert werden. |
| SQL / ASVS Injection | Werte parametrisiert, feste Tabellen-/Spaltenzuordnungen | Gemeinsame Pfade geprüft. Keine Aussage, dass jeder dynamische SQL-Pfad penetriert wurde. |
| Dateischutz / ASVS | PostgreSQL-Inhalte, RLS, Tenant/Zweck/Eigenbezug, No-Store, Download als Attachment | MIME-Allowlist/Grössenlimit/Hash. `scan_status='pending'`; kein angeschlossener Malware-Scanner und Download blockiert nicht alle ungeprüften Dateien. |
| Persistenz / ASVS Daten | Normalisierte Tabellen, atomare Dokumente/Zahlungen, PG-Timer, Profil-/Firmeneinstellungen, Persistenz-Smoketest | Wesentliche Geschäftspfade gespeichert und Reload-geprüft. Kein pauschaler Beweis für jedes UI-Feld. Frontend-Demodaten und Legacy-Supabase-Verzeichnis bleiben klar getrennte Altbestände. |
| Finanzen / Integrität | Tenant- und Operator-API, Zahlungs-/Kosten-/Lohndaten, Autorisierung | Echte DB-Berechnung. Fachliche Vollständigkeit und Buchhaltungsabschluss brauchen separate Abnahme; keine Finanzzertifizierung. |
| Browser / ASVS Konfiguration | CSP, HSTS, No-Sniff, Frame-Regeln, API-No-Store, PWA ohne Geschäftsdaten-Cache | CSP erlaubt `unsafe-inline`; Nonce-Konzept fehlt. No-Store-Routenliste ist manuell und muss bei neuen Modulen überprüft werden. |
| Logging / NIST Detect | Audit-Tabellen, strukturierter Logger mit Redaction | Einige API-Fehler gehen direkt über `console.error`; flächendeckende Log-Redaction/Retention und manipulationsgeschützter Export nicht nachgewiesen. |
| Monitoring / NIST Detect | Web-Vitals in PG, Operator-Abfragen und Providerprobes | Momentaufnahmen, browserabhängige Stichproben; keine vollständige Request-/Fehlerhistorie. Service Health ist keine historische SLA-Verfügbarkeit. Alarmzustellung ist nicht bewiesen. |
| Recovery / NIST Recover | Azure-Audit liest Backup/HA-Metadaten | Restore-Test, definierte RPO/RTO und dokumentierter Wiederanlauf fehlen als Nachweis. Vorhandenes Backup allein reicht nicht. |
| Delivery / ASVS, NIST Protect | Tests/Lint/Typecheck/Build/CSS, Migrationen, echte Production-SHA- und Persistenzprüfung | Main laut GitHub `protected:false`; Checks werden derzeit nicht durch Branchschutz erzwungen. Unabhängige Freigabe und Supply-Chain-Überwachung ausbauen. |
| Governance / ISO 27001, NIST Govern | Technische Regeln und diese Bewertung | Risikoverantwortliche, Datenschutz-/Löschkonzept, Incident-Runbook, Lieferantenprüfung und ISMS-Nachweise nicht aus dem Repository bestätigt. |
| Kapazität / NIST Identify | Poollimit standardmässig 10 pro Prozess, Listen häufig auf 1000 begrenzt | Kein 50-Firmen-Lasttest. Globale Suche lädt Moduldatensätze und Relationsdaten; Pagination und Lastprofil sind nächste Skalierungsarbeiten. |

## In diesem PR behoben

1. Benachrichtigungs-Sheet: Sammelbutton entfernt, Link mit Label und Pfeil in einer Zeile.
2. Theme: Seitenschale beobachtet Theme, überschreibt es beim Mount nicht mehr; alte Profilantwort kann neue Theme-Auswahl nicht rückgängig machen.
3. Ungültige Rollen erhalten weder Tenant- noch Operator-Rechte; auch Prototyp-Schlüssel werden abgelehnt.
4. Globale Suche beachtet eigenen Datensatzbereich für Mitarbeiter.
5. Monitoring benennt Service-Momentaufnahme ehrlich und liefert die kompilierte Build-SHA.
6. Reproduzierbarer Test für 50 provisionierte Trial-Mandanten, Theme-Regressionen und Such-Eigenbezug; zusätzliche Azure-Audit-Metadaten für Laufzeitrolle, RLS, Insights und Alerts.

## Prioritäten vor einer umfassenden Betriebsfreigabe

**Hoch:** Laufzeit-DB-Rolle ohne Superuser/BYPASSRLS bestätigen, privilegierten Migrationszugang trennen; vollständigen Operator-Login mit verbindlicher MFA und Audit umsetzen; Malware-Scan/Quarantäne an Dateiflows anschliessen; Cloud-TLS/Private-Network/Backups/HA und Restore belegen; echte Alarmierung mit Testzustellung einrichten; Main-Branchschutz mit verpflichtendem Quality-Check aktivieren.

**Abhängigkeitsbefund:** Der vollständige `pnpm security:scan` meldet einen High-Befund in `braces <=3.0.3` über ESLint → Next-ESLint-Plugin → fast-glob → micromatch (GHSA-vfj7-8cjw-p6xm / CVE-2026-93687). Am Prüftag ist keine korrigierte Version angegeben. Der Befund wird nicht unterdrückt; der vollständige Security-Scan ist deshalb nicht grün. Die Abhängigkeit liegt im Entwicklungswerkzeugpfad; `pnpm audit --prod --audit-level high` hat am Prüftag keine bekannten Schwachstellen gefunden. Build-/Lint-Prozesse dürfen keine fremden Glob-Muster verarbeiten. Quelle: https://github.com/advisories/GHSA-vfj7-8cjw-p6xm.

**Danach:** Vollständige rollenabhängige API-Negativmatrix, MFA-Recovery-Race-Tests, Registrierungsparallelität, 50-Firmen-Lasttest; Tenant-Indizes mit EXPLAIN und realistischem Datenvolumen; CSP-Nonces, zentrale Log-Redaction/Retention; Rechte für persönliche Dokumente und Least-Privilege-Feingranularität fachlich abnehmen. Planberechtigungen separat vervollständigen: `requireTenantFeature` ist derzeit nur eine Sessionprüfung.

**Organisatorisch:** Risikoregister mit Verantwortlichen, Datenklassifizierung/Aufbewahrung/Löschung, Vertrags- und Unterauftragsbearbeiterprüfung, Incident-Runbook, RPO/RTO und wiederkehrende Wiederherstellungstests. Diese Punkte sind Teil der Bewertung, keine behaupteten bereits vorhandenen Betriebsprozesse.

## Reproduzierbare Validierung

`pnpm test` enthält Architekturprüfung, Rechte-/Suchhandlerprüfung, Theme-Regression und komplette Migrationen samt Demo, 50-Firmen-Isolation und Datenintegrität. Zusätzlich: `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm css:check`, `pnpm release:check`, `pnpm security:scan`; Runtime-Route-/CSS- und Initial-Theme-Prüfung; GitHub Quality und Azure-Deployment inklusive exakter Main-SHA und persistenter Geschäftsdatensätze.

Der 50-Firmen-Test läuft in einer isolierten PostgreSQL-Engine (PGlite), nicht durch Erstellung von 50 echten Produktivkunden. Azure-Persistenzprüfungen arbeiten mit isolierten synthetischen Demo-Mandanten. Keine visuelle Prüfung auf einem echten iPhone durchgeführt.
