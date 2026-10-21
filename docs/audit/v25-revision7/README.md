# Revision7: Implementierung und Abnahmestand

Die unveränderte [vollständige Quelle](source.md) ist verbindlich. P0/P1/P2 sind
im Auftrag, P3 ist ausgeschlossen. Diese Ablage ersetzt keine ausdrückliche
fachliche, visuelle oder produktive Freigabe.

## Vollständige Register

| Register | Inhalt und tatsächliche Aussage |
| --- | --- |
| [Anforderungen](requirements.csv) / [JSON](requirements.json) | 573 Klauseln aus allen56 Kapiteln; Soll, Ist, Quellen, Tests, visueller Vergleich und Blocker. Keine Klausel ist pauschal vollständig abgenommen. |
| [Seiten](routes.json) | Alle78 tatsächlichen Seitenrouten und12 zusätzliche Operatorvarianten; statische API-/Komponenten-/KPI-Erreichbarkeit. |
| [Rollen und Zustände](route-role-states.csv) | 5588 geplante Rollen-/Zustandsfälle. Planung ist keine Ausführung. |
| [Rollenfokus und Kennzahlen](route-role-kpi.csv) | Rollenabhängiger Seitenzweck und erreichbare Daten-/KPI-Owner; keine Berechnungs- oder Sichtfreigabe aus dem Importgraphen. |
| [Implementierungsnachweise](evidence.json) | Quellhashgebundene Teilnachweise und explizite externe Blocker. Ergebnisnotizen allein erteilen keine Freigabe. |
| [Tatsächlicher CI-Nachweis7bc770a4](ci-7bc770a4.json) | Verdichteter Originalreport inklusive Commit/Run/Artefakt/Reporthash; aktuelle Quellenänderungen benötigen neue Prüfungen. |

## Zentrale Implementierungspakete

- Bestehende zentrale Identity-, Formular-, Sprach-, Desktop-/Mobile-, Consent-,
  Fehler- und Support-Owner erweitert; keine zweite UX-Foundation.
- Profil-/Firmenbilder, Wiederaufnahme, Import, Angebotsversionen/-kommunikation,
  sichere öffentliche Entscheidungen, Reporting/PDF/CSV und private temporäre
  Berichtskopien mit Mandanten-, Rollen- und Persistenzprüfungen.
- [Kontrollierte Kundendubletten](customer-consolidation.md): ausschliesslich
  nachweislich ungenutzte Datensätze mit Vorschau, Bestätigung, atomarem Audit,
  Konkurrenzschutz und gesichertem unklarem Mutationsausgang. Keine automatische
  Zusammenführung historischer Geschäftsbeziehungen.
- [Sprache und Formate](select-localization.md): echte Übersetzungsgrenzen,
  API-/Navigationstexte, gemeinsame Mengen-/Preis-/Datumsanzeige; Benutzerdaten
  bleiben unverändert.
- [Desktop-Header](desktop-header.md): aktuelle Kapitel47-Vorgabe statt redundanter
  alter Arbeitsbereich-/Breadcrumb-Zeile; Mobile/FAB und Rechte bleiben erhalten.
- [Compliance-Quelle](compliance-authority.md):573 aktuelle Pflichten und40
  technische Verträge;392 historische Nachweise getrennt erhalten, keine alte
  Freigabe als neue Revision7-Abnahme.
- [Berichtskopien-Aufbewahrung](report-retention.md): begrenzter, standardmässig
  trockener Cleanup vorbereitet; produktive Scope-/Environment-Konfiguration fehlt.

## Was ausdrücklich noch nicht nachgewiesen ist

Der erfolgreiche vollständige Development-Lauf39691829176 auf7bc770a4 enthält
beide funktionalen Browserjobs und alle sechs Responsive-Jobs sowie tatsächliche
PostgreSQL-Parallelprüfungen. Der Compliance-Report bleibt `compliant:false`:
0 fehlgeschlagene Checks bedeuten nicht573 unabhängige Klauselfreigaben. Er enthält
580 reviewpflichtige,21 teilweise und8 bestandene technische Einträge sowie
3 ungeprüfte und1 manuell erforderlichen Eintrag. Die573 aktuellen Klauseln sind
weiterhin reviewpflichtig.76 Routen besitzen Laufzeit-Messungen; Rollen und Sprache
sind in diesen Messungen nicht vollständig als Dimensionen aufgezeichnet.

Offen bleiben insbesondere vollständige aktuelle Seite×Rolle×Zustand×Sprache-
Abnahme, überprüfte Referenzvergleiche, reale iPhone-/Android-PWA-/Tastatur- und
Assistenztechnik-Prüfungen, fachliche Finanz-/Rechtsfreigaben, reale Provider-
Zustellung/Bounces und externe Mailclients, genehmigte Domains/DNS/Push sowie
ein kontrollierter echter Restore-Nachweis. Eine reine statische Abdeckung schliesst
diese Punkte nicht. Die MwSt.-Auswertung ist keine vollständige Steuerdeklaration.

Ein vorhandener hoher Entwicklungsabhängigkeitsbefund (`braces`, GHSA-vfj7-8cjw-p6xm)
ist nicht behoben. Die bestehende eng begrenzte Ausnahme endet am24.10.2026 und
wurde weder erweitert noch verlängert. Produktionsabhängigkeitsprüfungen bleiben.

Alle Änderungen liegen auf `feat/v25-revision7`, Draft-PR307. Main, bestehende
Sicherheitsarbeiten und andere offene PRs bleiben erhalten. Neue Migrationen wurden
nur isoliert getestet. Merge, produktive Migrationen und Deployment benötigen eine
separate exakte Commit-Freigabe; kein Bypass und keine vorgetäuschte Vier-Augen-Abnahme.
