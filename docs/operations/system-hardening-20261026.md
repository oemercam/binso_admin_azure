# Systemaudit – Umsetzung vom 26. Oktober 2026

Basis: `02a061a4db4c3f0f55b1f829900b2577bfc9c21f`.
Die Nutzerfreigabe „ja implementier alles“ erlaubt die Auditkorrekturen.
Der Arbeitsbranch ist `fix/system-audit-20261026`. Keine Produktionsabnahme wird
aus Code, Konfigurationsvorbereitung oder einem grünen Entwicklungsprofil abgeleitet.

| Befund | Implementierung | Ausstehender tatsächlicher Nachweis |
|---|---|---|
| F01 Uploads | clean-only verweigert Upload ohne Scanner vor Speicherung; qualifizierte Scanneraktivierung benötigt expliziten Releaseparameter, vorhandene Kapazität/Registry/Identität und qualifiziertes Image. | Live-Scanner aktivieren, Altbestand kontrolliert nachprüfen, EICAR-/Ausfallprüfung. Keine ungescannte Freigabe. |
| F02 Firewall | Exakte kurzlebige Runner-IP-Regel mit always-Cleanup für Deploy/Wartung; driftgeschützter Plan-/Apply-/Rollback-Weg für App-Egress. | OIDC-Rechte und Runnerzugang real belegen, Plan mit SHA/Hash freigeben und anwenden; historische Client-IP separat entscheiden. Die bewusst rein lesende Diagnose erhält keine Netz-Schreibrechte und benötigt vor Netzumstellung einen gesondert freigegebenen Zugangsweg. |
| F03 Abnahme | Unverkleinerbares maschinenlesbares Register mit SHA-/Hash-gebundenen Nachweisen; zusätzliche Produktionssperre. | Die elf externen Abnahmebereiche tatsächlich abschließen. |
| F04 TLS | Deploy konsolidiert DATABASE_SSL=true und Zertifikatsprüfung=true; tatsächliche pg-Konfiguration wird vor Ausgabe geprüft. | Mit neuem Release anwenden; aktueller verify-full-Schutz bleibt erhalten. |
| F05 DB-Gates | Vertrag aller 125 Tabellen/Spalten/RLS-/FORCE-/Policy-Namen; alle 108 Migrationen und administrative Checksummen; Negativtests; globale DB-Migrationssperre. | PostgreSQL-18-CI sowie Live-Katalogprüfung über freigegebenen Zugang. |
| F06 DB-Parität | Echte PostgreSQL-Gates verwenden 18; bisherige native Konkurrenz-/Rollenprüfungen bleiben. | Neue CI-Ausführung des aktuellen Branches. |
| F07 Restore | Ausführbares Verfahren und dokumentierte Entscheidungstore; keine stillen RPO/RTO-/Kostenannahmen. | RPO/RTO bestätigen, echten separaten Restore mit Kostenfreigabe und Rückbau ausführen. |
| F08 Monitoring | Exakte abonnementübergreifende Resource-/Scope-/ActionGroup-Prüfung; stündlicher unabhängiger HTTP-/Readiness-/Retention-Wächter ohne Produktionsfreigabeumgehung. | Tatsächliche Alarmzustellung und Eskalationsbestätigung; GitHub-Zeitpläne bieten keine harte Verfügbarkeits-SLA. |
| F09 Windows-QA | Portabler Deploy-Settings-Prädikat; Windows-Protokolltests und sichere Ablehnung unprüfbarer Unix-Manifeste; native Unix-/Signal-/Dateirecht-Gates bleiben Linuxpflicht. | Gesamte neue Linux-CI; Windows ist kein Beleg für Linux-Dateirechte oder Graceful-Signal-Verhalten. |
| F10 Ablage/Regeln | Aktueller Index, Regelrangfolge, korrigierte Checkliste und Metadaten-Ablageregister; historische Quellen bleiben erhalten. | Weitere manuelle Archivierung nur nach Referenzprüfung. |
| F11 Retention | OIDC/Runnerzugang ergänzt; unabhängige Prüfung auf letzten erfolgreichen Zeitplanlauf innerhalb 36 Stunden. | Production-Environment-Warten klären und tatsächlichen erfolgreichen Lauf belegen; keine Abschwächung des Schutzes. |

## Produktionsverfahren

