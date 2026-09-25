# Security

## Tenant-Isolation
Jeder Business-Datensatz besitzt `organization_id`. Tenant-Kontext wird serverseitig aus Authentifizierung und Membership aufgelöst. RLS und Composite Foreign Keys bilden eine zweite Sicherheitslinie.

## Auth / Berechtigungen
Backend-Aktionen prüfen Session und Permission serverseitig. Rollen aus dem Frontend werden nicht vertraut. Plattformrollen geben nicht automatisch Zugriff auf Kundendaten. Supportzugriff ist explizit, zeitlich begrenzt und auditiert.

## Secrets
Nur Variablennamen und sichere Platzhalter in `.env.example`. Keine Tokens, Passwörter, privaten Schlüssel oder Connection Strings committen. Bereits offengelegte echte Credentials müssen rotiert werden; das Entfernen aus dem aktuellen Code allein reicht nicht.

## Rate Limits
Registrierung und Einladungen besitzen einen einfachen In-Process-Schutz. Dieser ist absichtlich klein und pragmatisch, aber nicht global über mehrere Azure-Instanzen synchronisiert. Bei horizontaler Skalierung muss er durch einen zentralen Store ersetzt werden.

## GitHub manuell
Main-Branch schützen, Pull Request + erforderliche CI-Checks aktivieren sowie Secret Scanning / Push Protection und Dependabot aktivieren, soweit im Plan verfügbar. Repository-Dokumentation allein aktiviert diese Einstellungen nicht.
