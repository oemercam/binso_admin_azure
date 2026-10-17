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
