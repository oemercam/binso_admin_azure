# QA v1.0.0 – Permissions

Implementiert und statisch geprüft:
- zentrale Tenant- und Operator-RBAC-Matrix
- getrennte Session-Cookies und Tabellen
- tenant-scoped API-Checks
- module-spezifische `/api/records` Autorisierung
- Own-Record-Scope für Member
- Kunden-Benutzerverwaltung
- Operator-Benutzerverwaltung
- Betreiberbereich ohne Fachdatenschnittstelle
- Schutz letzter Inhaber / letzter Plattform-Inhaber
- UI-Aktionen werden entsprechend der Rolle reduziert

Lokal beim Benutzer weiterhin ausführen: `pnpm lint`, `pnpm typecheck`, `pnpm build`.
