# V61 – Subscription & Billing Foundation

V61 moves SaaS subscription administration from the browser demo store to PostgreSQL.

## Implemented

- PostgreSQL-backed platform tenant and signup overview.
- Platform Owner/Admin can change plan and platform/subscription status; Platform Support remains read-only.
- Subscription lifecycle fields for provider, provider subscription id, interval, amount, cancellation, scheduled plan and billing dates.
- Immutable subscription event history for operator/customer/system/webhook changes.
- Idempotent webhook inbox table prepared for Stripe integration.
- Customer owner API for plan-change requests, cancellation at period end and reactivation.
- Trial plan changes are applied immediately; paid-plan changes are scheduled until a payment provider is connected.
- Entitlements, seat baseline and platform MRR are synchronized when the operator applies a plan/status change.

## Not yet connected

No payment provider is active in V61. Stripe checkout, signature-verified webhooks, payment methods, provider invoices and automatic dunning remain a later integration step. `billing_provider=manual` is therefore the safe default.
