# V24 – Konsolidierter Stand und verbleibende Arbeit

Stand: 15.10.2026. Aktualisierung: Nutzer hat am 15.10.2026 um 20:24:41 Europe/Zurich den Weg bis Deploy ausdrücklich freigegeben. Keine vollständige V24-/Produktionsabnahme; Details und Profiltrennung in ux-enforcement-phase.md. Historische Phasenangaben unten bleiben als damaliger Stand erkennbar.

## GitHub-Abgleich

- Offene PRs: #251 Baseline, #252 Erstellen-Foundation, #253 zusammengeführter Kandidat.
- PR #253 ist der konsolidierte Draft-Kandidat. Veröffentlichter Basisstand dieser Fortsetzung: `2027cd68ec4574edcd5a5d6fb506312f41913415`; Main-Korrekturen aus `7bd6722c` sind enthalten. Die nachfolgend beschriebenen Geschäftsprozesse kommen als weiteres zusammenhängendes Paket hinzu.
- #251/#252 nicht zusätzlich unabhängig mergen. Die Inhalte wurden übernommen, ihre Head-Commits sind jedoch keine Vorfahren des konsolidierten Kandidaten. Eine Inhaltsübernahme ist kein Nachweis einer History-Übernahme.
- Für `2027cd68` bestanden Quality #38738851458 (einschliesslich PostgreSQL, Scanner, Build/Auth-Smoke) und CodeQL #38738851334. Browser waren im Draft planmässig ausgelassen. Das ist kein Prüfnachweis für spätere Änderungen.
- Die drei bisherigen CodeQL-Review-Threads sind aufgelöst/veraltet. Das ersetzt weder einen neuen Scan noch ein vollständiges Repository-Alertinventar. Issue #238 bleibt historischer Abnahme-Backlog; operative Anforderungen werden nicht allein aufgrund von Quellcode geschlossen.
- Produktion wurde in dieser Fortsetzung weder verändert noch neu abgenommen.

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
| 9 Demo | Zwölf Monate positive/negative PostgreSQL-Daten, isolierter Seed/Reset, FK-/Summen-/RLS-Tests | Vollständige Szenario-/Modulabdeckung einschliesslich simulierter Mahnung und Rückerstattungsbuchung; externe PostgreSQL-/Browserabnahme |
| 10 Geschäftsprozesse | Kunden/Kontakte/Angebot/Projekt/Zeit/Ausgaben/Rechnung/QR/Zahlung; Gutschrift, manuelle Mahnstufen/-versand/-historie, separate Rückerstattungsbuchung, Kundendublettenprüfung bei Erstellung, Angebotsrevision mit Audit/Idempotenz | Finale Browser-/Parallelitätsabnahme der neuen Prozesse; Dublettenprüfung bei Bearbeitung; Gutschrift-PDF/Versand und buchhalterische Fachabnahme |
| 11 Admin/Lifecycle | Vorhandene Operatorbereiche, SaaS-/Billing-Integrationen, Wartung, Monitoring/Wallboard | Alle Bulk-/kritischen Aktionen, Feature-Flags, Plattformsettings und Lifecycle-Übergänge einzeln abgleichen; Betriebsabnahme |
| 12 SEO/Branding/i18n | Metadaten/Assets/Manifeste, vier Sprachkataloge, Glossar-/Lokalisierungstests | Mehrsprachige Dokument-PDFs/QR und gespeicherte Dokumentsprache ergänzt; übrige Mail-/SEO-Texte und Schweizer Fachterminologie prüfen; externe Search-Console/Bing-Einrichtung separat; visuelle Assetabnahme |
| 13 PWA/Betrieb | Service Worker ohne sichtbares Update-Banner, Recovery, Readiness-/Betriebsworkflows und Runbooks | Physische iOS-/Android-PWA, Backup-/Restore-/RPO/RTO-/Alert-/Provider-End-to-End-Nachweise |
| 14 QA | Fast lokal ohne impliziten Browser, Draft-Bündelung, Ready-/Nacht-/Full-Gates; Deploy manuell | Pflichtlauf blockiert lokal an Scanner-Socket-EPERM; vollständige finale GitHub-/Browser-/Geräteabnahme |
| 15 Lieferumfang | Ledger, Inventare, Findings, Control-Matrix, Phasenberichte, bestehende QA-/Readiness-Berichte | Alle geforderten Einzelcontracts/Matrizen vollständig verknüpfen und fehlende Nachweise liefern; Gesamtstatus bleibt offen |