1. Alle Code-/DB-/Security-Gates und die vollständige Release-QA ausführen.
2. `pnpm ops:readiness` zeigt noch fehlende Nachweise; Produktion niemals durch
   handgesetzte Häkchen oder unverifizierte Berichte freigeben.
   Tatsächliche Nachweise werden nach dem unveränderlichen Quellcommit als
   geschütztes Artefakt `binso-production-evidence-<volle-SHA>` bereitgestellt:
   `register.json` plus die darin hashgebundenen Dateien unter
   `docs/evidence/production/`. Quality und Deploy laden den explizit ausgewählten
   Run über `production_evidence_run_id`; jedes Register muss dieselbe volle
   Quell-SHA enthalten. Nachweise werden nicht zurück in den bereits geprüften
   Quellcommit geschrieben. Ohne Artefakt bleibt die Produktionssperre aktiv.
3. Im aktivierten Workspace in dieses Checkout wechseln. Rein lesenden Netzplan
   erzeugen: `./scripts/azure-hardening.ps1 -Mode Plan -PlanFile <neue-absolute-json-datei>`.
4. SHA, Planhash, vollständige Egressliste, kleine Neustartunterbrechung und
   Rückweg prüfen. Vor Apply Runner-Rechte und tatsächliche enge Verbindung
   beweisen. `Apply` benötigt exakte SHA, Planhash, `-RunnerAccessVerified` und
   `-DiagnosticAccessVerified`; ohne beide tatsächlichen Zugangsbelege bleibt
   die Firewallumstellung gesperrt.
   Der Diagnoseworkflow bleibt einschließlich seiner Schutztests rein lesend.
   Für ihn vor Abschalten der breiten Firewallregel einen autorisierten privaten
   Runner oder separat freigegebenen Netzwerkzugang bereitstellen; keine
   Schreibberechtigung aus einem Diagnoseauftrag ableiten.
5. Der Plan ändert keine SKU und legt keine bezahlte Ressource an. Er schränkt
   Azure-weiten DB-Zugang auf App-IP-Adressen ein, konsolidiert TLS, aktiviert
   HTTP/2 und deaktiviert FTP. Nach Neustart muss DB-Readiness bestehen; andernfalls
   wird die vorangegangene Konfiguration wiederhergestellt.
6. Scanner benötigt vorher genehmigte Kapazität und Registry. Kein automatisches
   Upgrade, kein blindes Aktivieren und keine ungescannte Umgehung. Nach tatsächlicher
   Aktivierung `rescan-pending-files.mjs` auf Linux pro explizitem Tenant zuerst
   als Manifestvorschau, danach mit genehmigtem Manifest anwenden.

## Lokale QA und Ablage

`pnpm qa:doctor` prüft Voraussetzungen und nennt plattformspezifische Grenzen.
Windows führt dieselben fachlichen Tests aus; Unix-Socket-Protokolle werden dort
mit Duplex-Streams geprüft, native Unix-Dateirechte und Signale dagegen weiterhin
auf Linux. Kontrollierter produktiver Rescan bleibt Linux vorbehalten und lehnt
unter Windows unsichere Ersatzannahmen ausdrücklich ab.

`pnpm workspace:inventory --root <workspace>` erzeugt ein Metadatenregister mit
Quelle, ZIP-Archiv, Nachweis, Hilfsskript und privaten Einträgen. Es liest keine
privaten Inhalte und verschiebt/löscht nichts. Der ursprüngliche Checkout und
seine lokalen Änderungen bleiben erhalten; der aktuelle Arbeitsbranch liegt in
einem separaten Git-Worktree. Das Register außerhalb des Repositorys ist lokaler
Nachweis, kein automatisches öffentliches Veröffentlichungsartefakt.

## Restore, Slot und Abnahme

[Restore-Verfahren](../azure-postgresql-backup-restore.md) und
[Rollback](../production-rollback.md) bleiben verbindlich. Der vorhandene Staging-
Slot ist keine automatische Erlaubnis zum Slot-Swap: Identitäts-, Host-/Origin-,
Cookie-, Secret- und Worker-Einstellungen müssen vor einer Umstellung separat
verifiziert werden. Datenbank-Rückmigrationen werden nicht automatisch ausgeführt.
Juristische, Steuer-/Lohn-, reale Geräte- und Zustellnachweise bleiben externe
Abnahmen. Keine neue juristische Klausel wurde zur scheinbaren Schließung erfunden.

Azure-Befehle folgen der [offiziellen Firewall-CLI](https://learn.microsoft.com/cli/azure/postgres/flexible-server/firewall-rule).
Eine spätere Slot-Promotion muss [Warmup und Swap-Regeln](https://learn.microsoft.com/en-au/azure/app-service/deploy-staging-slots) berücksichtigen.
