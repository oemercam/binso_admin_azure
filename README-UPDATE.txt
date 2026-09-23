Binso Admin V20 - Current Full V45

V45 fixes the V44 validation errors without changing the approved UX.

Fixed:
- employees page imports useMemo correctly
- duplicate searchParams declaration removed
- employee filtering remains scoped by company
- unused customer-detail CHF helper/import removed

No visual changes:
- Mobile/PWA compact two-line lists remain unchanged
- Kontakte -> Firma -> Geschäftsvorgänge product model remains unchanged
- navigation, spacing, KPI geometry, sheets and overlays remain unchanged

Run:
npm run typecheck
npm run lint
npm run architecture:check
npm run actions:check
npm run process:check
npm run mobile-ui:check
npm run build
