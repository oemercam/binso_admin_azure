# V69 – Review und Go-live-Abnahme

Stand: 24.09.2026. Branch: `v69-production-completion`. Version: `0.69.0`.

**Keine pauschale Production-Freigabe.** Die Änderungen schliessen konkrete Lücken, ersetzen aber keine Integrationstests gegen eine isolierte PostgreSQL-Datenbank, Azure Easy Auth, Stripe-Testmodus und ein Graph-Testpostfach. Es wurden keine Production-Migrationen, Deployments, Pushes oder E-Mails ausgeführt.

## Änderungen und Review

| Bereich | Änderung | Verbleibende Grenze |
| --- | --- | --- |
| Architektur | App Router, UI-Komponenten, BusinessStore und pg bleiben erhalten; kein neues Framework. | Geschäftsdaten bleiben tenantweise JSON-Snapshots, keine vollständige relationale Fachpersistenz. |
| Datenintegrität | Tenant-Advisory-Lock auch beim ersten Insert; optimistic concurrency; Browser stoppt nach 409. Dokumentnummerierung nutzt zentrale getestete Funktionen. | Konflikte benötigen Neuladen und manuelles Wiederholen nicht gespeicherter Änderungen; kein Merge-Editor. Alte doppelte Nummern müssen vor Go-live geprüft werden. |
| Berechtigungen | Rollen und Features werden beim Speichern aus der Datenbank gelesen. Finance darf keine Stammdaten/Einstellungen ändern. Employee-Projektion begrenzt Datensätze, verbirgt Kosten und fremde Zeiten; eigene Zeitänderungen erlauben keine Freigabe oder Manipulation fakturierter Zeiten. Ausgestellte Dokumentinhalte dürfen nicht nachträglich umgeschrieben/gelöscht werden. | Snapshot-API ist weiterhin gröber als fachliche Command-Endpunkte. Vollständige fachliche Validierung jeder möglichen Zahlung/Gutschrift/Statuskombination und manipulationssichere Buchhaltung sind nicht abgeschlossen. |
| Membership | Seat-Prüfung und Owner-Schutz serialisiert; Admin kann Owner nicht ändern; Reaktivierung prüft Seats. | Identitäts- und Rollenmatrix mit echten Entra-Konten abnehmen. |
| Auth/Security | Exakte Claim-Auswertung, stabile Subject-ID, Rollenclaims, Prüfung gesperrter Betreiberkonten; öffentliche Origin bevorzugt APP_BASE_URL; Rücksprungpfade blockieren Backslashes; Request-Bodies begrenzt; Korrelations-ID validiert. Kein Production-Fallback auf Demo ohne DB. | Easy-Auth-Header sind nur hinter korrekt konfiguriertem Azure-Proxy vertrauenswürdig. CSP verwendet weiterhin unsafe-inline; Rate-Limits/WAF und zusätzliche CSRF-/Security-Abnahme extern prüfen. |
| Stripe | Fehlgeschlagene/abgebrochene Webhooks erneut verarbeitbar; Duplikatschutz; Abgleich des Live-Abonnements unter DB-Lock; Schutz vor älterem ersetztem Abo; invoice.paid und aktuelle Invoice-Subscription-Referenz; idempotente Kunden-/Checkout-Erstellung; abgelaufene Abos dürfen neu starten. | Stripe-Testmatrix und exakte API-Version abnehmen; keine Steuer-/Rabatt-/Jahrespreisabrechnung im internen MRR-Modell. Checkout-Idempotenz gilt zeitfensterweise, nicht als vollwertiges Checkout-Session-Ledger. |
| Lifecycle | Trial wird expired; vorgemerkte manuelle Planwechsel/Kündigungen bei vorhandenem Periodenende verarbeitet. | Manuelle Abos brauchen ein gepflegtes current_period_end; keine automatische Zahlungsvereinnahmung für manuelle Abos. |
| Dokumentversand | Persistierte Outbox für Angebote, Rechnungen, Mahnungen und Einladungen; UI plant Versand ein; Graph-Annahme aktualisiert Dokumentstatus. Geänderte/bezahlte/stornierte Dokumente werden vor Versand erneut geprüft. Pro Dokument nur ein offener Auftrag je Versandart. | Anhänge sind druckbares HTML, kein serverseitiges PDF. Kein Zustell-/Bounce-Nachweis, keine kundeneigenen Postfächer, CC/Reply-To-/Vorlagenoptionen noch nicht vollständig angebunden. Graph 202 bedeutet Annahme. |
| Versandfehler | Crash/Timeout wird uncertain; kein automatischer Blind-Retry. Betreiber sieht Status und kann offene/unklare Aufträge abbrechen. | Vor erneutem Versand Absenderpostfach prüfen. Genau-einmal-Zustellung ist mit Graph sendMail nicht garantiert. HTML-Anhänge werden von manchen Mail-Gateways gesperrt: vor Freigabe testen. |
| Automationen | Alle zehn Minuten: Trial/manueller Lifecycle, Vertragsrechnungsentwürfe, opt-in Mahnungen, Outbox. Tenant-Locks und Job-Verlauf. Monatsende/Schaltjahr getestet. | Maximal 20 Mails pro Lauf; tenantweiser Lauf nicht als skalierender Queue-Worker ausgelegt. Ein fälliger Vertrag erzeugt je Lauf einen Entwurf; Entwürfe brauchen Versandfreigabe. Feiertage nicht berücksichtigt, Werktage sind Mo–Fr. |
| Betreiber | Jobs, Outbox, Fehlercodes/Korrelations-IDs und Betreiber-Audit zusätzlich zu Tenants, Plänen und Health. Support hat Lesezugriff; Änderungen nur Owner/Admin. | Noch keine Alertzustellung, vollständige Supportkonsole, Restore-Oberfläche oder zentraler Tenant-Export. |
| Speicher | file_objects-Metadaten mit Mandantenpfad, SHA-256, Grösse und Scanstatus, RLS. | Keine Blob-Upload-/Download-API oder Virenscanner-Anbindung. Bestehende Rapport-Dateiangaben speichern weiterhin Metadaten, keine Datei. Nicht als Dateiarchiv einsetzen. |
| Schweiz | Neutraler Absender statt fremdem Binso-Logo/Platzhalterbankdaten; Zeitraum und MWST-Sätze sichtbar. IBAN-Prüfsumme, strukturierter Zahlungsadressentyp und validierte NON-Zahlungsdaten vorbereitet. | Kein QR-Renderer/Zahlteil, keine SIX-Konformitätsprüfung. QR-IBAN wird im Vorbereitungsmodul abgelehnt, solange QR-Referenz nicht implementiert ist. Steuer-/Revisions-/Archivkonformität nicht attestiert. |
| Import/Export | Mehrzeiliges CSV, doppelte Header/Spaltenfehler, 2-MB-/10k-Zeilen-Limits, Zahlenprüfung, Formel-Escaping im Export, Importrechte. | Kein vollständiger JSON-Restore, keine XLSX-Verarbeitung, kein transaktionaler Import mit Vorschau/Undo. |
| UI/PWA | Einheitliche Versandtexte; neutrale Mandanten-Voreinstellungen; unimplementierte PDF-/Lohnversandoptionen deaktiviert/erläutert; nicht implementierte öffentliche API aus Planwerbung entfernt. Service Worker löscht nur eigene Cache-Namen und hat einen fehlertoleranten Offline-Fallback. | Kein neuer visueller Geräte-/Browser-E2E-Test; keine Push-Zustellungsimplementierung. |
| Bereinigung | Unbenutzter Demo-Plattformstore, npm-Lockfile und alte Root-Patch-/Update-Dateien entfernt. | Aktive lokale Demo-Seeds bleiben bewusst erhalten. Historische Vxx-Dokumente bleiben als Historie erhalten; dieses Dokument hat Vorrang. |
| Deployment | pnpm frozen lock, Node 24, materialisierte Standalone-Abhängigkeiten, HTTP-Smoke-Test in CI. Production-Migration/Deploy nur expliziter workflow_dispatch auf main. DB-Pool-Fehlerhandler, Query-Timeouts, serialisierte Migrationen. | Linux-Artefakt muss in GitHub Actions und Azure-Staging geprüft werden; lokaler Windows-Build ersetzt diese Abnahme nicht. |

