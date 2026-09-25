# Customer authentication V65

## Ziel
Binso verwendet eine eigene, ruhige Einstiegsseite und delegiert Identität, E-Mail-Verifikation und Anmeldesicherheit an Azure App Service Authentication / Microsoft Entra External ID.

## Flow
- `/sign-in` zeigt getrennt **Anmelden** und **Registrieren**.
- Beide Aktionen laufen ausschliesslich über `/api/auth/login`; der Server validiert das interne Rücksprungziel und startet danach Easy Auth.
- Anmeldung kehrt nach `/post-login` zurück.
- Registrierung kehrt nach `/register` zurück. Dort werden erst nach erfolgreicher Authentifizierung die Organisationsdaten erfasst.
- `/post-login` entscheidet serverseitig: bestehende Mitgliedschaft → Dashboard; offenes Onboarding → Onboarding; neuer Benutzer → Preise/Registrierung.
- Bereits angemeldete Benutzer werden von `/sign-in` direkt in den Post-Login-Flow geführt.
- Logout läuft über `/api/auth/logout`; auch dort werden nur interne Rücksprungziele akzeptiert.
- Passwörter, OTPs und Provider-Secrets werden nicht von Binso gespeichert.

## Azure
`AUTH_PROVIDER_NAME` muss exakt dem in App Service Authentication verwendeten Provider-Namen entsprechen. In der aktuell getesteten Azure-Konfiguration ist dies `aad`. Die Anwendung erzeugt keine tenant-spezifischen Login-URLs selbst.
