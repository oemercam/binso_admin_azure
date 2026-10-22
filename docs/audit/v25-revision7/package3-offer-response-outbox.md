# Paket 3 — Angebotsantworten und bestehende Mail-Outbox

Stand 22.10.2026, Ausgangspunkt `1c7ea2a6292bc180fb8f110ff0ac46ea8eba4abe`,
`feat/v25-revision7`, Draft-PR307. Paket 2 war gesichert, Arbeitsbaum sauber;
Avatar profile, Invoice readiness, Quality und CodeQL dieses Ausgangsstands grün.

## Ergebnis und begrenzter Änderungsumfang

Der gesicherte WIP implementiert die Funktionen bereits. Anwendung, Migration0081,
Provider, Rollen, Navigation und FAB werden in diesem Paket nicht geändert.
Keine neue Outbox, kein Scheduler und keine parallele Versandkomponente.

- `scripts/offer-response-mail-contract.mjs`: zusätzliche negative Nachweise für
  Audit-Rollback, verlorene Ergebnisverbuchung, `sending` ohne Blindwiederholung,
  verifizierte/unverifizierte Reply-To-Identität, tokenfreie interne Hinweise und
  Auditdaten; Annahme/Ablehnung samt Quote-/Ereignis-/Job-Rollback, Gegenentscheidung,
  Ablauf, Widerruf, ersetzte Version und aktuelle Berechtigung aller acht Rollen.
- `scripts/offer-response-test.mjs`: gezielter lokaler Runner auf bestehenden
  Migrations-, Rollen-, Repository-, PDF- und Testadaptern. Migration0081 erhält
  eine vorhandene Rechnungs-Outboxzeile vollständig; unbekannte Arten/Zustände
  bleiben durch Constraints verboten. Nur leere isolierte Testdatenbanken zulässig.
- `scripts/postgres-parallel-test.mjs`: dieselben Recovery-/Negativverträge jetzt
  zusätzlich nativ; mindestens sechs verschiedene PostgreSQL-Backend-PIDs bei
  parallelem Replay werden ausdrücklich nachgewiesen. Vorhandene Gates bleiben.
- Dieses Protokoll und die zwei durch den bestehenden Generator aktualisierten
  `v21-5-integration-inventory.json` / `v21-5-routes.md` binden die Testquellen.

## Ausgeführte und wiederverwendete Nachweise

Lokal: `node scripts/offer-response-test.mjs` erfolgreich (PGlite, echte isolierte
Migrationen, eingeschränkte Runtime-Rolle, reale Service-/Transaktionslogik,
ausschliesslich synthetischer Mailtransport). Dazu Syntaxprüfung aller drei
Tests, `git diff --check` und bestehender Foundation-Integrationsvertrag.
PGlite ist ausdrücklich kein Nachweis physischer paralleler Verbindungen.

Ein Zwischenlauf hatte eine falsche positive Erwartung für Projektleitung ohne
Workforce-Zuordnung. RLS verweigerte korrekt. Der Test bildet jetzt den bestehenden
Zuordnungsschutz ab; kein Sicherheitsvertrag wurde gelockert. Der gezielte
abschliessende lokale Lauf ist erfolgreich.

Unveränderte Anwendungsquellen: erfolgreiche native HTTP-/Rollen-/Tenant- und
Migrationsnachweise aus [Quality39749572471](https://github.com/oemercam/binso_admin_azure/actions/runs/39749572471)
auf dem identischen Ausgangsstand werden wiederverwendet. Darin: konkurrierende
HTTP-Annahme/Ablehnung mit genau einem Gewinner, sechs physische Verbindungen mit
einem Provider-Claim, Empfänger-/Aktionscodebindung, Version/Widerruf/Ablauf,
Mitarbeiterantwort mit stabiler Akteurbindung und Replay-Konfliktverweigerung.
Diese historischen Ergebnisse ersetzen nicht die CI-Ausführung neuer Testquellen.
Aktuelle Paketcommit-/CI-Ergebnisse sind im Abschlussbericht ausdrücklich getrennt.

Die erweiterte native Prüfung läuft unverändert im erforderlichen Quality-Gate;
kein separater vollständiger Browserlauf und keine vollständige V25-Matrix.
Ein neuer visueller Nachweis wird aus diesen reinen Teständerungen nicht abgeleitet.

## Nachgewiesenes Verhalten und Grenzen

Entscheidung/Frage, Historie, interner Hinweis, Audit und Versandvorhaben liegen in
einer Transaktion. Fehler rollen diese zurück. Wiederholung derselben Anfrage
setzt nur `queued` oder definitiv `failed` fort; `accepted`, `sending`, `uncertain`
werden nicht blind wiederholt. Der aktuelle Mitarbeiter-Opt-out wird berücksichtigt.
Die Kundennachricht enthält absichtlich den eigenen Angebotslink; interne Hinweise
und Auditdaten enthalten diesen geheimen Capability-Token nicht.

Eine sichere Wiederaufnahme benötigt die vorhandene gültige Capability und die
ursprüngliche Anfragekennung. Kein autonomer Hintergrundversand wird behauptet.
`accepted` bedeutet Providerannahme, nicht Inbox-Zustellung oder menschliches Lesen.
Für `sending`/`uncertain` bleibt externe Providerklärung erforderlich; eine neue
Kennung ist kein zulässiger Umgehungsweg. Ein abgelaufener/widerrufener/ersetzter
Link darf auch keine Wiederaufnahme autorisieren.

Extern/manuell offen: tatsächliche Microsoft-Graph-Annahme und Zustellung, Bounces,
Mailbox-/Reply-To-Verhalten in realen Mailclients sowie fachliche Abnahme der
Empfänger-/Benachrichtigungsregeln. Keine echten Kundenmails, produktiven Migrationen,
Providerkonfigurationsänderungen, Merge oder Deployment. Paket 4 nicht begonnen.
