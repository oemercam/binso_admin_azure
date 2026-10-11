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
3. **Runtime activation is blocked.** An isolated execution of the actual `provisionOrganization` implementation under `binso_runtime`, with empty tenant/user/operator context, fails with PostgreSQL error42501: `new row violates row-level security policy for table "organizations"`. The current organization membership policy cannot authorize creation before the membership exists. Login and session lookup also join organizations before establishing user context and require isolated verification. Resolve authentication/bootstrap access through a narrowly authorized identity boundary, then execute actual registration/login/session/operator handlers with the restricted role. Do not enable BYPASSRLS or loosen all organization policies to hide this failure. `db:runtime-check` verifies catalog/schema policy properties; it does not prove these application flows. Tables intentionally outside tenant RLS require further policy review.
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
