# V63 – Stripe Payment Provider

V63 connects the existing subscription foundation to Stripe without making Stripe mandatory for local development.

## Flow

1. Only an organization owner can start Checkout or open the Billing Portal.
2. Checkout is created server-side and includes the organization id as Stripe metadata.
3. Stripe webhooks are accepted only with a valid `Stripe-Signature` HMAC and a five-minute timestamp tolerance.
4. Webhook event ids and a minimal non-payment payload summary are stored before processing, so repeated delivery is idempotent without retaining the full Stripe event body.
5. `customer.subscription.*` events are authoritative for subscription status, plan, cancellation state and period end.
6. Entitlements and the platform tenant overview are synchronized from the Stripe subscription event.
7. Existing manual/trial billing continues to work until Stripe environment variables are configured.

## Required environment variables

- `APP_BASE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_STARTER`
- `STRIPE_PRICE_BUSINESS`
- `STRIPE_PRICE_PROFESSIONAL`
- `STRIPE_PRICE_ENTERPRISE` only if Enterprise is later made self-service.

Never expose the Stripe secret or webhook secret through `NEXT_PUBLIC_*` variables.
