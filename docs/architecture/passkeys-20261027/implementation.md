# Passkey implementation — 27 October 2026

The full owner request is preserved byte for byte in [source.md](source.md).
This extends the existing SimpleWebAuthn server14.0.3/browser13.3.0 implementation,
PostgreSQL credentials and opaque HttpOnly sessions. It introduces no identity
provider, parallel session store or paid service. Operators remain on Entra.

## Architecture and security

- Registration still requires an active, email-verified account, one active
  company, a live session and a fresh five-minute server-side proof. The final
  transaction rechecks that proof and the encrypted identity-security snapshot.
- Authentication verifies the signature, exact configured origin/RP, single-use
  five-minute challenge, user verification and discoverable user handle. The
  library owns signature-counter validation, including zero-counter synced keys.
  User and credential locks serialize management and authentication. No private
  key or biometric data reaches the database.
- Required UV is strong tenant authentication without a second TOTP. The existing
  session gains a server-owned `passkey_verified` marker; old/password sessions
  default false. Enrolled TOTP remains required for password login. A password-only
  session cannot satisfy company MFA policy without enrollment.
- Passkey step-up binds the ceremony to the exact existing session/user/company
  and current identity snapshot. It sets that session's existing `step_up_at` and
  server-owned passkey assurance;
  it does not create another session. Critical mutations consume the fresh proof.
  Passkey recovery-code step-up consumes the code in the same locked transaction
  as the proof and audit, so an audit failure cannot burn a code or grant a proof.
- Adding, renaming, removing and rotating recovery codes use fresh proof and
  transactional audit/outbox entries. Removing a key revokes other sessions.
  The last required strong method cannot be removed. Multiple devices/security
  keys are supported, with at most ten active credentials per account.
- New passkey recovery codes are generated on initial setup and shown once.
  Every code has128random bits. Regeneration invalidates old codes. Only SHA-256 hashes are stored, separately
  from existing TOTP recovery codes. Email-token password reset requires TOTP,
  an existing TOTP recovery code or a passkey recovery code when a factor/key is
  present. Token consumption, one-time code, password, session/challenge revocation
  and audit/outbox update roll back together. Email alone cannot downgrade MFA.
  Once a key is enrolled, password/email step-up cannot silently replace it:
  password alternatives require TOTP or an offline recovery code. A final user
  lock also rejects an email proof if a passkey was enrolled concurrently.
- Another registered key, existing password plus enrolled TOTP/recovery, or the
  email link plus an offline recovery code handles device loss. There is no
  undocumented support bypass. Loss of all strong proofs requires an independently
  reviewed identity process; this implementation never auto-disables MFA by email.
- Existing same-origin checks, bounded JSON, database rate limits, no-store
  responses, RLS and session rotation remain in place. Database access checks apply
  after login on every protected request; UI state never grants permission.

## UX and languages

One direct passkey action opens the OS ceremony. Supported browsers can use
conditional autofill through `username webauthn`; its cancellation does not block
password login. Explicit and conditional flows coordinate one challenge/ceremony.
The password form remains visible. Unsupported devices get the password form.

The non-modal setup offer is eligible after email verification and completed
company onboarding. “Later” is stored on the real account for30days. The existing
security page lists keys, labels and locale-formatted last use, manages multiple
keys and displays one-time recovery codes. Native dialogs stay owned by the OS;
biometrics versus device PIN depends on the authenticator, not on application copy.
All new application copy uses the existing DE/EN/FR/IT/TR catalogues. Security
notifications use the account language. Navigation, FAB, Inter and shared controls
remain owned by the existing design system; no new CSS or update banner is added.

## Configuration and rollout

`APP_URL` is the sole exact HTTPS origin and its hostname is the RP ID. No wildcard,
forwarded-host inference or shared preview RP is accepted. Local development may
use `http://localhost:<port>` with `APP_MODE=local`. Preview needs its own HTTPS
`APP_URL`, database and cookies. Existing credentials remain bound to their original
RP: switching to a different host requires registering a new key while the old
login/recovery paths still work. No new domain or secret is hardcoded.

Optional `BINSO_PASSKEYS_ENABLED=false` stops new registration/authentication
ceremonies and suppresses the setup offer. Default true preserves the previously
available feature. It does not revoke already valid sessions or erase credentials.
Keep password/TOTP available when disabling; do not strand users subject to company
MFA. The existing platform flags are module/product flags rather than public-auth
configuration, so this switch uses the existing server environment owner.

Additive migration0108 adds only three columns to existing tables; the complete
schema contract is regenerated. Apply through the existing migration pipeline
before deploying the app. Do not roll the database back by deleting user keys.
Old code ignores these new columns. The existing exact-SHA approval, full Quality
artifact promotion, Azure environment approval and live checks remain mandatory.
No production migration, push, merge or deployment is performed by local delivery.

## Verification and boundaries

The focused backend suite uses actual migrated PostgreSQL semantics via PGlite and
real P-256 signatures through SimpleWebAuthn. It tests origin/RP/UV/signature,
challenge replay/expiry, counter reuse, user-handle mismatch, stale encrypted
snapshots, RLS, session-bound step-up, renaming, last-method protection, recovery
and session revocation. Existing race/registration/session/operator suites remain.

The new Chromium test uses an actual virtual CTAP2 authenticator with the real
browser WebAuthn API and SimpleWebAuthn verification. Its HTTP responses are an
isolated synthetic UI fixture; it is not a real Azure end-to-end/device test.
It covers registration, native passkey reauth, rename, exactly one explicit login
without TOTP, responsive login and unsupported-device fallback. Quality runs it
alongside the unchanged browser matrix. Local full QA results are recorded in the
delivery receipt, rather than inferred from the source inventory.

Pending external evidence: actual Face ID/Touch ID/Windows Hello/Android/security
keys, Safari/Edge on physical devices, iOS/Android installed PWA, credential-manager
autofill selection and real notification delivery. Virtual tests do not establish
those passes. OWASP/FIDO alignment is an engineering review, not an ASVS certificate.

Sources checked: [SimpleWebAuthn server verification](https://simplewebauthn.dev/docs/packages/server),
[UV and passkeys](https://simplewebauthn.dev/docs/advanced/passkeys/),
[OWASP passkey security](https://cheatsheetseries.owasp.org/cheatsheets/Passkey_Security_Cheat_Sheet.html).
