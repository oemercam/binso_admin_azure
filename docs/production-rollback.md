# Binso One – Produktions-Rollback

Stand: 5. Oktober 2026

## Ziel
Ein fehlerhaftes Release wird auf den letzten nachweislich grünen Commit zurückgesetzt, ohne Datenbankänderungen blind rückgängig zu machen.

## Ablauf
1. Incident eröffnen und betroffenen Commit sowie Zeitpunkt notieren.
2. Letzten grünen Produktions-Commit aus GitHub Actions bestimmen.
3. Prüfen, ob seit diesem Commit Datenbankmigrationen ausgeführt wurden.
4. Anwendungscode auf den letzten grünen Commit zurückführen und den normalen Quality- und Azure-Deploy-Pfad verwenden.
5. Keine bereits ausgeführte Datenbankmigration automatisch rückwärts anwenden. Schemaänderungen werden nur mit einer explizit geprüften Forward-Fix-Migration korrigiert.
6. Nach Deploy zwingend prüfen:
   - /api/health
   - /api/health/ready
   - Demo-Session und Persistence Smoke Test
   - Kundenlogin
   - Microsoft Graph Mail
   - Stripe Checkout/Webhook nur soweit der Incident Billing betrifft
7. Incident dokumentieren und Ursache mit Follow-up-Massnahmen abschliessen.

## Datenbank
Azure Database for PostgreSQL Point-in-Time-Restore ist die letzte Recovery-Stufe bei Datenkorruption oder einem nicht per Forward-Fix behebbaren Schema-/Datenfehler. Ein Restore wird nicht als normale Code-Rollback-Methode verwendet.

## Freigabe
Rollback gilt erst als abgeschlossen, wenn der Produktions-Healthcheck den erwarteten Commit zeigt und die Kern-Smoke-Tests wieder grün sind.
