Binso Business Platform - V51 Validation Hotfix

V51 fixes the validation issues found after V50 without changing the approved UX.

Fixed:
- restored ROLE_GROUPS export required by existing protected route layouts
- kept backwards-compatible role aliases for current route guards
- removed synchronous setState from the membership effect
- membership/permission resolution remains organization-aware without causing cascading renders
- SaaS product check now verifies both regressions

No visual changes:
- Mobile/PWA compact two-line lists unchanged
- Dashboard/KPI layout unchanged
- Bottom pill unchanged
- sheets/overlays unchanged
- Contact -> Company -> Business objects model unchanged

Run:
npm run typecheck
npm run lint
npm run architecture:check
npm run actions:check
npm run process:check
npm run mobile-ui:check
npm run saas:check
npm run saas:product-check
npm run build
