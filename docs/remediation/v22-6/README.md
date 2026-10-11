# V22.6 operational gate corrections

Source baseline: 925e134556cd4d2facb27fb290d5485bafe51c5b (PR237), main b398ff7400eb1b2ea90016c25e596261d58c822b.

## Actual production evidence

Read-only Azure Architecture Audit run38123383187 on main (2026-10-11) completed successfully but logged failed/unverified mandatory operations. Runtime DATABASE_URL connects as binsoadmin, with BYPASSRLS, CREATEDB and CREATEROLE. Auth ARM call uses unsupported POST. Storage, resource-group and monitoring reads are unauthorized; configured PostgreSQL resource is not visible. These are not successful acceptance results. No production compromise is inferred from the role flags alone.

## Corrections

* ARM authsettingsV2/list uses GET, documented by Microsoft: https://learn.microsoft.com/en-us/rest/api/appservice/web-apps/get-auth-settings-v-2?view=rest-appservice-2025-03-01 . Actual enabled platform/AAD, client registration and issuer tenant matching the operator pin are required. Public customer pages remain public; a global login requirement is not imposed.
* Mandatory inventory permission/API failures fail the job. Monitoring is a separate always-run gate; missing/invalid counts and CLI authorization failures fail. Real Bash execution preserves JMESPath backticks.
* Runtime role catalog gate rejects administrative privileges, reachable privileged role membership and table ownership. It runs independently even if inventory fails, in BEGIN READ ONLY/ROLLBACK. The DATABASE_URL is masked. `pnpm db:runtime-check` combines this check with the existing canonical schema/RLS-policy gate.
* The separately reviewed role provisioning operation creates binso_runtime with no bypass/admin/schema ownership, DML on existing application tables except the migration ledger, and sequence usage. It refuses an existing role and grants no future-table default rights. It is deliberately outside migrations and never automatically applied.
* The migration/business suite uses this provisioned role for explicit tenant/platform isolation probes, forbidden schema DDL and migration-ledger access. Most provisioning and HTTP-handler tests still run under the test administrator; their success does not establish runtime-role compatibility.

## Required operational completion

1. Audit identity: provide narrowly scoped reads for the actual PostgreSQL, Storage, resource group, Insights and alerts resources. Do not grant subscription Owner/Contributor merely to make inventory green. Correct the PG resource name from actual inventory if necessary. Current NOT_FOUND is not proof that the database does not exist.
2. Run the corrected read-only audit from this candidate. Missing rights and current privileged DATABASE_URL must produce failure, not an accepted release.
3. The confirmed organization-creation failure is corrected by additive migration0047 and the context-aware application changes below. Complete native PostgreSQL restricted-role CI before any runtime activation. Direct organization insertion remains denied. Authentication/platform data still share the server pool; this correction does not claim complete separation of all DB identities. Tables intentionally outside tenant RLS and actual operator/provider operation require further verification.
4. Credential binding, runtime connection switch, migration credential separation and a tested rollback are separate production changes. Never remove privileges from binsoadmin blindly. Future schema migrations require reviewed grants to the runtime role; migration credentials must not become app runtime credentials.
5. Actual EasyAuth ingress/header stripping, Entra role assignments, scanner/signature operation and alert delivery remain live acceptance obligations. Configuration presence does not prove effectiveness.
6. The 432-requirement registry and strict UX release gate remain authoritative. Empty visual baseline approval cannot be replaced with automatically approved screenshots. Physical installed iOS/Android PWA/OS keyboard proof is still missing. Bottom navigation is unchanged.

## Open PR overlap

PR222 and PR231 are older branches with conflicts against current main. Current candidate already contains the newer shared wizard, customer-draft/i18n and PDF-stage implementations; copying their full diffs would overwrite later corrections. They are reviewed against the integrated code, not merged blindly. Their old green runs are not evidence for this new head.

No main merge, deployment, production data/role change or full-platform acceptance is claimed.

## Local validation

