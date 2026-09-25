# V52 — Platform Admin, Registration and Commercial Model

## Operator role

Binso GmbH operates the SaaS platform. Platform access is separate from a customer's organization role.

Platform roles:
- platform_owner
- platform_admin
- platform_support

A customer can be `owner` of their own organization without becoming a platform operator.

## Platform Admin

The `/platform` area contains:
- tenant overview
- active/trial customer counts
- MRR
- plans and statuses
- user/seat usage
- storage usage
- registrations
- service readiness / monitoring placeholders
- tenant plan/status administration

The running demo uses localStorage. Production monitoring must later use Azure/PostgreSQL/e-mail/billing/storage telemetry.

## Registration flow

Public flow:
1. `/pricing`
2. choose plan
3. `/register`
4. minimum company + owner data
5. authentication/login
6. `/onboarding`
7. create organization
8. create owner membership
9. start 14-day trial
10. open dashboard

## Pricing model

Starter — CHF 39/month — 3 users
- CRM
- quotes
- invoices
- exports

Business — CHF 89/month — 10 users
- Starter
- orders
- contracts
- time
- finance
- employees
- imports

Professional — CHF 149/month — 25 users
- Business
- audit
- API
- full workflow/product features

Enterprise — custom
- custom user limits
- custom integrations/governance/support

These are product defaults, not immutable commercial decisions. They are centralized in `lib/data/plans.ts`.

## Still requires real external infrastructure

Before public launch:
- production PostgreSQL repositories
- identity/membership persistence
- payment provider checkout/webhooks/invoices
- real e-mail provider
- file/blob storage
- malware scanning
- monitoring/alerting integration
- backup and restore verification
- legal pages / DPA / terms / privacy
