# Model A: bounded autonomous development and integration

## Scope and trust boundary

An authorized development assignment permits Codex to create a scoped branch/PR,
run targeted tests, fix demonstrated related failures and integrate eligible
routine changes. It does not start an unattended agent or authorize production.
GitHub Actions keep their existing read-only source permissions; no PAT, new
credential, auto-approval bot, privileged follow-on trigger or merge writer is
introduced. Existing Quality parallelism and CodeQL remain unchanged.

## Risk classes

| Class | Examples | Integration |
| --- | --- | --- |
| Routine | Prose documentation/text; candidates also include isolated small UI copy and low-risk tests | Initial automatic allowlist is only canonical README/docs Markdown/text, at most 10 files and 200 changed lines, excluding security/governance/binding UX references. UI/test semantics require separate assessment until safely allowlisted. |
| Elevated | Shared UI owners, APIs, business processes, unknown runtime/configuration dependencies, large diffs | No routine automatic merge; scoped risk review and relevant independent automated evidence. |
| Critical | Authentication, roles, tenant isolation, payments, schema/migrations, CI, deployment, security, policy/AGENTS changes | Separate explicit risk decision; never self-approve or impersonate a second person. Existing required human reviews remain blocking if no eligible independent reviewer exists. |

The highest risk wins. Renames, incomplete diffs, unknown paths, missing evidence
and ambiguous classification block automation. Labels and PR text cannot downgrade
risk. AI self-review and green CI do not constitute independent human approval.
The orchestrator must inspect the actual diff for secrets, scope and semantics.
Security/UX/governance requirements changed inside an innocently named prose file
are still critical. A same-head `diffAssessment` with no secrets/blockers is
mandatory input; it is not an independent review or an approving GitHub review.

## Routine execution

1. Read current remote main and the complete diff. Preserve unrelated local work.
2. Create one separate branch/PR for the authorized objective; keep incomplete work
   draft. Use targeted local tests/typecheck; preserve all integration/release gates.
3. Collect fresh authenticated PR metadata, every paginated file (including rename
   metadata), current main/protection, all current-head check runs and reviews/
   unresolved threads. Never accept this evidence from PR-controlled files/text.
4. Use the version of `.github/model-a/policy.mjs` already reviewed on protected
   main, not the PR version: `node .github/model-a/policy.mjs <snapshot.json>`.
   The module documents its input in `integrationDecision`; its fixtures show the
   normalized schema. Snapshots are advisory local evidence, not signed attestations
   or a server-enforced risk gate. Do not save credentials or secret values in them.
5. Require a ready decision, fresh successful `quality` and `analyze` from GitHub
   Actions, clean/up-to-date mergeability, resolved discussions and every existing
   review rule. Merge through the authenticated Codex connector with the exact
   `expected_head_sha`. If base/head changes, repeat only the affected assessment.
6. Check the merge SHA and main checks. Bundle status reads; normally wait at least
   two minutes between unchanged CI snapshots. Do not rerun successful tests without
   changed code or a concrete concern. Respect assignment time budgets.

Repository-level native Auto-Merge remains disabled in phase one. A queued merge
could survive a later trusted-actor push with a changed risk class. Immediate,
SHA-bound merging avoids that race without giving Actions write permissions. The
guard itself does not call GitHub, grant rights or merge anything. A paused/closed
Codex session does not continue work automatically. This is a Codex operating
contract, not protection against a malicious repository administrator.

## Verified baseline, 2026-10-17

