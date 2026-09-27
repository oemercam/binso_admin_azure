# Secret Rotation Runbook
Prepare replacement -> configure -> validate -> switch consumers -> revoke old -> monitor -> record evidence. Applies to DB, Stripe, Entra/Graph, API/signing/internal-job secrets. Never store secret values in docs/tickets/chat.