## Neue Datenbankmigration

Der isolierte Standalone-Test fand nach dem normalen Build einen weiteren Deploymentfehler: blosses Dereferenzieren der pnpm-Symlinks verlor die Auflösung von `@next/env`. `scripts/prepare-standalone.mjs` kopiert nun den vollständigen produktiven Paketbaum mit physischen Dateien und gemeinsam genutzten identischen Paketen. Der korrigierte Runtime-Ordner bestand den HTTP-Smoke-Test ausserhalb des Repositorys; Secret-Dateien werden vom Test-/Deployment-Artefakt ausgeschlossen.

Die CI enthält zusätzlich einen isolierten PostgreSQL-17-Service: Migrationen werden zweimal ausgeführt, anschliessend prüfen `scripts/test-database.mjs` Tenant-RLS mit einer Nicht-Owner-Rolle und die Deduplizierung offener Dokumentmails. Dieser CI-Job wurde hier noch nicht ausgeführt; es wurde nichts gepusht.

`database/migrations/0008_production_completion.sql`:

- Subscription-Statusconstraint um expired erweitert; Stripe-Subscription-Erstellungszeit als Schutz gegen alte Abos.
- Webhook-Verarbeitungszeit und Versuchszähler.
- mail_outbox inklusive Deduplizierung, Status, Provider-Request-ID, unveränderlichem Versandinhalt und Mandanten-RLS.
- job_runs für Ausführung und Ergebnis.
- file_objects als mandantengebundene Speichermetadaten mit Scanstatus.

