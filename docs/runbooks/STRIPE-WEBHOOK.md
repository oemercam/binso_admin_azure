# Stripe Webhook Runbook
Verify signature on raw body, replay/idempotency, tenant mapping and audit. Reconcile Stripe and internal subscription state. Stripe outage may degrade billing but should not unnecessarily take down core business functions.
