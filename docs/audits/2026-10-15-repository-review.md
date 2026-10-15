# Repository review — 2026-10-15

Baseline: main `03929b80c27310aa95d7c12e0eb695aa55897e13`.

## Scope and evidence

Static dependency inventory: 439 modules, 72 page routes, 13 operator variants; no local static runtime import cycles or unreferenced component candidates. Runtime styles: six ordered files, 6,030 lines, 438 used classes and 17 canonical media blocks. Reviewed authentication/session boundaries, HTTP helpers, file validation/scanning/storage, query construction and tenant contexts, external service deadlines, security headers, CSS cascade contracts, packaging and CI/deployment trust boundaries. This is a source review plus automated regression evidence, not a proof that every runtime state or production configuration is correct.

## Corrections

- CSRF origins use configured runtime APP_URL (with the existing public setting as fallback) and Next request origin. Forwarded host/protocol headers cannot add arbitrary trusted origins. Unconfigured local servers retain actual Host support because Next normalizes loopback URLs. The isolated HTTP test explicitly configures its canonical origin.
- JSON headers now support every HeadersInit form. Rate-limit responses preserve numeric Retry-After without leaking other internal Response headers.
- Storage token acquisition, upload, download and deletion have 20-second deadlines and reject redirects rather than following credential-bearing requests.
- Offers, finance, projects, invitation/email-verification and portal authentication pages receive private no-store/noindex headers.
- CSS architecture gate verifies exact top-level import order and rejects reordered/duplicated imports. No blanket CSS rewrite: no duplicate properties within individual source rules were found; responsive/theme overrides and progressive fallbacks remain intentional.
- Checkout steps disable persisted credentials. Production deployment has a 45-minute job timeout. Existing SHA-pinned actions, minimal permissions, OIDC, exact-current-main artifact promotion, frozen lockfile, PostgreSQL isolation tests and Chromium/WebKit gates remain enforced.
- Scanner startup refreshes and validates signature files before launching clamd, avoiding the observed concurrent update/daemon-start race where NotifyClamd runs before the socket exists. Metadata diagnostics distinguish engine startup from protocol/version/signature qualification.
- Regenerated the source architecture fingerprint and route inventory after code/test changes.

## Validation and boundaries

Local production compilation, lint, typecheck, CSS architecture, release gates and complete test suite were exercised. This execution host denies listening on Unix sockets; local scanner protocol tests therefore used the repository's explicit in-memory duplex transport. Real sockets, PostgreSQL HTTP authorization, actual ClamAV and both browser engines are verified by GitHub Quality, not claimed from the local substitute.

Production dependency audit: no known advisories. Full audit retains the existing exact development-only braces GHSA-vfj7-8cjw-p6xm exception, expiring 2026-10-24; the registry reports no patched version. No extension or widening of that exception was made.

The existing prelaunch release profile remains development-20261012. Live scanner activation/rescan, full ingress spoof proof, historical data/performance review, physical PWA acceptance and alarm delivery remain separately deferred evidence in the recorded release scope. This review does not upgrade those items to production acceptance.

Final GitHub checks, deployment and live SHA verification must be read from the PR and deployment run for the merged commit.
