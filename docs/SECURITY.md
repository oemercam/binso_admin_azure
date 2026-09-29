# Security

Mandantentrennung erfolgt serverseitig über Session, zentrale Permissions, `withTenant` und PostgreSQL RLS. Sicherheitsrelevante Mutationen dürfen sich nicht auf ausgeblendete UI-Elemente verlassen. Rate Limits, Same-Origin-Prüfung, HttpOnly-Sessions, CSP/Security Headers, PII-Redaction und versionierte Migrationen bleiben Teil der Basis. Migration `009_platform_foundation.sql` ergänzt Idempotency-Persistenz und mandantenbezogene Notification Preferences.