- Remote main: `8a020310530b14051910c94b7df6f6f976989a31` (PR #266).
- Classic main protection: PR required; `quality` and `analyze` required from GitHub
  Actions; branch must be current; discussions resolved; no administrator bypass;
  no force pushes/deletions. Required human approval count is zero; it is not
  increased to a fictional second-person approval and no existing rule is removed.
- Actions default token reads contents/packages; Actions PR creation/approval off.
- Production environment: only selected `main`, administrator bypass off. Required
  environment reviewers were off at inspection; phase one enabled the sole owner
  `oemercam` as the required approver and verified the saved setting in GitHub.
  Self-review prevention remains off so the sole owner can approve their own
  dispatch. This is explicit owner deployment approval, never four-eyes review.
  Impact: the existing architecture/mail/monitoring/backup/Stripe readiness jobs
  and retention maintenance also use this environment, so they now wait for owner
  approval too. Separating non-writing readiness from production credentials needs
  a dedicated least-privilege design; no secrets were copied or rights widened.
  Until then, the target of deployment-only regular approval is not fully reached.
- Deploy remains manual, exact-current-main SHA bound, with explicit production
  flag, successful exact-SHA full manual qualification and central ZIP verification
  before migration/deployment. Standard/main-green QA cannot replace full production
  qualification. The production/development acceptance profiles are unchanged.
- GitHub connector can create branches/PRs and merge; full protection API returns
  403, environment/Actions-settings endpoints are unavailable through this connector.
  Settings were inspected through the authenticated UI; no additional rights granted.

## Permissions and remaining acceptance

Codex needs existing repository Contents/Pull requests write and Actions/checks/
reviews read access. GitHub administrative settings need owner/admin UI access;
no broad token or Actions write permission is required. Protection still governs
every merge, including owner-authored changes.

Phase-one implementation must be independently assessed as a critical governance
change, pass Quality/CodeQL and be integrated before the protected-main policy is
usable for routine work. Then exercise one harmless prose-only test PR through
classification, current checks, SHA-bound integration and main verification. Do
not report the process as accepted until that live test actually succeeds.

Open: live routine test, and an
independent automated review integration if broader UI/test automatic eligibility
is desired. No production operation is part of this rollout.

## Phase 2: safe readiness preparation (2026-10-17)

The reviewed initial PR #267 head was
`f257e44a7fe7ba10a6a78de434a3b40de8b3c570`. Its `quality` and `analyze` checks
passed, but it remained draft and browser validation was skipped. These results
are not full critical-change acceptance and cannot be reused for later heads.
The policy classifies the actual governance/CI diff as critical and refuses its
routine integration. No approving review, auto-merge or bypass was performed.

| Operation | Prepared boundary | Activation status |
| --- | --- | --- |
| Monitoring inventory and backup configuration inspection | Separate `readiness` environment and dedicated `vars.READINESS_AZURE_CLIENT_ID`, `READINESS_AZURE_TENANT_ID`, `READINESS_AZURE_SUBSCRIPTION_ID`; no Production secrets or fallback | Blocked until a verified Reader identity, matching OIDC federation and main-only environment rule exist |
| Architecture audit including settings/credentials and database inspection | Existing protected Production job | Cannot become unapproved Reader inventory as-is; split secret-reading/database checks only after dedicated least-privilege access is available |
| Graph and Stripe credential/configuration validation | Existing protected Production jobs; explicit send gate retained | No deployment identity or production API key copied to an unapproved scope |
| Retention checks and actual cleanup | Existing protected Production job; preview is read-only, scheduled/apply cleanup can write | Separate read-only database identity is unknown; normal preview separation remains blocked. Existing approval and schedule semantics retained |
| Deployment/migration/configuration changes | Existing Production owner approval, exact SHA, qualification and artifact verification | Unchanged; no production operation in this assignment |

Monitoring/backup workflow edits are **preparation in a draft PR**, not an activated
readiness service. Their existing GitHub permissions (`contents: read`, existing
`id-token: write` for OIDC) are unchanged. OIDC token permission does not prove
Azure Reader access. `azure/login` uses only the separate variables, and the
central configuration guard fails before login if these are absent or invalid.
Valid IDs are not RBAC proof; neither the test nor this guard claims otherwise.

Before integration/activation, verify actual direct/inherited/group/custom-role
and resource/data-plane access of the readiness principal, its exact OIDC subject
for `readiness`, and a GitHub environment permitting protected main only, with no
Production secrets. Do not create an unrestricted environment by merging first.
Do not reuse the deployment identity, copy database/Graph/Stripe secrets or widen
Actions permissions to work around missing setup. New Azure federation/roles or
database principals are outside the current no-infrastructure-change assignment.

The owner confirmed that separate identities are not known and requested safe
preparation. Azure CLI is not installed in this local execution environment;
effective Azure RBAC, federated trust and read-only database grants remain
unverified. Repository owner permission is admin, but main checks remain enforced
for everyone; this is not a bypass entitlement. Existing Actions settings and
Production environment protection are unchanged in phase two.

Harmless integration: `.github/model-a/readiness-policy-test.mjs` parses the actual
workflow/composite YAML and runs its Bash/Node guard before a fake Azure login.
Positive and negative cases cover correct configuration, missing/invalid IDs,
wrong branch/repository and forbidden deployment fallback. It also checks the
actual YAML permissions and that secret-reading/mutating jobs stay on Production.
No Azure token, cloud API, production data, email or migration is exercised.
This is not a live Azure acceptance or a successfully merged routine test PR.

Required next evidence: independent critical-rollout assessment, actual Reader/
OIDC/environment/DB capability verification, current-head non-draft mandatory CI,
then a harmless routine PR test with exact-head integration and main verification.
Until these exist, keep PR #267 draft and do not merge through the routine path.
