# V24 – Konsolidierter Stand und verbleibende Arbeit

Stand: 15.10.2026. Keine Produktionsfreigabe und keine vollständige V24-Abnahme.

## GitHub-Abgleich

- Offene PRs: #251 Baseline, #252 Erstellen-Foundation, #253 zusammengeführter Kandidat.
- PR #253 (`04731aa7`) enthielt #250–252, war aber gegenüber main `7bd6722c` nicht konfliktfrei. Die aktuellen Main-Korrekturen sind hier lokal integriert. Zwei Konflikte betrafen ausschliesslich generierte Integrationsberichte; diese wurden mit dem bestehenden Generator neu erzeugt.
- #251/#252 nicht zusätzlich unabhängig mergen. Ihre Änderungen sind Vorfahren des konsolidierten Kandidaten. Die bestehenden PRs werden nicht ohne Nachweis ihrer Übernahme geschlossen.
- Die drei CodeQL-Kommentare an #253 bezogen sich auf Kontakt-URIs und temporäre Browserausgabe. Main enthält bereits die Korrekturen in `lib/contact-links.ts` und `scripts/localization-browser-test.mjs`; der neue Commit benötigt trotzdem seinen eigenen Scan. Kommentare sind kein aktueller Scanstatus.
- Die Workflow-Abfrage für den alten #253-SHA lieferte keine Runs. Daraus wird kein grüner CI-Status abgeleitet. Produktion wurde in dieser Fortsetzung weder verändert noch neu abgenommen.

## Abgleich aller Markdown-Abschnitte

„Vorhanden“ bedeutet Quellcode bzw. dokumentierter Implementierungsnachweis, keine vollständige Abnahme jedes Unterpunkts. Die ursprünglichen Anforderungen bleiben unverändert in master-implementation.md.

| Abschnitt | Vorhanden / Eigentümer | Noch offen / erforderliche Abnahme |
| --- | --- | --- |
| 0 Regeln | Baseline, Befunde, Ledger, konsolidierter Review-Branch | Aktueller Produktions-/Artefaktabgleich und vollständige Abnahme |
| 1 Architektur | Dependency-/Lizenz-/Integrationsinventar, zentrale Domain-/Server-/Client-Eigentümer | Vollständige Support-/Breaking-Change-Prüfung, Hardcoding- und Legacy-Einzelfälle |
| 2 Sicherheit/Normen | Standards-Register, Control-Matrix, Auth/RBAC/RLS/Scanner-Gates | Vollständige Control-/Risiko-Evidenz; operative Nachweise, finaler Security-Scan |
| 3 Foundation | Bestehende sechs CSS-Dateien, Tokens, UI-/Navigations-/Daten-Foundation; keine neue CSS-Schicht | Alle Kaskaden-/Legacy-Kandidaten mit tatsächlicher Nutzung und Browserwerten belegen |
| 4 Seiten/Navigation | Hauptseitenfamilien, unveränderte fünf Nav-Ziele, kontextbezogene Erstellen-Aktionen | Vollständige Route/Zustand/Rolle/Viewport-Abnahme |
| 5 Aktionen/Forms | Zentrale Actions, Records, Sheets, Fields, Draft-/Submit-/Recovery-Eigentümer | Durchgängige Einzelprüfung jedes Formulars, direkter Einzelaktionen und aller Back-/Keyboard-Zustände |
| 6 Chat/Listen/Settings | Gemeinsame Rows, CompactEmptyState, Chat/Composer, Settings und letzter Separator zentral korrigiert | Vollständige Zustands-/Geräteprüfung und verbliebene Legacy-Nutzung |
| 7 Glass/Motion | Zentrale Glass-/Motion-/Reduced-Motion-Regeln, Navigationsschutz | Kontrast, Fokus, Fallback und Layoutstabilität auf realen Geräten |
| 8 Zahlen/Charts | MetricTiles/Statistics, vier Finanz-KPIs, Linien/Ringe, zentrale Finanzmetriken, Touch/Keyboard-Handler | Durchgängige Modulanwendung; bezahlte/offene Ringkohorten müssen vor Detailverlinkung fachlich reconciliert werden; visuelle/a11y-Abnahme |
| 9 Demo | Zwölf Monate positive/negative PostgreSQL-Daten, isolierter Seed/Reset, FK-/Summen-/RLS-Tests | Vollständige Szenario-/Modulabdeckung einschliesslich künftig unterstützter Mahnungen; externe PostgreSQL-/Browserabnahme |
| 10 Geschäftsprozesse | Kunden/Kontakte/Angebot/Projekt/Zeit/Ausgaben/Rechnung/QR/Zahlung; neu Gutschrift mit Audit/Idempotenz und konsistentem Restbetrag | Mahnstufen/-versand/-historie, Rückerstattungs-/Korrekturprozess, Dublettenprüfung/Angebotsrevision vollständig qualifizieren; Gutschrift-PDF/Versand und buchhalterische Fachabnahme |
| 11 Admin/Lifecycle | Vorhandene Operatorbereiche, SaaS-/Billing-Integrationen, Wartung, Monitoring/Wallboard | Alle Bulk-/kritischen Aktionen, Feature-Flags, Plattformsettings und Lifecycle-Übergänge einzeln abgleichen; Betriebsabnahme |
| 12 SEO/Branding/i18n | Metadaten/Assets/Manifeste, vier Sprachkataloge, Glossar-/Lokalisierungstests | Alle PDF-/Mail-/SEO-Texte und Schweizer Fachterminologie prüfen; externe Search-Console/Bing-Einrichtung separat; visuelle Assetabnahme |
| 13 PWA/Betrieb | Service Worker ohne sichtbares Update-Banner, Recovery, Readiness-/Betriebsworkflows und Runbooks | Physische iOS-/Android-PWA, Backup-/Restore-/RPO/RTO-/Alert-/Provider-End-to-End-Nachweise |
| 14 QA | Fast lokal ohne impliziten Browser, Draft-Bündelung, Ready-/Nacht-/Full-Gates; Deploy manuell | Pflichtlauf blockiert lokal an Scanner-Socket-EPERM; vollständige finale GitHub-/Browser-/Geräteabnahme |
| 15 Lieferumfang | Ledger, Inventare, Findings, Control-Matrix, Phasenberichte, bestehende QA-/Readiness-Berichte | Alle geforderten Einzelcontracts/Matrizen vollständig verknüpfen und fehlende Nachweise liefern; Gesamtstatus bleibt offen |

