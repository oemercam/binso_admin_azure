# Demo retirement and reviewable test-data reset

The owner now requests removal of all existing test companies, their business
data and uploaded demo files, followed by testing a newly created company.
The owner explicitly chose to remove the integrated demo feature too. This
supersedes earlier requirements to preserve that feature, but does not authorize
removing authentication, RLS, mandatory checks, operator access or infrastructure.

## Source baseline

The source baseline is Main c992b8f23ef88ab90529c0956e7e29a623740393.
Historical migrations contain compatibility and canonical-demo seed data. The
current deployment workflow and browser fixtures depend on demo functionality.
These code dependencies must be replaced before deleting their live data.
Production diagnostic findings are retained separately, not published here.

The initial Main change only prepared a broader read-only inventory. The current
implementation branch retires demo access and adds a tested, bounded reset engine.
Complete demo retirement and release qualification remain unfinished; a database
reset must never be reported as a successful application deployment.

## Updated reset authorization and implementation

The owner subsequently authorized deleting all existing application companies,
business data and other application users, retaining only the explicitly named
existing Entra platform owner. This supersedes the earlier requirement to retain
all personal identities/operator assignments. It does not authorize deleting Entra
accounts, changing App Roles/RBAC, dropping schemas, changing RLS or Azure resources.

`scripts/test-data-reset.mjs` has no automatic production CLI. Its caller must
supply the retained email, Entra object/tenant IDs and an independently reviewed
table allowlist. The plan binds company IDs, owner fingerprints, schema, constraints,
policies and triggers. Unknown scope, partitions, TRUNCATE triggers or drift block
execution. Authentication secrets are not exported into the plan.

The apply operation locks the reviewed tables and identity/configuration owners,
revalidates the plan, and uses one explicit `TRUNCATE ... RESTRICT` statement.
It never uses CASCADE, disables RLS, grants privileges or drops/recreates objects.
Other application identities/operator assignments are deleted; the retained
owner, any matching personal identity and existing owner sessions are compared
before commit. Schema, policies, constraints, triggers, migration history and
tariff/operational configuration must remain unchanged. Errors roll back the
uncommitted transaction; there is no automatic post-commit restore.

`scripts/test-data-reset-test.mjs` applies the full migration lineage in an isolated
database and tests real owner/FORCE-RLS behavior, exact scope, identity mismatch,
tampered confirmation, drift denial, empty tables and preserved owner/configuration.
Production plans, backup findings and receipts remain local, outside this public
repository. External blob/provider deletion is a separate concern and must never
be inferred from database truncation or a currently absent storage configuration.

## Inventory before irreversible action

The existing protected diagnostic workflow gains scope `test-reset`; its default
`ownerless` behavior remains unchanged. Manual-only, main-only, explicit read-only
input and Production approval remain. No new permissions, secrets or environments.

`scripts/test-data-reset-inventory.mjs` reads all existing organization IDs/statuses,
demo flags and dependent row counts in a repeatable-read READ ONLY transaction.
RLS filtering fails rather than producing false zero counts. At most 100 companies
may be listed. External file references and provider identifiers are never printed:
only counts and a digest of ordered blob references are included. Names, emails,
business contents and authentication material are excluded. The report also counts
personal identities and operator assignments, which remain outside deletion scope.
The inventory fingerprint identifies this report, not a backup or deletion grant;
it does not prove unchanged business contents when record counts stay equal.

Actual production results must be retained locally, not copied to a public PR
without separate disclosure authorization. Execution through public Actions also
requires explicit approval of the limited ID/count output for that destination.

Before applying any reset: review the concrete companies and files, secure a
verified appropriate backup, resolve any external billing references and dependent
blob objects, and obtain action-time confirmation of the exact irreversible scope.
Lock and revalidate the selected records before mutation. No flags may falsely
claim export/blob deletion success. Abort on drift or missing access. Preserve
operator assignments, personal login identities, MFA/passkeys and Azure resources.
No deletion, backup export or external provider action runs from this inventory.

## Release implementation and remaining acceptance

- Customer/operator demo URLs are unconditional HTTP 410 tombstones. Legacy
  cookies cannot authenticate; Entra operator validation and customer MFA remain.
  Preview pages redirect to public product/registration entry points.
- Application pages use real authenticated APIs. Retired demo collections and
  client mutation helpers are removed; confirmed logout still clears old markers.
- Migration 0064 preserves the bootstrap function identity, ACL and fixed search
  path while rejecting the retired demo mode. Historical migrations stay immutable.
- Synthetic business data is owned by scripts/fixtures, outside production imports.
  Browser lanes use genuine operator sessions in a disposable loopback PostgreSQL
  database; unidentified/stale databases and external UI targets are refused.
- Production verification checks exact release/artifact identity, real database
  readiness and protected API/retired-cookie denial without provisioning records.
  Real authenticated business/PDF persistence coverage remains in isolated gates.
- Reset execution and evidence stay separate from deployment. A release must not
  recreate removed test tenants. External provider/blob work is never inferred.
- Required Quality/CodeQL, browser qualification, regular protected integration and
  exact release authorization remain mandatory. Source changes and local checks
  do not prove that the application is already deployed. The first real company
  and physical-device acceptance remain separate post-release user checks.
