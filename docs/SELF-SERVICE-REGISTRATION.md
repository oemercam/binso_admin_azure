# Binso One – Self-Service Registrierung

## Produktiver Zielzustand

Binso One verwendet für öffentliche Kundenkonten Microsoft Entra External ID. Die Anwendung speichert keine Kundenpasswörter.

### Registrierung mit E-Mail und Passwort

1. Besucher startet Demo, kostenlosen Test oder ein direktes Abo.
2. Binso One leitet über `/api/auth/login?audience=customer` zum App-Service-Provider `external_id` weiter.
3. Entra External ID bietet `E-Mail + Passwort` an.
4. Bei der Neuregistrierung wird die E-Mail-Adresse mit einem One-Time-Code verifiziert.
5. Der Benutzer legt sein Passwort fest und wird zurück zu `/register` geleitet.
6. Binso One übernimmt die verifizierte E-Mail aus dem Azure Client Principal. Die E-Mail kann im Formular nicht überschrieben werden.
7. Nach dem Onboarding wird abhängig vom Modus erstellt:
   - `demo`: isolierter Demo-Tenant, Business-Funktionsumfang, fiktive Daten, 24 Stunden, keine Abrechnung und keine externen Aktionen.
   - `trial`: normaler Tenant mit 30 Tagen Testzugang und ohne Zahlungsdaten beim Start.
   - `subscription`: normaler Tenant ohne Geschäftsdatenzugriff bis zur erfolgreichen Stripe-Aktivierung. Der Owner wird direkt zu `/subscription-required` und von dort zum Stripe Checkout geführt.
8. Nach erfolgreichem Stripe Webhook wird das Abo aktiviert und der normale Tenant-Zugriff freigegeben.

## Erforderliche Azure-Konfiguration

Im External Tenant:

- Sign-up/sign-in User Flow erstellen.
- Identity Provider `Email with password` aktivieren.
- Self-service password reset aktiviert lassen.
- Binso-One-App dem User Flow zuordnen.
- E-Mail-Verifikation bei Sign-up nicht umgehen.
- Für den ersten produktiven Release keine zusätzlichen Social Provider anzeigen, solange diese nicht vollständig getestet sind.

Im Azure App Service Authentication:

- Custom OpenID Connect Provider mit dem Friendly Name `external_id` konfigurieren.
- Callback URI: `https://<public-host>/.auth/login/external_id/callback`.
- Issuer/Discovery Endpoint, Client ID und Client Secret aus dem External Tenant verwenden.
- Unauthenticated requests dürfen die öffentlichen Marketingseiten erreichen; geschützte Binso-One-Routen bleiben durch Anwendung und Easy Auth abgesichert.

App Settings:

```text
AUTH_MODE=azure
AUTH_PROVIDER_NAME=external_id
AUTH_ADMIN_PROVIDER_NAME=aad
NEXT_PUBLIC_AUTH_METHODS=email
```

Der interne Admin-Zugang `/admin-access` bleibt davon getrennt und verwendet Microsoft Entra ID (`aad`) für berechtigte `@binso.ch`-Konten.

## Abnahmetest vor Go-Live

Mit einer E-Mail-Adresse testen, die noch nie im External Tenant verwendet wurde:

1. `/register?mode=demo` öffnen, E-Mail registrieren, Code empfangen, Code bestätigen, Passwort setzen, Demo fertigstellen und prüfen, dass fiktive Daten sichtbar sind.
2. Neue E-Mail verwenden, `/register?mode=trial&plan=business`, Registrierung durchführen und prüfen, dass 30 Tage Trial angelegt werden.
3. Neue E-Mail verwenden, `/register?mode=subscription&plan=business`, Onboarding abschliessen und prüfen, dass vor Stripe-Zahlung kein Geschäftsdatenzugriff besteht.
4. AGB und AVV bestätigen, Stripe Checkout erfolgreich abschliessen, Webhook abwarten und prüfen, dass `/post-login` danach `/dashboard` öffnet.
5. Passwort vergessen im External-ID-Dialog testen; Reset-Code muss an die registrierte E-Mail gehen.
6. `/admin-access` separat mit einem berechtigten Binso-Microsoft-Konto testen.