2026-10-11: frozen pnpm10.17.1 installation, complete package test chain, lint, TypeScript, webpack production build, CSS architecture, 57-route live local production/CSS/demo/theme check, compliance engine self/report tests and protected navigation contracts passed. Scanner protocol tests explicitly use the existing in-memory transport because this environment denies Unix sockets. No physical device or real ClamAV service is claimed. Dependency inventory was regenerated after the package-script change; its source-fingerprint gate passed. Browser executables are not installed locally; fresh GitHub browser CI is required for this head.

## Additional isolated compatibility probe

2026-10-11: all migrations were applied to PGlite under schema_owner, then the reviewed role operation was applied. The existing business suite was temporarily executed with `SET ROLE binso_runtime` immediately before the actual provisioning call and all app context settings cleared. It rejected organization insertion with error42501. The temporary probe was removed. This is a confirmed blocker, not a passing acceptance test; no productive role switch was performed.

## Runtime authentication correction (2026-10-11)

* Migration0047 adds a SELECT-only membership lookup for the server-verified user context. It does not alter business-table tenant policies or organization write policies.
* `bootstrap_organization` is a fixed SECURITY DEFINER operation: it validates/locks a new active user, refuses established members, allocates a globally unique slug, creates a new organization and its owner membership atomically. It accepts no existing organization identifier or arbitrary role. PUBLIC has no EXECUTE permission; the separately reviewed runtime-role operation grants only this function and the read-only migration-version helper. Its SQL uses schema-qualified tables and a fixed search path. The existing role-seeding trigger search path is hardened against temporary-table shadowing.
* Password proof precedes membership discovery. Session/receipt lookups establish context from an opaque live bearer and recheck the complete user/membership/organization conditions in a transaction. Verification, handoff, resend and trial expiry establish transaction-local context; it cannot survive into another pooled request.
* `db:runtime-check` can now inspect canonical versions through a fixed read-only helper and schema metadata through pg_catalog. It still has no direct access to migration-ledger rows/checksums or DDL. The canonical check requires migration0047.
* The actual registration integration handlers now run under binso_runtime for every application query/transaction. Local PGlite passed registration, verification, delivery failures/retries, pending receipt, login OTP, MFA/company handoff, tenant preservation, suspended organization/member rejection, invalid/expired session rejection, scoped trial expiry, direct-bootstrap denial, existing-account denial, helper ACL and temp-table shadowing adversaries, identity-only visibility and pooled-context cleanup. PostgreSQL native execution and a fresh login using synthetic disposable runtime credentials are included in GitHub Quality. Native results must be verified before calling this complete.

Deployment order, once separately authorized: apply0047 with the migration identity, review function ownership/ACLs, explicitly grant the two function signatures to an existing runtime role if already provisioned, execute restricted-role readiness and actual application flows, then bind/switch runtime credentials with tested rollback. This has not been applied to production. Existing deployed databases without0047 intentionally fail the new schema readiness gate.

## Exact Azure access gap

Audit38123383187 authenticated through GitHub OIDC as service-principal object0344d5a2-0297-40cf-9333-fd1ec6a3b50c. It lacked Microsoft.Storage/storageAccounts/read, Microsoft.Resources/subscriptions/resourcegroups/read and Microsoft.Insights/{metricAlerts,scheduledQueryRules,actionGroups}/read on rg-binso-admin-prod. Reader on that resource group covers control-plane inventory; Reader is also needed on the actual PostgreSQL resource group (currently binso-platform-db is not visible). The App Service config-list permission already allowed settings reads; do not grant subscription Owner/Contributor for this audit. App registration/Entra assignments and Graph effectiveness are separate from Azure resource Reader. In this session the Azure portal redirects to Microsoft sign-in; no active interactive Azure session is present. No RBAC, App Setting, DB role or productive data was changed. Physical iPhone/Android checks are deferred at the user's request.

Local final validation for the runtime correction: complete package test chain, TypeScript, ESLint and Next production webpack build passed. Protected navigation contracts passed. Native PostgreSQL and fresh GitHub CI remain required for the published code head; production credentials/roles and migrations remain unchanged.
