# V64 – Customer Authentication

## Ziel

Kunden dürfen nicht von einem Microsoft-Konto abhängig sein. Die Binso-Plattform verwendet deshalb einen externen Customer-Identity-Provider statt eigener Passwortspeicherung.

## Zielbild

Empfohlene produktive Identity-Plattform: Microsoft Entra External ID mit browser-delegierter Anmeldung und Azure App Service Authentication als vorgeschaltetem Auth-Gateway.

Unterstützte Standardmethoden:

- E-Mail + Passwort mit E-Mail-Verifikation
- E-Mail + Passwort ist der produktive Standard.
- Microsoft, Google oder Apple können später optional als zusätzliche Provider aktiviert werden.
- Passwort vergessen / Passwort zurücksetzen über den Identity Provider

Optional kann später E-Mail-One-Time-Passcode oder Passkey aktiviert werden. Das wird nicht im Anwendungscode als eigenes Passwortsystem implementiert.

## Warum kein eigenes Passwortsystem?

Die Anwendung speichert keine Passwörter, Passwort-Hashes, OAuth-Secrets von Kunden oder Reset-Tokens in PostgreSQL. Authentication bleibt beim Identity Provider. Die Anwendung verarbeitet nur die von Azure App Service Authentication validierte Identität und ordnet diese einer Binso-Mitgliedschaft zu.

## Azure-Konfiguration

1. Microsoft Entra External ID External Tenant erstellen.
2. Sign-up/Sign-in User Flow erstellen.
3. Lokale Anmeldung `E-Mail + Passwort` aktivieren.
4. Für den ersten produktiven Release nur `E-Mail + Passwort` aktivieren; weitere Provider erst nach separatem Test ergänzen.
5. Binso-Web-App registrieren und Redirect URI gemäss External-ID-/App-Service-Konfiguration setzen.
6. In Azure App Service → Authentifizierung einen benutzerdefinierten OpenID-Connect-Provider für External ID konfigurieren, z. B. mit Providername `external_id`.
7. App Setting setzen:

   `AUTH_PROVIDER_NAME=external_id`

8. Sichtbare Methoden passend konfigurieren:

   `NEXT_PUBLIC_AUTH_METHODS=email`

Für Production ist `AUTH_PROVIDER_NAME=external_id` verpflichtend. `AUTH_ADMIN_PROVIDER_NAME=aad` bleibt ausschliesslich für den internen Binso-Admin-Zugang.

## Applikationsfluss

`/pricing` → Demo, kostenloser Test oder direktes Abo → `/register` → `/api/auth/login` → External ID (E-Mail-Verifikation + Passwort) → `/register` → `/onboarding` → bei direktem Abo Stripe Checkout → `/dashboard`

Für bestehende Benutzer:

`/sign-in` → `/api/auth/login` → External ID → `/post-login` → Organisation/Onboarding/Dashboard

## Sicherheitsregeln

- `returnTo` akzeptiert nur lokale Pfade; keine Open Redirects.
- Providername wird serverseitig validiert.
- Passwörter werden nie an Next.js oder PostgreSQL übergeben.
- E-Mail-Verifikation und Passwort-Reset erfolgen durch External ID.
- PostgreSQL-Mandantenzugriff bleibt über Membership und RLS abgesichert.
- Unterschiedliche Loginmethoden dürfen nicht clientseitig als Identitätsbeweis interpretiert werden; massgebend ist nur der validierte Azure-Principal.
