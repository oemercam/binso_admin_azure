# GitHub-Abgleich – 24. Oktober 2026

Basis: ausgelieferter Main `3bca1b9a7743cf912ba625007d7e147ff0fa4b19`.

## Gemeinsamer Korrekturkandidat PR #313

- Zod als transitive ESLint-React-Hooks-Abhängigkeit von 4.6.5 auf 4.6.7
  aktualisiert. Die offizielle [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)
  nennt 4.6.6 als erste korrigierte Version. Keine Audit-Ausnahme und keine
  zusätzliche direkte Produktabhängigkeit. Die übrigen Paketversionen bleiben
  gleich; pnpm normalisiert zusätzlich die zyklischen ESLint-Peer-Schlüssel.
- Ein identischer zweiter Eintrag `/angebote/:path*` in `next.config.ts`
  entfernt (aus PR #271 übernommen). Tatsächlich ausgeführte Development- und
  Production-Konfigurationen liefern dieselben wirksamen Header, Weiterleitungen
  und übrigen Einstellungen. Unterschiedliche Headerregeln für dieselbe Route
  bleiben erhalten.
- Vorhandene Timeout-Korrektur aus #313: Browserjob maximal 45 statt 30 Minuten.
  Matrix, Browser, Assertions und blockierende Ergebnisse bleiben unverändert.

Dependabot-Lauf 40016710441 scheiterte mit `security_update_not_possible` für
Zod 4.6.5. Die manuelle transitive Aktualisierung mit pnpm 10.17.1 konnte dagegen
4.6.7 auflösen und installieren. Historische rote Läufe werden nicht gelöscht;
der neue Kandidat benötigt eigene erfolgreiche GitHub-Prüfungen.

## Alte PRs

| PR | Nachweis und Behandlung |
| --- | --- |
| #298 | Head `d25bd5b6` ist Vorfahr von Main. Redundanten PR ohne weiteren Merge geschlossen; fachliche und Geräteabnahmen bleiben offen. |
| #306 | PDF-Testkorrektur bereits in Main: Actions-Dialog öffnen und abwarten, danach Testuhr installieren. Redundanten PR ohne weiteren Merge geschlossen. |
| #271 | Identische Header-Bereinigung in #313 übernommen. Separater PR wird nach Veröffentlichung dieses Kandidaten geschlossen; Branch bleibt erhalten. |
| #267 | Eigenständige, nicht integrierte Readiness-/Zugriffsarchitektur. Bleibt Draft: tatsächliche Reader-Rechte, OIDC und Readiness-Umgebung sind nicht nachgewiesen. Keine automatische Aktivierung. |

## Prüfung und Grenzen

Frische Installation mit unveränderter pnpm-Version und `--frozen-lockfile`.
Vollständiger Produktions-/Entwicklungs-Abhängigkeitsaudit erfolgreich.
Bestehende Sicherheitsgegenfälle, tatsächliche Runtime-Integrität und
Workflow-Sicherheit erfolgreich. Zusätzlicher ausführbarer Vorher-/Nachher-
Vergleich beider Next-Konfigurationsmodi erfolgreich. GitHub qualifiziert den
veröffentlichten Commit eigenständig; ausstehende Prüfungen sind kein Erfolg.

Issue #238 bleibt die offene vollständige Produktionsabnahme. Bestehendes
Profil `development-20261012`, globale V5-, Rechtsübersetzungs- und reale
Geräteabnahmen werden nicht durch die GitHub-Bereinigung freigegeben.
Dieser Kandidat hat noch keine exakte Merge-/Deployment-Freigabe.
