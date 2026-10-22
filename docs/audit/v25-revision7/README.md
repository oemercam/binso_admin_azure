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
| [Abgleich7bc/a9b](evidence-reconciliation.md) / [a9b-Report](ci-a9b7e1fc.json) | Getrennte tatsächliche Commit-/Run-/Artefaktnachweise; neue Quellen benötigen neue Prüfungen. |
| [Priorisierte Restbewertung](completion-review.md) | Implementierungslücken, fehlende Abnahmen und externe Konfiguration getrennt. |

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

Der erfolgreiche vollständige Development-Lauf39697429990 aufa9b7e1fc enthält
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

Der bisher offene Entwicklungsbefund `braces` wurde im aktuellen Folgequellbaum
[ursächlich aus dem Next-Lintpfad entfernt](security-braces.md). Die Audit-Ausnahme
ist entfernt; alle High-/Critical-Befunde bleiben blockierend. Lokale gezielte Tests,
Frozen-Installation, Lint und Dependency-Audits bestehen. Neue vollständige Commit-CI
ist für diesen Folgequellstand noch erforderlich; Main wurde dadurch nicht geändert.

Alle Änderungen liegen auf `feat/v25-revision7`, Draft-PR307. Main, bestehende
Sicherheitsarbeiten und andere offene PRs bleiben erhalten. Neue Migrationen wurden
nur isoliert getestet. Merge, produktive Migrationen und Deployment benötigen eine
separate exakte Commit-Freigabe; kein Bypass und keine vorgetäuschte Vier-Augen-Abnahme.
