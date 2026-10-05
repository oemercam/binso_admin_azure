# Binso One – Production Customer Journey Test Plan

## Scope
This plan verifies the public demo, real 14-day trial, Stripe subscription activation, webhook processing, account entitlements, Customer Portal, cancellation, and trial expiry behavior without conflating demo and production sessions.

## 1. Public demo
1. Open the landing page in a clean browser session.
2. Select **Demo starten**.
3. Complete demo onboarding and verify example data is visible.
4. Open **Einstellungen → Abonnement**.
5. Expected: the page clearly states that payments are disabled in demo. No live Stripe Checkout can be started.
6. Leave demo and register a real account in the same browser.
7. Expected: the demo cookie/session is removed and the new real account is used immediately.

## 2. Real registration and 14-day trial
1. Choose each plan from the pricing page: Start, Business, Pro.
2. Test both monthly and yearly selection.
3. Register with a unique business email.
4. Expected: the selected plan and billing interval are preserved.
5. Expected: no card is required for trial creation.
6. Expected: the account shows a 14-day trial and CHF 0 during the trial.
7. Verify the confirmation email arrives and the verification link succeeds.
8. Verify **Bestätigungs-E-Mail erneut senden** is rate-limited and works.

## 3. Stripe Checkout
1. From a real trial account, open **Einstellungen → Abonnement**.
2. Expected: Stripe is reported as ready; all six live prices are available.
3. Select the plan/billing interval and continue to Stripe.
4. Verify company/billing address and tax ID collection.
5. Complete one controlled live payment only with explicit business approval.
6. Expected: returning from Stripe alone does not activate access until the signed webhook is processed.
7. Expected after webhook: subscription becomes active, Stripe customer/subscription IDs are stored, plan limits update, and the paid period is shown.

## 4. Webhook and idempotency
Verify processing for:
- checkout.session.completed
- checkout.session.async_payment_succeeded
- checkout.session.async_payment_failed
- customer.subscription.created / updated / deleted / paused / resumed
- invoice.paid
- invoice.payment_failed
- invoice.payment_action_required

Replay the same event ID and confirm no duplicate billing ledger entry or entitlement update is created.

## 5. Customer Portal
1. Open Billing Portal from a paid account.
2. Verify invoice history is visible.
3. Verify payment method update is available.
4. Verify subscription cancellation is available.
5. Verify plan switching is not exposed unless Binso One explicitly supports it.
6. Cancel at period end and confirm Binso One reflects cancel_at_period_end without immediately removing paid access.

## 6. Trial expiry
1. Create a trial tenant with trial_until in the past and no Stripe subscription ID.
2. Trigger authenticated access.
3. Expected: subscription status becomes expired and organization becomes read_only.
4. Verify reads continue to work.
5. Verify normal writes are blocked.
6. Verify billing actions remain allowed so a customer can activate a plan later.
7. Verify data is not deleted.

## 7. Payment failure
1. Simulate invoice.payment_failed in a non-live environment.
2. Verify status transitions according to the billing lifecycle.
3. Ensure customer data remains readable and destructive actions are not performed.
4. Verify successful later payment restores the correct active subscription state.

## 8. Mobile / PWA
Test on current Safari/iOS, Chrome/Android, Edge/Windows and installed PWA:
- safe-area spacing
- sticky mobile header
- compacting bottom navigation
- plan selection sheet
- Stripe redirect and return
- keyboard/form behavior
- no horizontal overflow
- demo-to-real-session switch

## 9. Final production gates
Before launch require:
- Quality green on main
- Azure deploy green
- production route verification green
- Stripe Billing Configuration green with billingProductionReady=true
- six live CHF recurring prices valid
- live webhook enabled on 2026-08-26.dahlia
- default live Customer Portal enabled
- no legacy CHF 19/49/89 pricing or 30-day trial copy on public pages
