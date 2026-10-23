# V25 sichern / V26 vorbereiten — Entscheidungsvorlage

Stand: 22.10.2026, Europe/Zurich. Lesender, gezielter Abgleich; keine V26-Implementierung, keine neue Vollanalyse, kein Push/Merge/Deployment und keine produktive Migration. Auftrag begann um 14:05, Grenze 14:50. Diese Dokumentation ersetzt keine Abnahme.

## Verbindliche Grundlage und Ergebnis

Ziel ist die unveränderte [V26 Revision 3](v26-source/BINSO_ONE_V26_MODULAR_MASTERKONZEPT.md), vom Nutzer am 22.10.2026 bereitgestellt; SHA256 `4818eb78c4d4d9efed66c3ca1f39680814e4b6115670a484300b77c4b20afe61`. Alle 28 Kapitel sind berücksichtigt. Ihre eingebetteten Implementierungsaufträge gelten als spätere Zielanforderungen: Der aktuelle ausdrückliche Auftrag erlaubt ausschliesslich Bestandsaufnahme und Planung. Preise, Dienste, Payroll, globale Navigation und Produktionsaktionen werden dadurch nicht freigegeben.

- **V25 konflikttechnisch integrierbar, zur Integration noch blockiert.** Main-Konfliktfreiheit ist keine Sicherheits-, Fach- oder Releasefreigabe.
- **IBAN-Fix vollständig lokal gesichert**, keine zusätzliche Reparatur erforderlich. Für einen später genehmigten Push vorbereitet; aktuelle CI gilt noch für den veröffentlichten Vorgänger.
- **V26 basiert auf vorhandenen Modulen.** Konkrete Lücken und getrennte Modellergänzungen stehen in der [Gap-Matrix und Paketplanung](v26-gap-and-packages.md). Kein zweites Identity-, Zeit-, Rechnungs-, PDF- oder Berechtigungssystem.

## A. Tatsächlicher V25-Stand