Bestehende Migrationen wurden nicht verändert. Migration 0008 wurde hier **nicht gegen PostgreSQL ausgeführt**. Ein isolierter lokaler Datenbanktest war nicht möglich: Docker ist installiert, aber der Docker-Daemon nicht erreichbar. Produktionsdatenbank und lokale Secret-Dateien wurden nicht für Migrationsversuche verwendet.

Die Anwendung besitzt bisher zentrale Betreiber-/Auth-Queries ohne Tenant-Kontext. Deshalb nicht blind `FORCE ROW LEVEL SECURITY` oder einen völlig unprivilegierten gemeinsamen Runtime-User aktivieren: zuvor getrennte System-/Tenant-DB-Rollen und Grants testen. RLS schützt keine Queries eines Table-Owners oder BYPASSRLS-Users. Die aktuellen API-Prüfungen sind eine zusätzliche, wesentliche Grenze; getrennte DB-Rollen bleiben eine Production-Härtungsaufgabe.

## Manuelle Azure-/GitHub-Einstellungen

1. Separaten Staging-App-Service bzw. Deployment-Slot und isolierte PostgreSQL-Testdatenbank bereitstellen. Backup/PITR und Restore-Probe vor Migration bestätigen.
2. Node 24 Linux Stack in der Zielregion prüfen; Start `node server.js`, HOSTNAME=0.0.0.0, Plattform-PORT, Always On. SCM_DO_BUILD_DURING_DEPLOYMENT=false, ENABLE_ORYX_BUILD=false. V69 setzt im Deployment Node|24-lts; Verfügbarkeit vor Freigabe bestätigen.
3. APP_BASE_URL auf kanonische HTTPS-Domain; DNS/TLS; DATABASE_URL mit verifiziertem TLS, Poolgrösse passend zur Instanzanzahl; Secrets vorzugsweise Key Vault.
4. GitHub production-Environment mit verpflichtenden Reviewern, OIDC-Föderation und bestehender Azure-Ressourcenberechtigung. DATABASE_URL nur im Migrationsjob. Build und Artefakt dürfen keine Secrets enthalten.
5. BINSO_ONE_BASE_URL und BINSO_ONE_INTERNAL_JOB_SECRET im Environment; INTERNAL_JOB_SECRET identisch in Azure, mindestens 32 zufällige Zeichen. Scheduler aktivieren und ersten Lauf kontrollieren. GitHub-Zeitpläne sind kein garantiertes Echtzeit-Scheduling.
6. Health Check `/api/health`, zentrale Logs und Alerts auf HTTP 5xx, fehlende/fehlgeschlagene Jobs, uncertain-Outbox und Webhookfehler. Aufbewahrung/Löschung für Logs, Outbox-Anhänge und Backups definieren; keine automatische Datenlöschung in diesem Release.
7. Für spätere Dateien: privater Blob-Container, öffentliche Freigaben deaktiviert, Managed Identity/RBAC, Malware-Scan und Retention festlegen. Noch keine Uploads freischalten.

## Manuelle Entra-/Easy-Auth-Einstellungen

- Easy Auth muss Identitätsheader selbst setzen/bereinigen und alle App-Zugänge schützen. Direkte Zugriffe auf den Node-Prozess verhindern.
- Öffentliche Auth-/Registrierungsseiten, statische Ressourcen und Health korrekt erreichbar halten; Stripe-Webhook und internen Schedulerpfad von interaktivem Login ausnehmen. Ihre eigenen Signatur-/Bearer-Prüfungen bleiben erforderlich.
- AUTH_MODE=azure; AUTH_PROVIDER_NAME passend zum konfigurierten Provider; Redirect-/Logout-URLs für die kanonische Domain.
- Plattform-App-Rollen platform_owner/platform_admin/platform_support nur berechtigten Betreiberkonten zuweisen. Kundenrollen kommen aus PostgreSQL-Memberships.
- Verifizierte, nicht vom Benutzer beliebig fälschbare E-Mail-Claims und stabile Subject-IDs sicherstellen: Einladung wird anhand der E-Mail übernommen. Angezeigte Loginmethoden müssen tatsächlich im External-ID-Tenant eingerichtet sein.

