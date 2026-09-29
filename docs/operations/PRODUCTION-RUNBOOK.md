# Binso One – Production Runbook

## 1. Release Gate
Vor jedem Production Deployment müssen mindestens erfolgreich sein:

```bash
pnpm release:check
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

Zusätzlich vor Schemaänderungen:

```bash
pnpm db:check
pnpm db:migrate
pnpm tenant:test
```

## 2. Umgebungen
Mindestens `development`, `staging` und `production` getrennt halten. Datenbanken, Storage und Secrets dürfen nicht zwischen Staging und Production geteilt werden.

## 3. Runtime Secrets
Erforderlich bzw. je nach aktivierter Funktion:

- `DATABASE_URL`
- `APP_ENCRYPTION_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- Stripe Price IDs
- `RESEND_API_KEY`
- `EMAIL_FROM`
- Azure Storage Account / Managed Identity

Secrets gehören nicht ins Repository. Für Azure sollen App Service Settings/Key Vault References verwendet werden.

## 4. Datenbank
Migrationen werden mit einer administrativen DB-Verbindung ausgeführt. Die Web-App soll danach eine dedizierte Runtime-Rolle ohne Superuser/BYPASSRLS verwenden. `FORCE ROW LEVEL SECURITY` schützt tenantbezogene Tabellen zusätzlich.

Die Migrationen sind ledger-basiert und werden über `scripts/migrate.mjs` mit Checksumme geführt.

## 5. Backup / Restore
- PostgreSQL Automated Backup aktivieren.
- Aufbewahrung und PITR gemäss Geschäftsanforderungen festlegen.
- Blob Storage Versionierung/Soft Delete im Azure-Betrieb aktivieren.
- Restore mindestens quartalsweise in einer isolierten Umgebung testen.
- Ein Backup gilt erst nach erfolgreichem Restore-Test als verifiziert.

## 6. Monitoring
Mindestens überwachen:

- `/api/health`
- HTTP 5xx Rate
- API-Latenz
- Login-/MFA-Fehler
- PostgreSQL Connections und Errors
- Stripe Webhook Errors/Retry
- E-Mail-Zustellung
- Blob Storage Errors
- Supportticket- und Incident-Aufkommen

Application Insights/Log Analytics ist in der Azure-Basis vorgesehen.

## 7. Incident Ablauf
1. Incident bestätigen und Schweregrad festlegen.
2. Betroffene Komponenten/Mandanten identifizieren – ohne unnötige Einsicht in Geschäftsdaten.
3. Öffentliche Statusinformation aktualisieren, falls relevant.
4. Eindämmung / Rollback / Feature Flag anwenden.
5. Ursache beheben und verifizieren.
6. Audit/Timeline abschliessen.
7. Bei relevanten Sicherheits-/Datenschutzereignissen rechtliche Meldepflichten prüfen.

## 8. Supportzugriff
Betreiber erhalten keinen generellen Zugriff auf fachliche Kundendaten. Ein erweiterter Supportzugriff muss vom Kunden explizit freigegeben, begründet, zeitlich begrenzt und auditierbar sein.

## 9. Benutzer / Security
- Plattform-Inhaber und Plattform-Admins: MFA verpflichtend als Betriebsregel.
- Kunden-Inhaber/Admins: MFA dringend empfehlen.
- Keine geteilten Benutzerkonten.
- Regelmässige Prüfung aktiver Operatoren und privilegierter Rollen.
- Sessionwiderruf bei Passwort- oder Rollenwechsel verwenden.

## 10. Files
Support- und Dokumentanhänge gehören in Azure Blob Storage. Zulässige Typen und Dateigrössen werden serverseitig begrenzt. Entfernte, noch nicht verknüpfte Supportanhänge werden auch aus Blob Storage gelöscht.

Vor breitem kommerziellem Uploadbetrieb sollte zusätzlich ein Malware-Scan-Workflow (z. B. Microsoft Defender for Storage/Event Grid) aktiviert werden.

## 11. Rollback
- App-Code über vorheriges GitHub Release/Deployment Artifact zurückrollen.
- Datenbankmigrationen grundsätzlich vorwärtskompatibel gestalten.
- Destruktive Schemaänderungen erst nach zweistufigem Rollout durchführen.
- Feature Flags für riskante neue Funktionen verwenden.
