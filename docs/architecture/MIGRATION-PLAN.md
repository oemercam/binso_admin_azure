# Migration Local → Production

1. Azure Ressourcen bereitstellen.
2. `DATABASE_URL` und Stripe-Variablen als App Settings/Key Vault setzen.
3. `pnpm db:migrate`.
4. `APP_MODE=production` und `NEXT_PUBLIC_APP_MODE=production`.
5. Auth/Registrierung/Onboarding/Stripe testen.
6. Kundenmodul auf `/api/customers` umstellen.
7. Danach Module einzeln migrieren:
   Offerten → Aufträge → Projekte → Zeit/Spesen → Rechnungen/Zahlungen → Einkauf → Personal/Lohn → MWST/Buchhaltung.
8. Für jedes Modul:
   - organization_id
   - Fremdschlüssel
   - RLS
   - Repository
   - API Validation
   - Audit
   - Idempotenz bei finanziellen Mutationen
9. Blob Storage für Dokumente integrieren.
10. Redis für verteiltes Rate Limiting/Caching ergänzen.
