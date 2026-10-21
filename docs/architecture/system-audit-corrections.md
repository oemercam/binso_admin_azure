# System audit corrections — 21 October 2026

This implements confirmed defects from the local system audit on Main
`e4932c27aa381108601417d4085af2f288b73e59`, retaining the registration-feedback
change in PR #303. It is not a new UX foundation or a production authorization.
Navigation, blue create action, tariff prices and existing business workflows stay
under their current approved contracts. No production data was changed or reset.

## Implemented corrections

| Audit finding | Implementation | Evidence / remaining qualification |
| --- | --- | --- |
| F01: time-only support upload | One ownership predicate determines both SQL placeholders and arguments. | Actual upload handler: standard/time-only own case succeeds; another user/tenant is denied. |
| F02: shared notification read state | `notification_reads` stores a receipt per user. Reads and single/all mutations use one repository. | Full migrated schema and restricted runtime RLS; two users, replay, private legacy receipts, cross-user and cross-tenant negatives. |
| F03: hidden desktop passkey | Neutral `auth-passkey` owner replaces the retired demo class and desktop hiding rule. | Mobile/desktop visibility is asserted in the existing registration browser suite. |
| F04: inconsistent auth | Shared PasswordInput and bounded auth requests; email verification separates unavailable from invalid, with explicit retry and safe next path. | No automatic mutation retry. Existing password reset draft guard, MFA and token cleanup remain; browser coverage includes outage/retry/invalid and field geometry. |
| F07: unbounded SQL | The application pool sets a 15-second statement deadline and 30-second idle-transaction deadline. | Connection deadline remains 8 seconds. Migration/preflight scripts own separate pools. Representative migrated business tests pass; real workload latency/device acceptance remains separate. |
| F08: template ID as role | Forward migration 0066 makes `app_workforce_role` depend exclusively on active membership. | Historical migrations are immutable. QA fixtures now create real synthetic owner/reviewer memberships. Unknown identity at the old template ID returns `none`. |
| F09: broken deployment predicate | `jq` checks exact names in an array; a parser/type error terminates the step instead of looking like an absent setting. | Actual extracted predicate has present/absent/empty/later-entry/name-value/suffix/malformed countercases in Linux CI. No local jq installation. |
| F10: proven dead UI | Removed unused ProgressBar, stale settings import and its exclusive CSS/tokens. | Retained RouteLoading: Next's `app/loading.tsx` really consumes it. The inventory now records framework boundary consumers separately, preventing that false deletion candidate. |

Unknown roles are denied by the central path predicate, including destinations
without a mapped module. Notification route permissions are explicit. The source
inventory continues to recognize the centralized `authRequest` data boundary.
No unproven CSS cascade candidate or large domain component was blindly removed.

## Migration and rollout boundaries

- 0065 adds notification receipts, tenant/notification FK, own-user FORCE RLS,
  supporting index and SELECT/INSERT grants for the existing runtime role only
  when it already exists. It creates no identity or broader resource permission.
- The existing notification rows and legacy `read_at` column remain untouched.
  Personal legacy reads are preserved on read. A historical shared read has no
  reliable user attribution and is deliberately not copied to every user; old
  shared notifications can therefore reappear unread once.
- 0066 replaces only the role helper, preserving its identity/dependencies and
  fixed search path. Old policy clauses naming `demo_template` are unreachable
  because the helper can no longer return that role. Historical SQL stays intact.
- `db:check` requires the new table, tenant RLS and FORCE RLS. No migration was
  executed outside isolated tests. Integration and deployment require a separate
  review of the final commit and these two migrations.

## Security findings that must not be silently dismissed

The observed Main alert list contained #2, #24, #23, #22 and #21. A successful
`analyze` job is not equivalent to zero outstanding alerts.

| Alert | Reviewed flow | Status |
| --- | --- | --- |
| #2, insecure randomness | The alert's old source is `lib/saas-store.ts` in an earlier commit; the file and local account creation path are absent from current Main. | Removed code; await/verify current analysis state, no restoration of Autofix's old feature. |
| #24, file query authorization | Optional request filters previously surrounded additional authorization calls. The session now determines a positive purpose/relations whitelist first. | Source corrected and positive/negative actual-handler tests added; current CodeQL qualification required. |
| #21, auth surface test | Public generated route paths select fixed synthetic anonymous requests to the locally started loopback server, with no production DB. | Intentional test flow; recorded review is not a dismissal of the repository alert. |
| #22, native tenant test | Source inventory drives synthetic HTTP probes in an explicitly disposable loopback PostgreSQL test environment. | Intentional test flow; no production credential or external data destination authorized. |
| #23, Stripe audit | Deployment settings supply the credential intentionally sent as authorization to hardcoded `api.stripe.com`; keys are masked. | Trusted provider authentication flow; no automatic alert suppression or permissions change. |

The current registry audit still reports GHSA-vfj7-8cjw-p6xm in dev-only
`eslint-config-next > @next/eslint-plugin-next > fast-glob > micromatch > braces`.
The structured audit reports no patched version. The existing exact exception
ends **24 October 2026, 00:00 UTC** and was not extended. The production dependency
gate remains mandatory. No unreviewed replacement, forged version override or
blind dependency upgrade was made. This upstream issue remains open.

## Verification limits

Targeted local tests cover the changed auth/upload/receipt/RLS/workforce/domain
boundaries, full migration/business fixtures, source contracts and architecture.
TypeScript and ESLint must pass on the final source. Generated API/schema/UX
inventories are refreshed by their existing generators; no fingerprints are
manually edited.

GitHub Quality/CodeQL and required browser evidence must be evaluated on the final
head. The extended browser cases use synthetic POST fixtures, never real mail or
password changes. The Windows scanner check uses the existing in-memory protocol
transport; native Unix sockets remain part of Linux CI.

The original 432-requirement product acceptance, physical iPhone/Android/iPad PWA,
keyboard/screenreader checks and individual E01–E10 business acceptance remain
separate open evidence. No performance improvement is claimed without comparable
real workload timings. Large component splitting and the remaining CSS candidates
require demonstrated behavioral benefit, not a blanket cleanup declaration.
