# Architektur, Integrationen und Controls – Erstinventar

## Bestehende Integrationen

| Bereich | Source Owner | Nachweis in dieser Phase | Noch erforderlich |
| --- | --- | --- | --- |
| Next App Router / React | app/, proxy.ts, next.config.ts | Route-/API-Inventar, Build | Server-/Client-Grenzen, Caching und pro Route Auth prüfen |
| Azure PostgreSQL / RLS | lib/server/db.ts; database/migrations/; scripts/check-runtime-db.mjs | Code und migrationsbezogene Tests | Echter Runtime-Login, Cross-Tenant, Privilegien und Concurrent Writes |
| Entra Operator | lib/server/operator/ | Dateien vorhanden | Aktuelle Issuer-/Audience-/Tenant-Konfiguration, Rollen und Login-E2E |
| Microsoft Graph | lib/server/email.ts; docs/graph-mail-least-privilege.md | Bestehende Release-/Auth-Tests | Least-Privilege-Konfiguration und Zustellnachweis mit Testempfänger |
| Stripe | lib/server/stripe.ts; repositories/stripe-billing.ts | Dateien und Regression vorhanden | Testmode-Signaturen/Replays/Trial/Tarifwechsel, keine echten Zahlungen |
| Storage und Scanner | lib/server/storage.ts, file-scan.ts, file-rescan.mjs | Rescan-Test grün, Scanner lokal blockiert | Echter Scanner, Quarantäne/Downloadrechte und Upload-E2E |
| PDF / Swiss QR | lib/server/document-pdf.ts; lib/qr-bill.ts; components/pdf-preview.tsx | Build und Dokumenttests | Visuelle und fachliche QR-/Mehrseiten-/Druck-Abnahme |
| Jobs / Betrieb | .github/workflows/, scripts/, docs/incident-response-and-retention.md | Source vorhanden | Live-Konfiguration, Alerts, Restore-/Rollback-/RPO-/RTO-Probe |
| Monitoring | lib/observability/, lib/server/observability.ts; components/monitoring.tsx | Bestehende Tests | Stale Data, Rechte, Wallboard, Alerts und echte Messdaten |
| PWA / Push | public/sw.js; components/pwa-register.tsx | Vorhandene PWA-Quelltests grün | Offline-/Cache-/Logout-Isolation, Push und installierte Geräte |

Versionen stehen in dependency-inventory.json. Support, Lizenzen, SBOM und Breaking Changes aller transitiven Abhängigkeiten sind noch nicht vollständig geprüft. Neue Libraries wurden nicht hinzugefügt.

## Control-Zuordnung – keine Konformitätsbehauptung

Die im Auftrag genannten Normen und aktuellen Ausgaben müssen einzeln anhand offizieller Quellen verifiziert werden. Es werden hier bewusst keine ungeprüften Ausgaben oder Control-IDs erfunden. Die folgende Zuordnung ist eine offene Arbeitsmatrix; sie erfüllt noch nicht die verlangte vollständige ISO/CIS/OWASP-Matrix.

| Bereich | Referenzfamilie | CIS oder Nicht-CIS | Evidenz / Risiko | Status / nächster Nachweis |
| --- | --- | --- | --- | --- |
| Identität / MFA / Sessions | OWASP ASVS; NIST Digital Identity; ISO/IEC 27001/27002 | Nicht-CIS-Zuordnung, CIS-Mapping separat offen | Auth-Dateien und Tests; echte Session-/MFA-Matrix fehlt | Ausgabe/Control-ID und E2E prüfen |
| RLS / Datenisolation | OWASP API; DSG/DSV; ISO/IEC 27018 | Nicht-CIS | Kontextsetzung im Code; Runtime-Rolle unbekannt | P1, echte PostgreSQL-Evidenz erforderlich |
| Infrastrukturhärtung | CIS Benchmarks/Controls | CIS-Kandidat, konkrete Benchmark/Version/ID offen | Azure-/PostgreSQL-Konfiguration nicht gelesen | Read-only Konfigurationsinventar; keine produktive Mutation |
| Supply Chain | NIST SSDF; OpenSSF | Nicht-CIS-Zuordnung | Prod-Advisory-Scan grün, vollständige Lizenz-/SBOM-Prüfung offen | Vollständige Dependency- und Actions-Provenance |
| Accessibility | WCAG 2.2 AA / WAI-ARIA | Nicht-CIS | Gemeinsame Controls vorhanden; Browsernachweis fehlt | Fokus, Screenreader, Keyboard, Kontrast, Touch prüfen |
| Qualitäts-/Entwicklungsprozess | ISO/IEC 25010/25012/12207 | Nicht-CIS | Versionierte Anforderungen und erste QA-Evidenz | Vollständige Prozess-/Datenqualitätsmatrix |
| Betrieb / Incident / Recovery | ISO/IEC 27035; ISO 22301; ISO/IEC 20000-1; NIST CSF; OpenTelemetry | Nicht-CIS-Zuordnung | Runbooks vorhanden, Betriebsprobe nicht ausgeführt | Restore, Alert, Incident und Rollback nachweisen |
| Cloud / Privacy Management | ISO/IEC 27017/27018/27701; DSG/DSV | Nicht-CIS | Datenschutz-Dokumente vorhanden | Rechtliche Anwendbarkeit, Retention und Datenflüsse fachlich prüfen |
| MWST / Buchführung | Schweizer Recht | Nicht-CIS | Rechnungs-/Geldservices vorhanden | Aktuelle Rechtsquellen, Aufbewahrung, Storno-/Gutschrift-E2E |
| KI-Management | ISO/IEC 42001 bei KI | Nicht-CIS | Keine vollständige KI-Usage-Analyse vorgenommen | Anwendbarkeit zunächst prüfen |

ISO/IEC 27001/27002, CIS, OWASP und Schweizer Recht sind unterschiedliche Referenzsysteme. Keine Zertifizierung, vollständige Controls-Abdeckung oder rechtliche Konformität wird aus vorhandenem Code abgeleitet. Aktuelle Normen-/Rechtsrecherche und fachliche Sprach-/Rechtsprüfung bleiben offen.
