# Security Baseline v0.9.0

- CSP, HSTS, nosniff, DENY framing, strict referrer policy
- `Cache-Control: no-store` für APIs
- Same-Origin-Prüfung auf mutierenden Browser-APIs
- Request-Grössenlimits
- Login-/Registrierungs-Rate-Limit
- HttpOnly Session Cookie
- Scrypt Passwort-Hashing
- PII-Redaction im Logger
- Stripe Webhook Signature Check + 5-Minuten-Toleranz
- Webhook Idempotenz
- PostgreSQL RLS für tenant-scoped Tabellen
- Audit-Log
- Keine Kartendaten im System
- keine Secrets im Quellcode

Hinweis: Der In-Memory Rate Limiter ist nur die Baseline für eine App-Service-Instanz. Bei Scale-out muss er durch Azure Cache for Redis oder einen vergleichbaren verteilten Store ersetzt werden.