## Manuelle Stripe-Einstellungen

- Zuerst Testkeys/Prices, CHF-Produkte für Starter/Business/Professional; Portal und erlaubte Planwechsel konfigurieren. Livekeys erst nach Abnahme.
- Webhook `/api/billing/webhook`: customer.subscription.created/updated/deleted, checkout.session.completed, invoice.payment_failed und invoice.paid; Signing Secret in STRIPE_WEBHOOK_SECRET.
- Price-IDs eindeutig den Plänen zuordnen. Bestehende Stripe-Abos benötigen metadata.organizationId. API-Version, monatliche Preissemantik, Steuerkonfiguration und Abrechnungskontakt prüfen.
- Szenarien: mehrfaches Event, Fehler mit Wiederholung, verspätetes Event, Zahlungsausfall/Recovery, Kündigung/Neustart, Downgrade/Seat-Limit und Betreiber-Suspendierung.

## Manuelle Graph-Einstellungen

- EMAIL_DELIVERY_MODE=graph; GRAPH_TENANT_ID, GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET, GRAPH_SENDER_USER_ID als serverseitige Einstellungen.
- Mail.Send als Application Permission mit Admin Consent; Zugriff mit Exchange Application RBAC auf das konkrete Betreiberpostfach begrenzen. Postfachlizenz/-typ und Sent Items prüfen.
- Versanddomäne, SPF/DKIM/DMARC und Reply-Verhalten abnehmen. Die aktuellen Absenderfelder im Tenant-Profil bestimmen nicht die tatsächlich autorisierte Graph-Absenderidentität.
- Testeinladung sowie Angebot/Rechnung/Mahnung mit HTML-Anhang an kontrollierte Testempfänger senden. Zustellung und Unzustellbarkeiten separat im Postfach prüfen.

## Erforderliche Abnahme vor Production

- 0001–0008 auf leerer Testdatenbank und 0008 auf einer anonymisierten Kopie des V68-Schemas ausführen; danach erneuter Migrationslauf ohne Änderungen.
- Zwei Tenants und Owner/Admin/Finance/Employee/Support mit direkten API-Aufrufen testen. Verbotene Reads/Writes, Rollenwechsel während Sitzung, letzter Owner und parallele Seat-Einladungen.
- Zeit → Freigabe/Nachweis → Rechnung → Teilzahlung → Gutschrift/Storno. Ausgestellte Dokumente unveränderbar; keine doppelte Rechnungsnummer; parallele Tabs erzeugen 409 ohne Überschreiben.
- Monatsende/Schaltjahr, zweimaliger Schedulerlauf, Überschneidung mit manuellem Speichern, Zahlung vor Mahnversand, Graph-Ausfall und Worker-Abbruch nach Sendung.
- Desktop/Mobile/PWA: Anmeldung, Organisationswechsel, Bearbeiten/Speichern, Versand, Offline-Fallback und Update über ein echtes Azure-Staging-Artefakt.
- Fehlgeschlagenes Deployment: vorheriges ZIP wieder deployen; additive Migration nicht automatisch zurückrollen. Bei Datenproblemen Restore nach dokumentiertem Betreiberverfahren.

## Quellen für Provider-/Rechnungsgrenzen

- [Next.js Standalone Output](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)
- [Stripe Webhooks: Wiederholungen und Ereignisreihenfolge](https://docs.stripe.com/webhooks)
- [Microsoft Graph sendMail: 202 Accepted ist keine Zustellbestätigung](https://learn.microsoft.com/en-us/graph/api/user-sendmail?view=graph-rest-1.0)
- [SIX QR-Rechnung und aktuelle Implementation Guidelines](https://www.six-group.com/de/products-services/banking-services/payment-standardization/standards/qr-bill.html)
- [Schweizer KMU-Portal: Rechnungsstellung](https://www.kmu.admin.ch/de/rechnungsstellung)

Die Quellen wurden für die Implementierung konsultiert. Keine rechtliche oder SIX-Konformitätsbescheinigung.

## Lokale Verifikation

Die tatsächlichen Endergebnisse werden nach dem finalen Prüflauf in `docs/V69-VALIDATION.md` festgehalten. Die vorhandenen Text-/Strukturchecks ergänzen die Verhaltenstests; sie sind keine externen Integrationstests.
