# Read-only diagnosis of the blocked V25.5 release

Main `759f9dbea07ada69fc07db32452dc82875aa49bb` contains the approved V25.5
package. Its full/development Quality run 39440156636, push Quality 39440044170
and CodeQL 39440044113 succeeded. Deployment 39442519721 stopped before
`db:migrate` and Azure deployment because the read-only preflight found one
non-demo company in active/trial/grace_period without an active owner membership.
The other three conflict counters were zero. No production migration, data repair
or App Service deployment was executed.

The owner subsequently confirmed that the companies are test data and requested
deployment. This does not identify the offending row or authorize an arbitrary
owner grant, deletion or blanket preflight exemption.

Migration 0001 creates compatibility organization
`00000000-0000-4000-8000-000000000001` with name `Binso GmbH` and slug `binso` for
legacy demo data. It predates the is_demo column. This is a plausible explanation,
not verified production identity. Matching the ID/name/slug is metadata evidence,
not proof that all current records in the company are disposable fixtures.

## Supported diagnostic path

`.github/workflows/lifecycle-preflight-diagnostic.yml` is manual only, main-only,
requires `approve_readonly=true` and the existing protected Production environment.
It reuses the existing DATABASE_URL inside that environment. No new secrets,
Azure/OIDC permissions, GitHub write permissions or environments are introduced.
Checkout is pinned to the triggering SHA. There are no deployment or migration
steps and no automatic follow-up runs.

`node scripts/single-company-preflight.mjs --diagnose-ownerless` executes only
`database/operations/ownerless-company-diagnostic.sql`. READ ONLY transactions,
public-qualified tables and row_security=off make policy-filtered evidence fail
rather than look empty. The transaction is rolled back. It reports at most 25
matching organization IDs, status, counts of all/active/owner memberships and an
exact legacy-seed-identity-match boolean. Unexpected metadata or excess rows fail.
Output omits names, emails, user IDs, credentials and business records.

The ordinary preflight remains unchanged and blocks the same four conflicts.
Neither the diagnostic nor its result marks a company as demo, assigns an owner,
activates a membership, suppresses a gate or changes data.

## Evidence and next decision

The existing `single-company-preflight-test.mjs` now covers actual PostgreSQL-engine
positive/negative diagnostic selection, inactive versus active owners, changed
legacy identity, no owner activation, demo exclusion, bounded sanitized output,
malformed metadata, READ ONLY statements, RLS false-zero denial and workflow
protection. A full production-derived data decision remains pending.

Before integration, this critical workflow change requires explicit approval of
its concrete PR head and successful existing required checks. After integration,
the separate protected read-only run identifies the row. Only then can an exact
data correction, if necessary, be proposed and authorized. Do not rerun deployment
unchanged, weaken the gate, infer a real owner or automatically repair/delete data.
