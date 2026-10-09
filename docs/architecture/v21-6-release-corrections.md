# V21.6 follow-up: source integrity and interrupted document creation

The independent audit of `9a3960ab5ea3f5cefaf08914463b958a5b1caeea` remains historical. On 10 October 2026 the user explicitly authorized code corrections, merge and deployment. This follow-up does not retroactively change the audit's NOT VERIFIED findings.

## Implemented corrections

- Document creation reads its source offer and selected time/expense billing records through the existing `useApiQuery`. Initial loading, errors and missing/invalid associations block saving and offer a local retry. A failed one-off source request can no longer silently become an unrelated invoice. An offer must be accepted and not already invoiced; server transaction checks remain authoritative.
- Source-offer initialization runs once. Background revalidation cannot overwrite edited positions. The source customer remains locked. Customer-directory failures use the same local retry control.
- `useProcessDraft` is the reusable recovery owner. It stores only an unfinished creation's editable state, wizard step and financial replay key in sessionStorage after a verified user/tenant/role identity. Entries expire after 24 hours, have a size bound, and tolerate invalid JSON or storage failure. No credentials or API response cache are stored. A session fence, logout, user/role change or confirmed discard removes drafts. Session changes fence an already mounted process instead of republishing old input under a new identity.
- Offer/invoice creation without imported time/expense entries uses recovery. Source-offer creation is included. The same replay key is flushed before a POST and cleared only after confirmed persistence. Success and explicit discard remove the recoverable draft. Complex imported time/expense drafts and other domain forms are not claimed to have universal recovery yet.
- Native HTTP/PostgreSQL coverage extends invoice issue transitions across all eight tenant roles, an invalid invoice-only transition, cross-tenant membership changes, and tenant-to-operator mutation denials. Existing provider/operator-role and physical-device coverage boundaries remain explicit.

## Verification and limits

Existing unit/PGlite, navigation, PDF/QR, UI ownership and data-foundation gates remain mandatory. Process-draft regression covers user/tenant/role isolation, expiry, corrupt storage, quota failure, replay/step retention and session-fence purge. Real browser additions cover failed source fetch/local retry, locked customer, preserved input after background refresh, reload recovery, dirty cancellation and confirmed discard.

Both customer and operator bottom-navigation contracts remain frozen against `1eef9fb1d005d4752f12a9dd5c0e620decca4444`. No CSS modification, safety-check removal or destructive migration is introduced by this follow-up. The stacked candidate includes the previously isolated nullable file-relation migration0046; the normal deployment migration/check gates must run without bypass.

The complete original V21.1–V21.5 requirements and a route/state-specific approved target-image mapping are still unavailable in this audit context. Physical installed iOS PWA/keyboard and real identity-provider acceptance are not replaced by browser fixtures. Deployment of this scoped verified correction is authorized; it is not a claim that every V21.6 acceptance row is PASS.