Kein Fertigstellungsprozentsatz: Ein Anforderungsabsatz enthält zahlreiche Einzelbedingungen. Eine Datei oder ein bestandener Test kann nicht das gesamte Bündel als erfüllt markieren.

## Neu implementierte fachliche Korrekturen

`lib/financial-status.ts` berechnet offene Beträge nach gebuchten, aktuellen Gutschriften. `listApiBusiness` liefert dieselbe Gutschriftssumme und Historie; serverseitiger Statusfilter und Clientstatus arbeiten damit auf derselben Grundlage. Die Zahlungserfassung prüft unter bestehender Rechnungssperre den bereinigten Restbetrag und lehnt Überzahlungen ab. Originalbetrag, Rechnungssnapshot und historischer Zahlungseingang bleiben fachlich getrennt.

`lib/server/credit-notes.ts` ergänzt eine explizite Gutschriftserfassung über die vorhandenen Tabellen und die bestehende Idempotenz-/Audit-/Tenant-Foundation. POST `/api/documents/[number]/credits` prüft Sitzung, Origin, Schreib-/Tarifrechte, Eingaben, ausgestellten Status, noch laufenden Versand und Restvolumen. Gesperrte Rechnung und bestehender Dokumentzähler schützen parallele Vorgänge; dieselbe Anfragekennung liefert dieselbe Buchung. Es wird keine automatische Rückerstattung oder externe E-Mail ausgelöst. Gutschriften werden im vorhandenen FormSheet erfasst und in der Rechnungsansicht dargestellt. Storno einer Rechnung mit Gutschriften ist blockiert. Kein neuer Datenbankstatus, keine Migration und keine Produktionsdatenänderung.

Dies ist keine vollständige Gutschrift-/Refund-/Buchführungsabnahme. Eigene Gutschriftdokumente/Versand, Rückerstattungen, Fachprüfung und finale Browserabnahme bleiben offen.

## Neuer Prüf- und Freigabeablauf

1. Zusammenhängende Änderungen im Draft-PR entwickeln. Fast-/Integrationsprüfungen starten Browser nur mit `--browser`; statische, DB-, Security- und Build-Gates bleiben aktiv.
2. Nach Abschluss des Pakets Ready for review setzen. Die bestehenden Browserjobs laufen für den tatsächlichen Kandidaten; Nacht-/Release-Gates bleiben erhalten.
3. Tatsächlichen Main-Commit nach Integration manuell mit Quality `level=full` prüfen. Standardläufe können keinen vollständigen Freigabenachweis ersetzen.
4. Nur nach ausdrücklicher Produktionsfreigabe Deploy manuell starten: vollständiger aktueller Main-SHA plus `approve_production=true`. Der Resolver verlangt den erfolgreichen manuellen Full-Lauf genau dieses SHAs. Derselbe geprüfte ZIP und Scanner werden übernommen. Kein automatisches Deployment nach Merge/Quality.

## Prüfstand dieser Fortsetzung

- Projekt-pnpm 10.17.1, Frozen-Installation, ohne Dependency-/Lockfileänderung.
- Lokaler Pflichtlauf `pnpm test`: blockiert bei `scripts/file-scan-test.mjs`, Unix-Socket `listen EPERM`; nicht als bestanden gewertet.
- Unabhängige Diagnose aller 38 Testeinträge: 37 bestanden; nur derselbe Scanner-Listener blockiert. Diese Diagnose ersetzt das Pflicht-Gate nicht.
- Neue Gutschrift-/Zahlungstests in `scripts/migration-test.mjs`: echte vollständig migrierte eingebettete PostgreSQL-DB, Schreib-/Read-only-/Fremdmandantenverweigerung, Validierung, Nummerierung, Audit, Replay-/Payloadkonflikt, Betragsgrenze, zukünftige Gutschriften, Status-/Filterparität, Zahlung nach Gutschrift und Stornoschutz. Bestanden. Externe parallele Runtime-PostgreSQL-Abnahme bleibt CI-Aufgabe.
- Deployment-Resolver wird im vorhandenen Release-Test tatsächlich mit simulierten GitHub-Antworten ausgeführt: falscher/veralteter SHA, fehlender/fehlgeschlagener/Standard-Lauf werden abgelehnt.
- Neue Gutschrift-Formular-/Retry-/Historien-Regression im bestehenden Browsertest ergänzt, noch nicht ausgeführt. Kein separater Browserlauf pro Änderung.
- Lint, TypeScript, CSS, Produktionsbuild, Release-/Dokumentationschecks und Sprachabdeckung separat geprüft. Endgültige Ergebnisse stehen in den zugehörigen Protokollen; GitHub-Gates des neuen SHAs bleiben offen.
