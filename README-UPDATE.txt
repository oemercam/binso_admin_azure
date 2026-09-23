Binso Business Platform V54

V54 fixes the remaining React/ESLint validation findings from V53.

Fixed:
- onboarding no longer calls setState synchronously inside useEffect
- localStorage hydration is deferred through queueMicrotask with cancellation guard
- current organization/company profile/document templates/app settings are memoized
- BusinessStore useMemo dependencies are complete and stable
- platform regression checks cover these fixes

No UX changes:
- approved Mobile/PWA lists unchanged
- Dashboard and KPI layout unchanged
- Bottom Pill unchanged
- Platform Admin, Pricing, Registration and Onboarding layout unchanged

Run:
npm run typecheck
npm run lint
npm run architecture:check
npm run actions:check
npm run process:check
npm run mobile-ui:check
npm run saas:check
npm run saas:product-check
npm run platform:check
npm run build