| Gegenstand | Verifizierter Stand |
| --- | --- |
| Repository / Branch | `oemercam/binso_admin_azure`, `feat/v25-revision7` |
| Anwendung einschliesslich lokalem IBAN-Fix | `00bfe5ce8086fd69485015a5cafcb695acfb5903` |
| Veröffentlichter PR-Head | `759ab6e0af6d97925d90a404b44507e02d1ecb39` |
| PR | [#307](https://github.com/oemercam/binso_admin_azure/pull/307), OPEN, Draft, nicht gemergt; GitHub `mergeable=true` |
| Aktueller Main | `ba4234604ac16b2209bef70a532ccd94f4953035`, Branch-API erneut gelesen; identisch zum vorhandenen `origin/main` |
| Arbeitsbaum zu Beginn | Keine staged/unstaged/untracked Änderungen. Bestehende Arbeit nicht überschrieben. |
| Lokale Trackinganzeige | `ahead 7` gegen veraltetes `origin/feat/v25-revision7`; **kein Beleg für sieben unveröffentlichte Commits**. Gegen den tatsächlichen GitHub-Head ist genau `00bfe5ce` zusätzlich vorhanden. Kein Fetch nötig. |
| Konfliktprüfung | `git merge-tree <merge-base> origin/main 00bfe5ce` ohne Arbeitsbaum-/Indexänderung: keine Konfliktmarker oder „changed in both“. Main ist vorhandene Basis; kein tatsächlicher Merge ausgeführt. |

Der lokale Fix verwendet nur `LocalizedText` um den bestehenden `paymentIssue`-Text in `components/documents.tsx`. Der bestehende Test `scripts/localization-test.mjs` extrahiert den tatsächlichen JSX-Hinweis, rendert mit dem echten LocaleProvider DE/FR/IT/EN und prüft unveränderte Firmendaten. Readiness-, Bank- und Rechenregeln sind unverändert. Die übrigen drei Dateien dieses Commits sind Abschlussbericht und vorhandene generierte Foundation-Identität.

Vorhandene Nachweise wurden gelesen, **nicht erneut ausgeführt**: Red/Green des tatsächlichen Hinweises, gezieltes ESLint, Typecheck und Foundation-Vertrag erfolgreich. Lokale Logs im Workspace `evidence/fast-track-readiness-locale-{red,green,lint,types}.log` sowie `fast-track-local-locale-foundation.log`; Einordnung im [Fast-Track-Bericht](../audit/v25-revision7/fast-track-final.md). Leeres Lint-Log allein wäre kein Erfolgsbeleg; der gesicherte Abschlussbericht dokumentiert den erfolgreichen Exit. Keine neue Browserprüfung behauptet.

### GitHub-CI am veröffentlichten SHA

| Workflow | Ergebnis | Nachweis |
| --- | --- | --- |
| Quality | success; Jobs `checks`, `build`, `scanner-engine`, `ux-compliance`, `quality` erfolgreich | [39771886024](https://github.com/oemercam/binso_admin_azure/actions/runs/39771886024) |
| CodeQL / `analyze` | success | [39771885933](https://github.com/oemercam/binso_admin_azure/actions/runs/39771885933) |
| Invoice readiness | success | [39771885887](https://github.com/oemercam/binso_admin_azure/actions/runs/39771885887) |
| Document discounts | success | [39771885987](https://github.com/oemercam/binso_admin_azure/actions/runs/39771885987) |
| V25 final responsive sample | success, vorhandene 160/160 Stichproben | [39771885921](https://github.com/oemercam/binso_admin_azure/actions/runs/39771885921) |
| Avatar profile | cancelled; Chromium success, WebKit-Fachtest nicht ausgeführt | [39771885906](https://github.com/oemercam/binso_admin_azure/actions/runs/39771885906) |

Der normale Quality-Browserjob ist im Draft bestimmungsgemäss **skipped**; die erfolgreichen gezielten Workflows ersetzen keine vollständige Release-Browserabnahme. Das abgebrochene WebKit-Setup zeigte langsame/wiederholte Ubuntu-Paketdownloads bis zum bestehenden 20-Minuten-Limit. Kein nachgewiesener Produktdefekt, aber auch kein erfolgreicher WebKit-Nachweis. Keine Timeout-/Gateänderung oder Wiederholung in diesem Auftrag.

Main-Branch-Metadaten nennen die verpflichtenden Kontexte **`quality` und `analyze`**, beide am veröffentlichten SHA erfolgreich. Der detaillierte Protection-Endpunkt liefert **403**; die Ruleset-Liste ist leer. Daraus folgt **nicht**, dass keine weiteren Review-/Freigabevorgaben bestehen. Vor Integration aktuelle Regeln mit berechtigtem Zugriff prüfen. Avatar-WebKit und die weiteren fachlichen Abnahmen bleiben unabhängig von den zwei technischen Pflichtkontexten offen. Für `00bfe5ce` liegt kein neuer GitHub-CI-Nachweis vor; Nachweise nicht übertragen.

### Andere offene PRs: kein blindes Zusammenführen

| PR | Aktueller Bezug zu #307 | Konsequenz |
| --- | --- | --- |
| [#305](https://github.com/oemercam/binso_admin_azure/pull/305), `26dc1ffc` | Offen; Head ist nach `git merge-base --is-ancestor` bereits Vorfahr des lokalen V25-Heads | Keine zusätzliche Codeabhängigkeit durch separaten Merge; PR-Lifecycle separat entscheiden. |
| [#298](https://github.com/oemercam/binso_admin_azure/pull/298), `d25bd5b6` | Offen/Draft; Head ebenfalls enthalten | Vorhandene Tarif-/Modulprofile wiederverwenden; nicht doppelt integrieren. |
| [#306](https://github.com/oemercam/binso_admin_azure/pull/306), `ccc80833` | Offen gegen #305-Branch; Head nicht Vorfahr. Diff zu seiner Basis betrifft nur `scripts/ux-browser-test.mjs` | Parallele Browser-Testkorrektur; kein fachlicher V26-Blocker. Vor späterer Übernahme gezielt gegen aktuellen Adapter abgleichen, nicht pauschal cherry-picken. |
| [#271](https://github.com/oemercam/binso_admin_azure/pull/271), `92f0841b` | Offen, nicht enthalten; separate Header-Deduplikation | Keine nachgewiesene Abhängigkeit dieses Plans. Unverändert lassen. |
| [#267](https://github.com/oemercam/binso_admin_azure/pull/267), `4652bfbd` | Offen/Draft, nicht enthalten; GitHub `mergeable=false`; separate Readiness-/Betriebsgrenze | Keine Voraussetzung für V26-Entwicklung. Nicht zur Umgehung von Produktions-/Betriebsfreigaben mitintegrieren. |

### Konkrete Integrations- und Betriebsgrenzen

1. Ausdrückliche Freigabe für den nächsten Push fehlt weiterhin; der aktuelle Auftrag verbietet ihn. Danach gebündelte CI am **genauen neuen SHA**, einschliesslich Klärung des WebKit-Installationsproblems; kein blindes Retry.
2. Draft-/Review-/exakte SHA-Freigabe und aktuelle Protection-Regeln vor Merge. Konfliktfreiheit allein genügt nicht.
3. Gegen Main enthält #307 vorbereitete Migrationen **0067–0083**. Native isolierte Datenbank-/RLS-Nachweise sind vorhanden; kein Beleg, dass diese Migrationen produktiv angewendet oder mit dem tatsächlichen Produktionsbestand geprüft wurden. Preflight, Rechte, Backup/Restore und Rollback des gesamten kumulativen Pakets separat vor Produktionsfreigabe. Keine neue Migration in dieser Vorbereitung.
4. Kritische Auth-/Finanz-/Upload-Grenzen an `759ab6e0` durch Quality/CodeQL belegt; keine neue Schwächung. Ungeprüfte Registerklauseln bedeuten weder „fehlt“ noch „abgenommen“: 573 insgesamt, 4 implementiert, 62 teilweise belegt, 507 ungeprüft im bestehenden Register. Keine erneute Vollbewertung.
5. Reale Providerzustellung/Bounces/Korrelation und sichere Auflösung unklarer Versände bleiben extern blockiert; Graph202 ist kein Zustellnachweis. [Providervertrag](v25-mail-provider-contract.md) übernehmen.
6. Tatsächliche Alarmempfänger/Eskalation, Restore/RPO/RTO, reale Geräte/PWA/Zoom, menschliche Sprach-/Rechtsfreigabe und die dokumentierte Datums-Ellipse bei1280px bleiben offen. Kein neuer Cloud-/Geräteauftrag; keine pauschale V25-Fertigmeldung.

## Integrationsentscheidung und nächste Freigabe

**Noch blockiert:** Textuell sauber vorbereiteter V25-Stand, aber keine Merge-/Releasefreigabe. Nächste konkrete Voraussetzung ist eine ausdrücklich genehmigte Veröffentlichung des lokalen Fixes mit anschliessender SHA-gebundener Qualifikation; WebKit-/Review-/Produktionsgrenzen bleiben bestehen. Dieser Auftrag nimmt weder Veröffentlichung noch Freigabe vorweg.

V26 darf später nach separater Paketfreigabe auf einem eigenen Feature-Branch vom ausdrücklich benannten gesicherten Stand vorbereitet werden. Keine Annahme, dass #307 schon Main oder produktiv ist. Heute wurde kein V26-Branch angelegt und keine Implementierung begonnen.

## Dokumentationsnachweis dieses Auftrags

Nur die unveränderte Zielquelle, diese Entscheidungsvorlage und die Gap-/Paketplanung werden lokal gesichert. Prüfung: Quellenhash, relative Links/Codepfade, Paketabhängigkeiten, Kapitelabdeckung und `git diff --check`; keine App-Tests, Builds, Datenbank-/Security-Suites, Browsermatrix oder Workflowstarts. Anwendungsstand bleibt `00bfe5ce`; ein nachfolgender Dokumentationscommit ist keine neue Anwendungsqualifikation.

Nach der Paketplanung stoppen. Erst eine ausdrückliche Freigabe startet V26-Paket01; kein automatischer Folgeauftrag. V27 umfasst spätere Widerspruchsanalyse/Bereinigung/globale UX-Konsolidierung, danach Systemaudit. Kritische Rechte-, Datenintegritäts- und Payroll-Grenzen werden jeweils im betroffenen Paket geprüft und nicht bis V27 aufgeschoben.
