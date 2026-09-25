# Binso One – Production SaaS Hardening V67

Stand: 23.09.2026

Binso GmbH ist Hersteller und Betreiber von Binso One. Dieses Release ersetzt die bisherige reine Browser-Persistenz im produktiven Betrieb durch einen tenant-gebundenen serverseitigen Persistenz-Layer und vervollständigt die SaaS-Grundlagen für Accounts, Organisationen, Abonnemente, Betreiberfunktionen und Betriebsüberwachung.

## Produktive Architektur

- Next.js 16 / React 19, Node.js 24, Azure App Service.
- PostgreSQL ist in produktiven Umgebungen obligatorisch. Ohne `DATABASE_URL` wird kein produktiver Tenant-Zugriff freigegeben.
- Authentifizierung bleibt bei Azure App Service Authentication / Microsoft Entra ID bzw. External ID. Binso One speichert keine Passwörter.
- Organisationszugriff wird serverseitig aus aktiven Memberships aufgelöst. Eine vom Browser gelieferte `organizationId` ist nur ein Selektor und nie ein Berechtigungsnachweis.
- RLS bindet Tenant-Abfragen innerhalb einer Transaktion an `app.organization_id` und `app.user_id`.
- Fachliche Geschäftsdaten werden in Produktion als versionierter Tenant-Zustand in PostgreSQL gespeichert. Optimistische Versionierung verhindert stilles Überschreiben bei parallelen Änderungen.
- Die vorhandene Fachlogik und die bestehenden Geschäftsprozesse bleiben erhalten; Demo-Seeds und `localStorage` werden nur noch ohne konfigurierte Produktionsdatenbank verwendet.

## Accounts, Organisationen und Rollen

- Persönliches Konto mit Name, Telefon, Sprache, Zeitzone, Kontostatus und Login-Metadaten.
- Organisationen mit Owner/Admin/Finance/Employee-Membership.
- Einladungen werden über die verifizierte Login-E-Mail an die externe Identity gebunden.
- Seat-Limits werden aus dem aktiven Plan erzwungen.
- Der letzte aktive Owner kann weder gesperrt noch herabgestuft werden.
- Gesperrte Benutzer und gesperrte/gekündigte/abgelaufene Tenants verlieren serverseitig den Zugriff.

## Trial, Pläne, Module und Stripe

- Trial-Erstellung erfolgt ausschliesslich serverseitig aus einer persistierten Registrierung.
- Starter, Business, Professional und Enterprise bleiben zentral in `lib/data/plans.ts` definiert.
- Navigation, Schnellaktionen und direkte Modulrouten werden über Entitlements gefiltert bzw. gesperrt.
- Stripe Checkout, Billing Portal und signierter Webhook sind integriert. Price-IDs und Secrets werden ausschliesslich serverseitig konfiguriert.
- Plan-, Status- und Billing-Änderungen werden auditierbar gespeichert.

## Betreiberbereich Binso GmbH

- Plattformrollen sind von Kundenrollen getrennt: `platform_owner`, `platform_admin`, `platform_support`.
- Betreiberansicht zeigt Kunden/Tenants, Registrierungen und Abonnementstatus.
- Betriebsübersicht zeigt Datenbankstatus/-latenz, fehlgeschlagene Billing-Webhooks, Anwendungsfehler der letzten 24 Stunden, offene Registrierungen und aktive Tenants.
- Client-Routefehler und serverseitige Persistenzfehler werden ohne fachliche Nutzdaten in `application_events` protokolliert.

## Security und Robustheit

- Same-Origin-Prüfung für mutierende Browser-APIs; Stripe Webhook bleibt signaturbasiert.
- Request-Grössenlimit für die zentrale Geschäftsdaten-Persistenz und strukturierte Fehlerantworten mit Correlation-ID.
- Push-Subscriptions werden nicht im Klartext gespeichert, sondern mit AES-256-GCM verschlüsselt. `PUSH_SUBSCRIPTION_ENCRYPTION_KEY` ist in Produktion Pflicht, sobald Push aktiviert wird.
- Sicherheitsheader, CSP, HSTS, Frame-Schutz, Referrer-Policy und Permissions-Policy bleiben zentral in Next.js konfiguriert.
- PWA/API-Responses werden nicht im Service-Worker-Cache persistiert.

## Betrieb und Deployment

Vor dem Go-live müssen die externen Dienste und Secrets in Azure gesetzt werden: PostgreSQL, Entra/External ID, Stripe, optional VAPID/Push und für echten E-Mail-/Automationsversand die vorgesehene Microsoft-365/Graph-Infrastruktur. Datenbankmigrationen müssen vor dem ersten produktiven Start ausgeführt werden.

CI verwendet Node 24, pnpm und `--frozen-lockfile` und führt Typecheck, Lint, Architektur-/Prozess-/SaaS-Prüfungen und den Produktionsbuild aus.

## Bewusste Architekturentscheidung

Die bestehende Business-Store-Fachlogik wurde nicht unnötig in hunderte neue CRUD-Endpunkte zerlegt. Im produktiven Betrieb persistiert sie einen strikt tenant-gebundenen, versionierten Zustand in PostgreSQL. Das minimiert Regressionen im bestehenden Angebots-, Auftrags-, Zeit-, Rechnungs-, Zahlungs-, Vertrags- und Mitarbeiterprozess. Bei paralleler Bearbeitung desselben Tenants wird ein Versionskonflikt sichtbar gemeldet statt eine Änderung still zu überschreiben.