Kein Fertigstellungsprozentsatz: Ein Anforderungsabsatz enthält zahlreiche Einzelbedingungen. Eine Datei oder ein bestandener Test kann nicht das gesamte Bündel als erfüllt markieren.

## Neu implementierte fachliche Korrekturen

`lib/financial-status.ts` berechnet offene Beträge nach gebuchten, aktuellen Gutschriften. `listApiBusiness` liefert dieselbe Gutschriftssumme und Historie; serverseitiger Statusfilter und Clientstatus arbeiten damit auf derselben Grundlage. Die Zahlungserfassung prüft unter bestehender Rechnungssperre den bereinigten Restbetrag und lehnt Überzahlungen ab. Originalbetrag, Rechnungssnapshot und historischer Zahlungseingang bleiben fachlich getrennt.

`lib/server/credit-notes.ts` ergänzt eine explizite Gutschriftserfassung über die vorhandenen Tabellen und die bestehende Idempotenz-/Audit-/Tenant-Foundation. POST `/api/documents/[number]/credits` prüft Sitzung, Origin, Schreib-/Tarifrechte, Eingaben, ausgestellten Status, noch laufenden Versand und Restvolumen. Gesperrte Rechnung und bestehender Dokumentzähler schützen parallele Vorgänge; dieselbe Anfragekennung liefert dieselbe Buchung. Es wird keine automatische Rückerstattung oder externe E-Mail ausgelöst. Gutschriften werden im vorhandenen FormSheet erfasst und in der Rechnungsansicht dargestellt. Storno einer Rechnung mit Gutschriften ist blockiert. Die Gutschrift nutzt die bestehende Tabelle; die weiteren Prozesse ergänzen Migrationen 0051–0054. Keine Produktionsmigration wurde ausgeführt.

Zusätzlich implementiert:

- Manuelle Zahlungserinnerung/1. und 2. Mahnung: bestehender Versand-Outbox mit Stufe, Frist und Restbetrag; keine automatische Eskalation/Gebühren. Berechtigung, Überfälligkeit und Zahlungssaldo werden vor Versand erneut geprüft; Historie und stabile Retry-Kennung im bestehenden Sheet. Demo versendet weiterhin nicht extern.
- Rückerstattung als separate Buchung eines bereits extern ausgeführten Geldrückflusses: begrenzt auf tatsächlich bezahltes Kundenguthaben, mit Originalzahlungen, Datum, RLS, Audit und Replay-Schutz. Keine Bank-/Stripe-Auszahlung. Cash-Statistik berücksichtigt den Rückfluss am tatsächlichen Datum, Umsatz wird nicht doppelt vermindert und die Forderung nicht wieder eröffnet.
- Kundendubletten bei Erstellung: normalisierte UID, E-Mail und Name, mandantenisoliert, Hinweis mit Links und ausdrücklicher Bestätigung eines separaten Kunden. Serverseitige Sperre schützt auch parallele Erfassungen; Entwurf und Wiederholung behalten die Bestätigung.
- Angebotsrevision: neue Nummer und Entwurf aus bestehendem Angebot mit Positionen und authored Texten. Erst Ausstellung der neuen Version markiert das alte Angebot als überarbeitet; zwischenzeitliche Annahme blockiert die Ablösung. Verknüpfte Historie, Rollen-/Tarifprüfung und Idempotenz.
- Dokument-PDF: Restbetrag inklusive Gutschriften/Rückerstattungen, korrigierter QR-Betrag und DE/FR/IT/EN-Beschriftungen. Neue Dokumente speichern Kundensprache im Snapshot; bestehende ausgestellte Snapshots bleiben unverändert. Freie Benutzertexte werden nicht automatisch übersetzt.

Dies ist keine vollständige Buchführungsabnahme. Eigene Gutschriftdokumente/Versand, Fachprüfung, externe parallele PostgreSQL- und finale Browserabnahme bleiben offen.

## Neuer Prüf- und Freigabeablauf

1. Zusammenhängende Änderungen im Draft-PR entwickeln. Fast-/Integrationsprüfungen starten Browser nur mit `--browser`; statische, DB-, Security- und Build-Gates bleiben aktiv.
2. Nach Abschluss des Pakets Ready for review setzen. Die bestehenden Browserjobs laufen für den tatsächlichen Kandidaten; Nacht-/Release-Gates bleiben erhalten.
3. Tatsächlichen Main-Commit nach Integration manuell mit Quality `level=full` prüfen. Den bestehenden begrenzten Entwicklungsumfang explizit mit `release_profile=development` wählen; Standard production bleibt strikt. Standardläufe können keinen vollständigen Freigabenachweis ersetzen.
4. Nur nach ausdrücklicher Produktionsfreigabe Deploy manuell starten: vollständiger aktueller Main-SHA plus `approve_production=true` und exakt dasselbe release_profile wie im erfolgreichen Full-Lauf. Der Resolver verlangt den erfolgreichen manuellen Full-Lauf genau dieses SHAs. Derselbe geprüfte ZIP und Scanner werden übernommen. Kein automatisches Deployment nach Merge/Quality.

