# Mobile/PWA Visual QA v1.7.3

## Source-level parity checks

PASS:
- Authenticated topbar hidden at <=760 px.
- No permanent mobile logo/avatar in authenticated shell.
- Floating pill navigation remains Start / Kunden / Neu / Zeit / Profil.
- Quick Create and Profil remain bottom-sheet surfaces.
- Mobile shell background contract remains exact white in Light Mode and exact black in Dark Mode.
- Mobile list/detail/form hierarchy remains owned by the canonical final stylesheet.
- Desktop >=761 px rules were not modified by this release.

## Runtime browser regression

NOT EXECUTED in this isolated environment. The project dependency graph cannot be installed because external package-registry access is unavailable and the available runtime is Node.js 22 instead of the required Node.js 24. Runtime visual QA at 375 / 390 / 393 / 430 px, short-height, landscape and standalone PWA remains a required local/CI gate before production deployment.
