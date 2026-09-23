# Binso One – Produktionsaudit V67

Ausgangsbasis: bereitgestellter Projektstand `48b64ea` (ZIP ohne `.git`-Metadaten).
Datum: 23.09.2026.

## Wichtigste Befunde der Ausgangsbasis

1. SaaS-, Auth-, Registration-, Stripe-, Plattform- und PWA-Grundlagen waren bereits vorhanden und sollten nicht neu gebaut werden.
2. Die fachlichen Geschäftsdaten wurden trotz Datenbankschema weiterhin primär im Browser-/Demo-Store persistiert. Das war die grösste Produktionslücke.
3. Organisationsrollen wurden in einzelnen serverseitigen Route-Guards aus Entra-Rollen statt aus der autoritativen Membership abgeleitet.
4. Push-Subscriptions hatten noch keine produktive Persistenz.
5. Der Plattformbereich enthielt Betriebskennzahlen als statische Platzhalter.
6. Organisation/Mitgliederverwaltung war im UI vorhanden, aber nicht vollständig mit der serverseitigen Membership-Verwaltung verbunden.
7. Produktmodule wurden nicht durchgängig aus den Plan-Entitlements auf Navigation und direkte Routen angewendet.
8. Der Datenbereich enthielt noch eine reine Import-/Export-Vorbereitung ohne echten Export und mit Demo-Hinweis.
9. CI verwendete npm parallel zu einem vorhandenen pnpm-Lockfile; das Repository enthielt zwei Paketmanager-Lockfiles.
10. Branding enthielt noch einzelne sichtbare bzw. technische Altbezeichnungen "Binso Admin".

## Umgesetzte Produktionshärtung

- Account-/Profilverwaltung mit serverseitiger Persistenz.
- Autoritative Membership-Rollen für serverseitige Tenant-Seiten.
- Serverbasierte Mitgliedereinladungen, Rollen-/Statusänderungen, Seat-Limits und Schutz des letzten Owners.
- Trial-/Tenant-Zugriff sperrt abgelaufene Trials sowie suspended/cancelled Tenants serverseitig.
- Plan-/Modul-Gating in Desktop-, Mobile-/PWA-Navigation, Schnellaktionen und direkten Modulrouten.
- Stripe Checkout/Portal/Webhook-Basis beibehalten und mutierende Browser-APIs mit Same-Origin-Prüfung gehärtet.
- Produktive Geschäftsdatenpersistenz als tenant-gebundener, versionierter PostgreSQL-Zustand mit RLS und Konflikterkennung.
- Geschäftliche Audit-Events werden zusätzlich in die relationale Audit-Tabelle synchronisiert.
- Verschlüsselte Push-Subscription-Persistenz mit AES-256-GCM.
- Betreiber-Health-API und Binso-GmbH-Plattformübersicht mit DB-Latenz, Webhookfehlern, Applikationsfehlern, Registrierungen und aktiven Tenants.
- Client-Routefehler werden datensparsam in `application_events` protokolliert.
- Echter JSON-Gesamtexport und CSV-Bereichsexport; CSV-Import für Firmen, Kontakte und Mitarbeitende.
- Binso-One-Branding bereinigt; bestehender Azure-Ressourcenname bleibt aus Betriebsgründen unverändert.
- CI auf Node 24 + pnpm vereinheitlicht; `package-lock.json` und veraltete Root-Patchdateien entfernt.

## Verifikation im bereitgestellten Ausführungscontainer

- Alle 13 vorhandenen `scripts/check-*.mjs` Prüfungen: **erfolgreich**.
- TypeScript/TSX-Parserprüfung über alle `.ts`/`.tsx`-Dateien: **erfolgreich**.
- `pnpm lint`, `pnpm typecheck`, `pnpm build`: **im Container nicht ausführbar**, weil dort nur Node 22 vorhanden ist, `pnpm` nicht installiert ist und der externe npm-Registry-Zugriff blockiert ist. Die Befehle wurden aufgerufen und endeten mit `pnpm: command not found`; ein Corepack-Nachladen war wegen fehlendem Registry-Zugriff nicht möglich.

Die GitHub-Actions-Pipeline ist so angepasst, dass diese drei Gates und die vollständigen Produktchecks in der vorgesehenen Node-24/pnpm-Umgebung zwingend vor dem Azure-Deployment laufen.

## Externe Go-live-Abhängigkeiten

Produktiver Betrieb benötigt gültige Azure-/Provider-Konfigurationen: PostgreSQL, Entra/External ID, Stripe und – falls Push genutzt wird – VAPID plus `PUSH_SUBSCRIPTION_ENCRYPTION_KEY`. Der im UI vorbereitete Microsoft-365-Mail-/Automationsbereich benötigt weiterhin die entsprechende Graph-/Scheduler-Infrastruktur; Binso One markiert heute deshalb keinen realen E-Mail-Versand vorgetäuscht als ausgeführt, sondern dokumentiert den Versandstatus bewusst als manuellen Geschäftsprozess.