## Prüfstand dieser Fortsetzung

- Projekt-pnpm 10.17.1, Frozen-Installation, ohne Dependency-/Lockfileänderung.
- Lokaler Pflichtlauf `pnpm test`: blockiert bei `scripts/file-scan-test.mjs`, Unix-Socket `listen EPERM`; nicht als bestanden gewertet.
- Der erweiterte Testplan hat 39 Einträge: unabhängige Gesamtdiagnose abgeschlossen, 38 bestanden, ausschliesslich der lokale Scanner-Socket mit `listen EPERM` blockiert. Keine Quellcodeänderung während dieses Laufs. Die Diagnose ersetzt das Pflicht-Gate nicht.
- Neue Prozessprüfungen in `scripts/migration-test.mjs`: vollständig migrierte eingebettete PostgreSQL-DB, Rechte/RLS, Audit, Replay-/Payloadkonflikte, Mahnstufen/Fristen/Versandfehler, Zahlungsänderung vor Versand, Erstattungsgrenzen/Originalzahlungen, Dubletten sowie Angebotsrevision inklusive Annahmerennen und eingefrorener Sprache. Gezielter Lauf bestanden. Zusätzliche echte Parallelitätstests sind für den PostgreSQL-CI-Job ergänzt.
- Dokument-PDF-Tests prüfen tatsächliche DE/FR/IT/EN-Ausgabe, QR-Restbeträge und gespeicherte Sprache. Statistikprüfungen prüfen die gesonderten Rückflüsse ohne doppelte Umsatzkorrektur. Gezielte Läufe bestanden.
- Deployment-Resolver wird im vorhandenen Release-Test tatsächlich mit simulierten GitHub-Antworten ausgeführt: falscher/veralteter SHA, fehlender/fehlgeschlagener/Standard-Lauf werden abgelehnt.
- Neue Prozess-Formular-/Retry-/Historien-Regressionen im bestehenden Browsertest ergänzt, noch nicht ausgeführt. Kein separater Browserlauf pro Änderung.
- Lint, TypeScript, CSS, Produktionsbuild, Release-/Dokumentationschecks und Sprachabdeckung separat geprüft. Lint, TypeScript und Produktionsbuild sind auch nach dem vollständigen Prozesspaket bestanden; CSS-/Route-CSS-, Release- und Dokumentationschecks bestanden. GitHub-Gates des neuen SHAs bleiben offen.

## Release-Vorbereitung nach Deploy-Freigabe

Die Produktions-App wurde nachweislich in das Azure-Sponsorship-Abonnement verschoben. Nach ausdrücklicher Zustimmung vom 15.10.2026 wurde `AZURE_SUBSCRIPTION_ID` im Repository und in der Production-Umgebung angepasst. App-Name, Ressourcengruppe und Hostname bleiben gleich. Die erfolgreiche Azure-Anmeldung im Portal ersetzt keinen Nachweis der OIDC-Rollen des Deploy-Principals; der nächste Read-only-Audit/Deploy muss diese bestätigen.

Der Ready-for-review-Lauf #38748026705 bestand Checks, PostgreSQL, Scanner und Build, scheiterte jedoch in beiden Browsern. Befunde: `aria-label` am generischen Statistik-Container ohne benennbare Rolle; veraltete Browser-Erwartungen für den entfernten Dock-Erstellen-Button beim Read-only-Dashboard und Operator. Der Timeout liegt im gemeinsamen Erstellen-Szenario, nicht in der neuen Dublettenprüfung. Zentrale Chart-/Zeitraumgruppen erhalten `role=group`; Tests prüfen die bereits freigegebene seitenbezogene Einzelaktion für Support beziehungsweise Einschränkungen. Die Bottom-Navigation bleibt unverändert. Compliance hatte nach Abbruch unvollständige Browser-Evidenz und wird nicht als bestanden gewertet. Erneute Abnahme des korrigierten Quellbaums steht aus; noch kein Main-Merge oder Deploy.
