# V24 – Baseline und Abnahmestatus

Stand: 15.10.2026. Geprüfter main: `cb1e5574880790f9d7ad7404572876edd8149689`.

**Gesamtauftrag offen. Keine Release-Abnahme.** Diese Phase liefert die statische Bestandsaufnahme und erste belegte Ursachen. Sie ersetzt weder vollständige Security-Prüfung noch Browser-, PostgreSQL- oder Geräteabnahme. Keine produktive Änderung ausgeführt.

## Quellen und Standabgleich

- Vollständiger Auftrag: `master-implementation.md`; unverändert aus dem Anhang übernommen.
- Vollständige Anforderungsabsätze: `requirements-ledger.json`. Ein Eintrag ist ein Anforderungsbündel, kein Nachweis, dass jede Einzelanforderung bereits atomisiert oder erfüllt ist. Alle bleiben bis zur individuellen Abnahme offen.
- Live `/api/health` meldete bei der read-only Prüfung release `03929b8`, SHA `03929b80c27310aa95d7c12e0eb695aa55897e13`, HTTP-Erfolg. Das beweist Erreichbarkeit dieses Endpunkts, keine DB-Readiness oder vollständige Funktionsfähigkeit. Produktion entspricht damit nicht dem untersuchten main.
- Offene PRs: [#249](https://github.com/oemercam/binso_admin_azure/pull/249), [#250](https://github.com/oemercam/binso_admin_azure/pull/250). #250 enthält laut PR-Beschreibung #249; Head `1c860005f6e3edc1dc819ac711d1b563cc7d8f2f`, Base wie oben. Nicht integriert, nicht als abgenommen verbucht. Übersetzungen/Sessions/Wartung/Projekte/Reporting werden vor weiteren Eingriffen gegen diesen Diff abgeglichen.
- GitHub-Workflow-Abfrage lieferte keine Runs für den angefragten main-SHA. Kein Schluss über grüne CI oder erfolgreichen Deploy daraus zulässig.

## Ist-Inventar

`source-inventory.json` wurde mit der bestehenden Funktion `inventory()` aus `scripts/ux-inventory.mjs` erstellt: **72 Seitenrouten, 96 API-Routen, 184 Komponenten, 2’528 CSS-Regeln, 355 Kaskadenkandidaten, kein !important**. Kandidaten sind keine bewiesenen Fehler. Renderbedingungen, CSS-Spezifität und tatsächliche Sichtbarkeit brauchen Browser-Evidenz.

Die bestehende CSS-Importfolge ist tokens → base → marketing → app → operator → responsive. Bestehende Eigentümer sind `components/ui.tsx`, `components/binso-ux.tsx`, `components/app-chrome.tsx`, `components/app-shell.tsx` und `components/operator.tsx`. Keine zweite Foundation anlegen. Detaillierte Ursachen und nächste Massnahmen: `findings.md`.

## Phasen und Reihenfolge

| Phase | Arbeit | Status / Abnahme |
| --- | --- | --- |
| 0 | Auftrag, HEAD/PR/Live-Abgleich, Inventar und Baseline | Statische Erstaufnahme vorhanden; Runtime-Nachweise teilweise blockiert |
| 1–2 | Architektur, Dependencies, Security, Datenintegrität und Control-Matrix | Erstinventar; vertiefte Prüfung offen |
| 3–7 | Zentrale Foundation, Navigation, Seiten/Actions/Overlays, Formulare, Chat, Glass/Motion | Ursachen belegt; Implementierung und Regression offen |
| 8–9 | KPI-Metriken, Charts, isolierte positive/negative Demo | Semantische Lücken belegt; Implementierung und DB-Nachweise offen |
| 10 | Geschäftsprozesse und E2E | Bestehende Services inventarisiert; vollständige Übergangsmatrix offen |
| 11–13 | Admin, Lifecycle, SEO/i18n/PWA, Integrationen und Recovery | Bestehende und offene PR-Arbeit abgleichen; operative Nachweise offen |
| 14–15 | Vollständige QA, Screenshots, Release Readiness | Nicht freigegeben |

Nach jeder Implementierungsphase: eigene Änderung, Commit/PR, genaue Tests, Restpunkte und Abnahmestatus. Die Abschnitte des Auftrags bleiben vollständig verbindlich; diese Tabelle verkürzt sie nicht.

## Grenzen und Fortsetzung

Node `24.19.0`, Projekt-pnpm `10.17.1` über `corepack pnpm`. Der globale pnpm ist `11.25.0` und warnt bei internem Aufruf vor ignorierten package.json-pnpm-Schlüsseln; keine Lockfile-Aktualisierung durchgeführt. Kein `DATABASE_URL` vorhanden; kein produktiver Zugang gesucht oder verwendet. Lokale Socket-Listener sind mit EPERM blockiert. Dadurch lassen sich Scanner/HTTP/Browser und echte Runtime-DB-RLS-Abnahme hier nicht vollständig ausführen. Pflicht-Gates bleiben blockierend; keine Tests übersprungen oder umgeschrieben, um grün zu melden.

Die unveränderten GitHub-PR-Gates können in ihrer vorgesehenen Runner-Umgebung weitere Evidenz liefern. Fehlende reale PostgreSQL-/PWA-/Gerätenachweise bleiben auch bei grünen statischen Tests offen.

Kein Merge auf main: `.github/workflows/deploy-azure.yml` startet nach erfolgreicher main-Quality automatisch produktive Migrationen/Deploy. Ein Merge wäre damit keine rein interne Integration. Produktivfreigabe bleibt ausdrücklich erforderlich.

## Nachfolgende Implementierung

Der begrenzte zentrale Fix für Erstellen-Aktionen ist separat in `create-placement-phase.md` dokumentiert. Das obige Inventar und die Baseline bleiben auf cb1e5574 bezogen. V24 ist weiterhin nicht vollständig umgesetzt oder abgenommen.
