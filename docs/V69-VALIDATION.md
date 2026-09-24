# V69 – Prüfprotokoll

24.09.2026, Windows, Node 24.14.1, pnpm 10.17.1, Next.js 16.3.6.

| Prüfung | Ergebnis |
| --- | --- |
| pnpm install --frozen-lockfile | Erfolgreich; Lockfile unverändert. pnpm meldet das bereits blockierte Build-Skript von unrs-resolver; Lint und Build funktionieren damit. |
| pnpm lint | Erfolgreich, keine Warnungen. |
| pnpm typecheck | Erfolgreich. |
| pnpm run actions:check | Erfolgreich, 81 TSX/JSX-Dateien. |
| pnpm run verify | Erfolgreich; Core-/V69-Verhaltenstests, Typecheck, Lint, alle 14 Struktur-/Produktchecks und Produktionsbuild. |
| pnpm build | Separat erfolgreich. |
| pnpm deployment:prepare .cache/v69-deploy-2 | Erfolgreich; 34 physische Runtime-Pakete. |
| node scripts/smoke-standalone.mjs .cache/v69-deploy-2 | Erfolgreich; materialisiertes Artefakt ausserhalb des Repositorys, ohne Secret-Dateien. Gemeinsame React-Instanz geprüft. |
| git diff --check | Erfolgreich. |

Der HTTP-Smoke-Test prüft `/api/health` ohne Datenbank (erwartet 503), `/sign-in`, `/offline`, `/manifest.webmanifest`, `/sw.js`, App-Icon und die Umleitung beim nicht authentifizierten Dashboard-Zugriff. Er startet keinen Production-Dienst und verwendet keine Providerkonten.

Während der Prüfung gefunden und behoben:

- veraltete Core-Testannahme zur inzwischen persistierten Push-Subscription;
- React-Lintregel bei initialem Laden der Betreiber-Betriebsdaten;
- veraltete Stripe-Strukturprüfung nach Erweiterung um fehlgeschlagene Events;
- verlorene transitive pnpm-Abhängigkeit `@next/env` im dereferenzierten Standalone-Ordner;
- potenziell getrennte React-Instanzen beim naiven rekursiven Kopieren – identische Pakete werden gemeinsam materialisiert;
- Dokumentnummerierung und fehlende Organisationszuordnung neu erzeugter Auftragsrichtlinien;
- Statusconstraint für abgelaufene Subscriptions und bestehende zusammengesetzte Schlüssel von Auftragsregeln berücksichtigt.

Nicht ausgeführt und nicht als bestanden gewertet:

- neue PostgreSQL-Migration und RLS-Integrationstest: Docker-Daemon lokal nicht erreichbar;
- neuer isolierter PostgreSQL-CI-Job: kein Push, daher kein GitHub-Lauf;
- Azure Linux/Staging-Deployment und Easy-Auth-Identitätsprüfung;
- echte Stripe-Testevents, Graph-Zustellung, Browser-/Mobil-/PWA-E2E;
- production:preflight gegen eine produktive Infrastruktur.

Es wurden keine externen E-Mails versendet, keine Datenbankmigrationen gegen vorhandene Datenbanken ausgeführt, nichts deployed und nichts gepusht. Die Produktionsgrenzen und manuellen Schritte stehen in `V69-REVIEW-AND-GO-LIVE.md`.
