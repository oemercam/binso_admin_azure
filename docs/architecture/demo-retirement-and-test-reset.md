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

The currently checked-in change only prepares a broader read-only inventory.
It does not implement the complete retirement or reset, and must not be reported
as completed demo removal or successful production deployment.

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

## Remaining implementation, all still open

1. Remove customer and operator demo entry points/cookie authorization and
   preview routes. Ignore or expire legacy demo cookies; never issue a session
   from them. Entra-only operator access and normal customer MFA remain.
2. Remove production demo provisioning and template-copy helpers. Keep historical
   migrations immutable; move required synthetic QA fixtures to isolated test
   owners so regression coverage does not depend on a live demo tenant.
3. Remove client demo storage, local row mutations, demo-only UI/data fallbacks
   and account badges. Use genuine authenticated APIs consistently; retain the
   existing UX foundation, navigation, blue create action and real empty states.
4. Replace demo-dependent deployment verification with explicit runtime/database,
   authentication-denial and artifact checks, plus isolated end-to-end business/PDF
   coverage. Live checks that require the first real test company remain separately
   pending until it exists; do not claim them passed or silently drop coverage.
5. Retire conflicting demo test contracts in favor of positive real-account and
   negative legacy-cookie/retired-endpoint/MFA/RLS regressions. Regenerate inventories
   with their existing generators and retain every required Quality/CodeQL gate.
6. After the actual inventory and exact irreversible confirmation, apply the
   controlled reset, verify no targeted tenant rows or referenced files remain,
   and independently confirm retained administrator access. No blanket SQL TRUNCATE,
   no account deletion, no automatic rollback or billing cancellation.
7. Qualify the final combined release through the regular PR process. No merge,
   production migration or deployment follows automatically from the inventory PR.
