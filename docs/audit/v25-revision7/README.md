# Revision7: Implementierung und Abnahmestand

Die unveränderte [vollständige Quelle](source.md) ist verbindlich. P0/P1/P2 sind
im Auftrag, P3 ist ausgeschlossen. Diese Ablage ersetzt keine ausdrückliche
fachliche, visuelle oder produktive Freigabe.

Aktuelle Codequalifikation: [1567eff4, Full Development39726655822](ci-1567eff4.json).
Alle acht Browserjobs, native PostgreSQL-/RLS-/HTTP-/Parallelprüfungen und Gates
sind erfolgreich. [868 Git-Blobs](ci-1567eff4-source.json) reproduzieren den
Originalreport-Digest exakt. Die vollständige Klausel-/Fachabnahme bleibt offen.

## Vollständige Register

| Register | Inhalt und tatsächliche Aussage |
| --- | --- |
| [Anforderungen](requirements.csv) / [JSON](requirements.json) | 573 Klauseln aus allen56 Kapiteln; Soll, Ist, Quellen, Tests, visueller Vergleich und Blocker. Keine Klausel ist pauschal vollständig abgenommen. |
| [Seiten](routes.json) | Alle78 tatsächlichen Seitenrouten und12 zusätzliche Operatorvarianten; statische API-/Komponenten-/KPI-Erreichbarkeit. |
| [Rollen und Zustände](route-role-states.csv) | 5588 geplante Rollen-/Zustandsfälle. Planung ist keine Ausführung. |
| [Rollenfokus und Kennzahlen](route-role-kpi.csv) | Rollenabhängiger Seitenzweck und erreichbare Daten-/KPI-Owner; keine Berechnungs- oder Sichtfreigabe aus dem Importgraphen. |
| [Implementierungsnachweise](evidence.json) | Quellhashgebundene Teilnachweise und explizite externe Blocker. Ergebnisnotizen allein erteilen keine Freigabe. |
| [Abgleich7bc/a9b](evidence-reconciliation.md) / [a9b-Report](ci-a9b7e1fc.json) | Getrennte tatsächliche Commit-/Run-/Artefaktnachweise; neue Quellen benötigen neue Prüfungen. |
| [Historischer Zwischenstand](ci-d052a3be.json) / [Git-Blob-Abgleich](ci-d052a3be-source.json) | Full Development39715830625 auf d052a3be erfolgreich; 865 Quellen und 69 reine lokale Zeilenendenabweichungen konkret abgeglichen. |
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
- [Persönliche Angebots-Erinnerungen](offer-followups.md): ausdrückliches Opt-in,
  Vorschau und persönlicher Verlauf mit atomarer, versionsgebundener In-App-Prüfung;
  kein vorgetäuschter Hintergrund-Mailversand.
- [Unklare Versandausgänge](document-delivery-outcomes.md): dauerhafte Sperre auch
  bei neuer Kennung; bestätigten Nichtversand getrennt von unbekanntem Ausgang.

## Was ausdrücklich noch nicht nachgewiesen ist

Der aktuelle erfolgreiche vollständige Development-Lauf39726655822 auf1567eff4 enthält
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
Frozen-Installation, Lint und Dependency-Audits bestehen. Aktuelle PR-Quality, CodeQL
und Full Development einschliesslich aller acht Browserjobs sind erfolgreich; Main
wurde dadurch nicht geändert. Der Default-Branch-Alert wird nicht als geschlossen behauptet.

Alle Änderungen liegen auf `feat/v25-revision7`, Draft-PR307. Main, bestehende
Sicherheitsarbeiten und andere offene PRs bleiben erhalten. Neue Migrationen wurden
nur isoliert getestet. Merge, produktive Migrationen und Deployment benötigen eine
separate exakte Commit-Freigabe; kein Bypass und keine vorgetäuschte Vier-Augen-Abnahme.

Neu in Fortsetzung: [Rechnungszahlung und Statusachsen](invoice-settlement.md).
Die neue Quelle besitzt eigene geprüfte CI; ältere grüne Nachweise werden dafür nicht verwendet.

[Externe Nachweise und Freigaben](external-acceptance.md) sind getrennt von eigener
Implementierungs- und automatisierbarer Abnahmearbeit dokumentiert.
