# V21.3 Datenfundament – Implementierungs- und Abnahmenachweis

Stand: 2026-10-09. **Review-Kandidat; keine vollständige Release-Abnahme.**

## Grundlage und Nachweisgrenzen

Basis dieses isolierten Branches ist `7b90a5c7353cf2061987fcd0f4550210bbc00f92` (V21.1 / Draft PR #228), einschliesslich main `1eef9fb1d005d4752f12a9dd5c0e620decca4444`. Ein erneutes `git fetch origin` bestätigte diese Grundlage. Der vorhandene lokale V21.2-Branch zeigt auf denselben Commit; seine Inventardateien sind uncommitted. Es gibt deshalb **keinen integrierbaren V21.2-Implementierungscommit**. Vor Release muss der tatsächliche V21.2-Abschluss übernommen und auf Überschneidungen geprüft werden. Der fremde Checkout wurde nicht verändert.

`node scripts/data-inventory.mjs` inventarisiert 95 API-Dateien, 21 Client-Dateien mit erkannten Zugriffsaufrufen, 46 Migrationen und 95 Tabellendeklarationen. Zusätzlich wurde jede Migration in einer frischen isolierten Datenbank tatsächlich angewendet: [v21-3-schema-inventory.json](v21-3-schema-inventory.json) weist 95 aktuelle Tabellen, 1222 Spalten, 514 Constraints, 69 Policies und 335 Indizes nach. Diese Metadaten enthalten keine Geschäftsdatensätze. Das ist eine statische AST-/SQL-Bestandsaufnahme, keine Behauptung, dass 95 Tabellen aktuell benutzt oder sämtliche Laufzeitpfade sicherheitsgeprüft sind. Exakte Aufrufargumente, Zeilen, Import-Abhängigkeiten, Consumer-Seiten, FK- und RLS-Deklarationen stehen in [v21-3-data-inventory.json](v21-3-data-inventory.json); HTTP-Methoden in [v21-3-api-inventory.md](v21-3-api-inventory.md). Dynamische Dispatches werden zusätzlich in `lib/server/database.ts` und `repositories/business-api.ts` ausgewertet.

## Datenflussmatrix

`GET` bezeichnet nicht persistierte Browserantworten (`no-store`). Gemeinsamer Transport: `lib/client/backend.ts`; zentrale Domänenrevisionen: `data-events.ts`; migrierte Consumer: `use-api-query.ts`. Bestehende Formzustände bleiben lokal. Authentifizierungsinformationen haben weiterhin einen begrenzten In-Memory-Cache; Geschäftsantworten werden nicht in localStorage gespeichert. Die folgenden Tabellen nennen tatsächlich aus Queries/Dispatches abgeleitete Quellen, nicht nur ähnlich benannte Dateien.

| Domäne | Datenquelle / Data Layer | API | Consumer-Seiten / Komponenten | Schreiboperationen | Cache / Persistenz | Abhängigkeiten |
|---|---|---|---|---|---|---|
| Organisation / Mandanten | organizations, memberships, entitlements; session/provisioning | auth/session, settings/company; operator/accounts | App-Shell, Einstellungen, Operator | Provisionierung, Firmenänderung, Einschränkung | Session 30 s, serverseitige Cookies; settings/session Revision | Rollen, Module, Billing, PDF |
| Benutzer / Rollen | app_users, organization_memberships, organization_invitations, auth_tokens; invitations/RBAC | auth/*, settings/team/* | Login, Sicherheit, Team | Einladen, Akzeptieren, Rollenänderung, Widerruf | Sessionrevision nach Teamänderung; Token serverseitig | Mandant, Audit, Mail |
| Kunden / Kontakte | customers, customer_contacts; business-api/contacts | customers, customers/[id]/contacts | Kundenliste/-detail, Dokumenteditor, Timer-Auswahl | Create/edit/archive; Hauptkontakt | customers Revision; offene Detailansicht lädt erneut | Dokumente, Zahlungen, Zeit, Projekte |
| Angebote | quotes, quote_lines, document snapshots; business-api/document-process | documents?kind=offer, documents/[number]/{status,send,pdf} | Angebote, Detail, Kundenfinanzen, Projektanlage | Entwurf, Bearbeiten, Annehmen/Ablehnen, Umwandeln, Versenden | documents Revision; PDF no-store | Kunde, Projekt, Rechnung, Audit |
| Rechnungen | invoices, invoice_lines, invoice_line_time_entries/expenses, counters | documents?kind=invoice, documents/[number]/* | Rechnungen, Editor/Detail, Kundenfinanzen, Dashboard, Finanzen | Entwurf, Ausstellen, Stornieren, Verrechnung | documents + abhängige Revisionen; Snapshot serverseitig | Zahlung, Steuer, Zeit, Spesen, PDF |
| Zahlungen | payments + invoices; canonical create_payment_idempotent | payments, payments/[id] | Zahlungsübersicht/-detail/-formular, Rechnung, Kundenfinanzen, Dashboard | Verbuchen mit Schlüssel; kein öffentlicher PATCH/DELETE-Ledger-Bypass | payments -> documents/customers/finance/dashboard | Rechnungslock, Saldo, Aktivitäten |
| Produkte / Dienstleistungen | products_services; business-api | products, products/[id] | Produkte, Dokumentpositionen | Create/update | products -> documents Revision | Positionen, Preise, Steuer |
| Projekte / Aufträge | projects, quotes.project_id; legacy orders bleibt erhalten | projects | Projekt-Auswahl, Kundenübersicht, Zeiterfassung | Projekt aus Kunde/Angebot; Replay für Angebotsbezug | projects -> customers/time/documents | Kunde, Angebot, Zeiten |
| Zeit / Timer | time_entries, time_tracking_sessions; time APIs | time-entries/*, time-tracker | Zeitseite, Timer, Dokumentverrechnung, Kundenfinanzen | Start/pause/resume/finish; Freigabe; atomare Zuordnung | Serverzeitstempel; Timer 30-s-Sync und Sichtbarkeit; time/timer Revision | Mitarbeiter, Kunde/Projekt, Rechnung |
| Mitarbeiter | employees, payroll_runs; business-api | employees, employees/[id] | Mitarbeiterliste/-detail, Spesen, Zeit | Create/edit | employees -> time/expenses Revision | Rolle, Personaldateien, Kosten |
| Spesen | expenses, invoice_line_expenses; business-api/reimbursement | expenses/* | Spesenformular/-liste, Kundenfinanzen, Mitarbeiter, Rechnung | Einreichen, Genehmigen, Erstatten, Verrechnen | expenses -> customers/employees/projects/finance/documents | Beleg, Freigabe, Rechnung |
| Dateien / Dokumente | file_objects, immutable file_contents; file-relations, document-pdf | files, files/[id]/download, documents/*/pdf | Dateiübersicht, Spesen, Mitarbeiter, Support, PDF-Einzelseitenvorschau | Gemeinsamer Upload; Bytes+Metadaten atomar | private no-store; keine neue Blob-Pipeline | Entitäts-FK + Tenant; Rollen; PDF-Snapshot |
| Support / Chat | support_cases, support_messages | support/tickets/*; operator/tickets/* | Supportseite, Chat, Operator | Ticket, Nachricht, Status | bestehender Seitenzustand; support Revision verfügbar | Anhänge, Operatorberechtigung |
| Benachrichtigungen | notifications, notification_preferences | notifications/*, settings/notifications | Header, Benachrichtigungen, Einstellungen | Lesen/alle lesen, Präferenzen | bestehender Headerzustand; notifications Revision verfügbar | Geschäftsereignisse, Session |
| Abonnement / Abrechnung | subscriptions/entitlements, checkout/webhook events, platform billing tables | billing/*, settings/subscription; operator/finance/payments | Billing, Planverwaltung, Operator | Stripe checkout/portal/webhook | Persistierte Stripe-Replay-IDs; billing/settings Revision | Modulrechte, Tenantmapping, Audit |
| Firmen-/Dokumenteinstellungen | organizations, document_templates + snapshots | settings/company, settings/documents, settings/profile | Einstellungen, Dokumenteditor, PDF | Firmen-/Vorlagenänderung | settings -> documents; ausgestellte Snapshots unverändert | Branding, QR, historische Dokumente |
| Audit / Aktivitäten | audit_events, customer_activities, platform_audit_events, application_events, job_runs | customers/[id]/activity, operator/audit, monitoring, telemetry/web-vitals | Kundenaktivitäten, Operator | Kritische Geschäftsoperationen auditieren; Rollenänderung nun gleiche Transaktion | GET no-store; Kundenrevision | Actor, Tenant, Objekt; bestehende Telemetrie |
| Plattform / Operator | operator identities, organization_restrictions, platform billing/support | operator/* mit eigener Session/RBAC | Operator-Konsole | Einschränkungen, Support, Betreiberverwaltung | separate Operatorcookies/Session; keine Tenantrechte übertragen | organisationsübergreifender expliziter Kontext |

Es wurden keine Server Actions in den inventarisierten App-/Lib-Dateien gefunden. Bestehende Legacy-Tabellen wie `credit_notes`, `orders`, `business_documents`, `entity_file_links`, `number_sequences` wurden **nicht gelöscht**. Eine vorhandene Tabelle ist kein Nachweis eines aktiven öffentlichen Geschäftsprozesses.

## Verantwortlichkeiten und Aktualisierung

API-Routen erhalten Session, RBAC, Modulrechte, Origin-Prüfung und Validierung. `withTenant` setzt Kontext innerhalb einer Transaktion. Aggregierte Finance-/Dashboard-Reads verwenden optional `REPEATABLE READ READ ONLY`; normale Schreibtransaktionen bleiben unverändert. Repository-Queries filtern weiterhin explizit nach organization_id und werden zusätzlich durch RLS geschützt.

Der bestehende Clienttransport publiziert nach bestätigter erfolgreicher Mutation ausschliesslich Domänennamen. Montierte Query-Consumer revalidieren die betroffenen Domänen. Gleichzeitige identische GETs teilen einen laufenden Request; Revisionen trennen alte von neuen Requests. Cleanup schützt vor veralteten Antworten, eine Sessionrevision verhindert Antworten aus einem vorherigen Mandantenkontext. BroadcastChannel verteilt Metadaten an andere Tabs; Sichtbarkeit/Online revalidieren. Keine dauerhafte Datenkopie und keine neue Datenzugriffsbibliothek.

Finanzschreibvorgänge sind pessimistisch: erst Serverbestätigung, dann Erfolg/Navigation/Invalidierung. Netzwerk- und Timeoutfehler bleiben Fehler. Schreiboperationen werden nicht automatisch wiederholt. Ein erneuter Dokument-Speicherversuch mit gleichem Payload behält seinen Schlüssel; serverseitiger Advisory-Lock, Fingerprint und Ergebnisregister befinden sich mit Nummernvergabe und Geschäftsschreiben in derselben Transaktion. Zahlungs- und Spesen-Replay-Fingerprints bleiben kompatibel mit bestehenden gespeicherten Einträgen.

Cross-Device-Live-Push ist nicht implementiert: andere Geräte sehen Änderungen beim erneuten Abruf/Sichtbarwerden; Timer synchronisieren periodisch. Noch nicht migrierte eigenständige Header-/Einstellungs-/Supporteffekte müssen gesondert abgenommen werden. Kundenfinanzen bestehen weiterhin aus mehreren getrennten HTTP-Reads; sie revalidieren, bilden aber keinen einzigen Snapshot. Diese Grenzen verhindern eine pauschale Vollständigkeitsbehauptung.

## Root-Cause- und Korrekturmatrix

| Domäne | API / Repository, nachgewiesene Ursache am Basiscommit | Zentrale Korrektur | Kontrolliert entfernte Altlast | Regression / Ergebnis |
|---|---|---|---|---|
| Domänenübergreifend | backend + shared.useDemoRows: keine zentrale Mutationsinvalidierung; generisches Storage-Event aktualisierte alle Listen, individuelle useEffects blieben stehen | Domänenabhängigkeiten, Queryhook, Requestrevisionen; Payment mutiert Rechnungen/Kunde/Finanzen/Dashboard | generischer Storage-Reload in shared | data-foundation-test: Erfolg, Fehler, targeted revisions, dedup, alter Sessionrequest – grün; sieben Payment-Consumer gemeinsam browsergeprüft; weitere Mutationsarten offen |
| Rechnungen/Angebote | business-api liess p_number den zentralen Counter umgehen; Editor zeigte Eingabefeld bei Neuanlage; kein create-Replay | zentrale Nummer ausschliesslich serverseitig, Bestandssuffix berücksichtigt, unveränderbar, atomarer Replay | manuelle Neuanlagenummer | migration-test: Replay, Payloadkonflikt, Rollback, unveränderte Counter – grün; postgres:16-CI-Parallelitätsgate ergänzt; Ergebnis offen |
| Geld / PDF | UI/PDF berechneten binary-float Summen, Listen raw line sums statt gespeicherter Invoice subtotal/vat; quote total vor separater Net/Tax-Rundung | BigInt-Dezimal/Minor-Units; bestehende DB-Spaltenpräzision, netto und Steuer separat; persistierte Werte in Reads | redundante Editor-/Previewtotalberechnung | PGlite numeric-Parität; 2561.97 - 1000 = 1561.97; Vollzahlung null; Angebotsparität – grün |
| Finanzen | separate overview/documents/finance Requests; UI-KPIs aus begrenzter Dokumentliste; Finance query summierte CHF/EUR ohne Trennung | Workspace in einem Readsnapshot; vollständige Summary-KPIs; CHF-Cashreport, Fremdwährung gesonderte Summary | dreifacher FinancePage-Read; duplizierte Demo-Financequery | Finance Cash/Summary-/Periodenparität – grün; andere Währungen nicht umgerechnet |
| Perioden | Analysejahr (rollierende 12 Monate) wich von kalenderjährlicher Übersicht ab; verschiedene Date-Grenzen | gemeinsames financeWindow/financeMetrics, date-only Kalendergrenzen, Zurich businessDate | parallele Analyseperiodenberechnung | ux-regression + data-foundation period tests – grün |
| Timer | Anzeige inkrementierte Intervallzähler, Synchronisationsantworten konnten neueren Zustand überholen | elapsed-Basiszeitstempel + obsolete response guard; Serverzustand weiter massgebend | reiner +1 Anzeigezähler | DB Timer start/reload/pause/finish – grün; nativer PWA-/Geräte-Neustart offen |
| Session / Fehler | Response JSON-Parsefehler ergab leeres Erfolgsobjekt; Netzwerkfehler untypisiert; GETs nicht nach Sessionwechsel abgegrenzt | ClientApiError, sichere technische Fehler, explizite Timeouts, Sessionfence, Logoutrevision | JSON-Erfolg bei Parsefehler | malformed/409/network/old-tenant/cross-tab reset – grün |
| Dateien | Upload vertraute MIME-Angabe; file_objects hatte direkte Zuordnungen nur für Spese/Support/Mitarbeiter | Signaturvalidierung, zentrales Relationmapping, additive Kunden-/Invoice-/Quote-/Project-FKs | parallele purpose-Bedingungen konsolidiert | echte Upload-/List-/Downloadhandler, Signatur und fremder Tenant/Rolle – grün; neue Zuordnungs-UI offen |
| Einladungen | settings/team/invitations + invitations.ts: Einladung zuerst committed, danach separate Identitäts-/Membership-/Tokentransaktionen und Mail; Fehler widerrief nur Einladung, nicht gesamte Zuordnung | eine Transaktion mit vorhandener Outbox und Replay; Versandclaim; kein fiktiver Erfolg bei delivered:false; unklarer Versand gesperrt | Mehrfachtransaktionen und direkte Wiederholung des Mailversands | migration-test: echte Route, Replay, Rollen, Nichtversand-Recovery, ambiguous kein resend, finaler DB-Fehler rollt sämtliche Daten zurück – grün |
| Client Hintergrundabruf | use-api-query.ts erster Kandidat: Revisionswechsel entfernte bestätigte Daten; Sichtbarkeitswechsel erhöhte fälschlich die Sessionrevision und kollidierte mit gerenderten Listen im Required-Browsergate | bestätigte Daten während Hintergrundabruf erhalten, echte Sessionwechsel werfen sie sofort weg; Auth-Refresh hat eine eigene Revision und vergleicht Tenant/Rolle | kurzfristige leere Listen | sieben-Tab-Test mit angehaltenem Hintergrundread und Unit-Test für echten Tenant-/Rollenwechsel grün; Required-CI erneut ausführen |
| Rollen / Audit | settings/team/members PATCH schrieb Rolle ohne eigenen Audit in derselben Transaktion | Audit mit alter/neuer Rolle und Actor im gleichen withTenant | keine | Routen-/Integrationstest und Berechtigungschecks – grün |
| Legacy Repository | records.ts und alter idempotency.ts hatten keine Runtime-Importer im AST/rg-Nachweis; Tests prüften ungenutzten Writer | aktive business-api / business-idempotency als Quelle | genau diese zwei ungenutzten TS-Module; keine Tabellen | Test prüft nun öffentliche Payment-Routen + aktive Status-/Billingoperationen – grün |

Organisation, Produkte, Projekte, Mitarbeiter, Support, Benachrichtigungen, Billing und Operator wurden inventarisiert und in vorhandenen gezielten Tests berücksichtigt; für sie wird hier kein zusätzlicher bestätigter Root Cause behauptet. Einladungserstellung wurde zusätzlich korrigiert: Identität, Membership, Einladung, Token, Audit und vorhandene Outbox entstehen in einer Transaktion. Ein gleicher Schlüssel wiederholt das Ergebnis; bestätigter Versand wird nicht erneut ausgelöst. Sicher nicht versendete Aufträge können mit demselben Schlüssel wiederholt werden. Unklarer Versand bzw. ein Prozessabbruch im Zustand sending wird konservativ gesperrt und benötigt eine Zustellprüfung; es wird keine genau-einmal-Zustellung bei Microsoft Graph behauptet.

## Migration und Schutz des Bestands

Neue Migration: `0046_file_business_relations.sql`. Nur nullable customer_id/invoice_id/quote_id/project_id, Tenant-composite Foreign Keys und Indizes. Keine Neuberechnung historischer Finanzwerte, kein Löschen, Reset oder Umnummerieren. Nur gegen isolierte PGlite-Testdaten ausgeführt. Produktionsprüfung (Locks/Laufzeit, reales Schema, Backup/Restore, Rollbackplan und mögliche V21.2-Migrationsnummernkollision) bleibt vor Freigabe erforderlich. Dateibytes und Metadaten werden innerhalb einer Transaktion gespeichert; kein neuer externer Uploadprozess.

Die Bottom-Navigation ist durch navigation-contract-test und navigation-foundation-test gegen main-Basis geschützt; Markup, Verhalten, Icons, CSS und transitive Tokens sind unverändert. PDF-Einzelseitenvorschau bleibt unverändert; Snapshot-Regressionsfälle prüfen historische Dokumente bei späterer Vorlagenänderung.

## Verbindliche 25 Fälle – nachgewiesener Umfang

| Nr. | Fall | Nachweis / verbleibende Grenze |
|---|---|---|
| 1 | Rechnung erstellen / alle Ansichten | DB + Queryinvalidierung geprüft; echtes PaymentForm plus sieben montierte Tabs mit synthetischem Ledger geprüft |
| 2 | Angebot -> Rechnung | echte Repository-/Statushandler, Kopie und Links geprüft |
| 3 | Teilzahlung | 2561.97 / 1000 / 1561.97 und Status partial geprüft |
| 4 | Vollzahlung | Ledgercompletion, Datum, Saldo null geprüft |
| 5 | Storno | Status, Schutz und Freigabe zugeordneter Leistungen geprüft |
| 6 | Parallele Nummern | Counter-/Replay-/Rollback geprüft; echte Mehrverbindungsprüfung als verpflichtender postgres:16-CI-Schritt ergänzt; Ergebnis offen |
| 7 | Wiederholte Zahlung | gleicher Schlüssel liefert selben Datensatz; Konflikt/Überzahlung geprüft |
| 8 | Zeit freigeben / verrechnen | echte Handler und Zuordnungen geprüft |
| 9 | Erneute Verrechnung | abgelehnt; Invoice/Counter/Zuordnung rollback geprüft |
| 10 | Timer Navigation | serverseitige Wiederaufnahme + gezielter Browserlauf; vollständige Abnahme offen |
| 11 | Timer PWA-Neustart | DB-Wiederherstellung geprüft; echter PWA-Neustart offen |
| 12 | Kunde / abhängige Ansichten | Contacts + Revisionen geprüft; browserübergreifender Gesamtprozess offen |
| 13 | Spese genehmigen / verarbeiten | Freigabe/Erstattung/Verrechnung/Locks geprüft |
| 14 | Upload / Download | echte Handler mit synthetischen Bytes geprüft |
| 15 | Verbotener Download | Rollen- und Fremdmandantablehnung geprüft |
| 16 | Fremde API-ID | Contacts/files/process IDs plus 50 non-superuser RLS-Testmandanten geprüft; keine Vollprüfung jeder ID-Route behauptet |
| 17 | Einladung / Rolle | neu/existierend/widerrufen, Activationrolle, atomare Erstellung/Outbox, Retry nach sicherem Nichtversand und Sperre bei unklarem Versand geprüft |
| 18 | Sessionablauf | Clientcache/401-/Sessionfence geprüft; echte Cookieexpiry-Browserprüfung offen |
| 19 | Netzwerkfehler Mutation | kein Erfolg/Invalidierung; UI-Handler erlauben Fehlerretry |
| 20 | Timeoutretry | dokument-/payment-Replay geprüft; HTTP Commit-plus-verlorene-Antwort-Ablauf offen |
| 21 | Demo / Produktion | demo guards + getrennte Tenantfixtures; gemeinsame Finanzregeln geprüft |
| 22 | Logoutcache | cross-tab Reset, alte Antworten verworfen; private SW-Caching bestehende Tests |
| 23 | Vorlagenhistorie | ausgestellte Dokument-/QR-/Payment-Snapshots geprüft |
| 24 | Finanzkennzahlen | Cashreport, Currency-Summary, Monats-/Periodenparität geprüft |
| 25 | Statusvorbedingungen | reale Statushandler, issued lock, Freigabe-, Storno-/Zahlungsbedingungen geprüft |

## Release-Gates und Restrisiken

Lokale Prüfungen: `npm run test`, `npm run lint`, `npm run css:check`, `npm run release:check`, `npm run typecheck`, `npm run build`, Produktions- und vollständiger Dependencyaudit. npm führt hier dieselben package scripts aus; pnpm verweigert normale Scriptstarts wegen des externen node_modules-Symlinks. Keine Gates wurden abgeschwächt. Testergebnisse und Browserchecks werden in `v21-3-validation.md` protokolliert.

Nicht freigabefähig ohne: V21.2-Integration; echte Mehrverbindungs-DB-Paralleltests; restliche Consumer-Revalidierung; operative Prüfung unklarer Mailzustände; Timer-PWA-/Logout-End-to-End; aktuelle Required GitHub Quality-Checks; Azure-Smoke/Migrationsfreigabe. Kein Merge und kein Deployment vorgenommen. Native Kamera/Fotomediathek und mehrere echte Geräte sind zusätzlich manuell zu prüfen. Es wurde keine zweite Telemetrie-Infrastruktur eingeführt. Gutschriften/Payment-Reversal bleiben vorhandene Schema-/Prozessgrenzen und benötigen gesonderte fachliche Klärung, bevor neue Finanzoperationen ergänzt werden.
