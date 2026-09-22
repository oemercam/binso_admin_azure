# Binso Admin V20 — Canonical Overlay Migration Report

Date: 2026-09-22

This report covers the completion of the V20 bottom-sheet/form-sheet migration. The implementation intentionally reuses the existing centralized architecture instead of adding a parallel component family or a final CSS override layer.

## 1. All migrated files

Core architecture:

- `components/ui/sheet-system.tsx`
- `components/ui/overlay-manager.ts`
- `components/ui/responsive-overlay.tsx`
- `components/documents/responsive-preview.tsx`
- `components/providers/device-environment-provider.tsx`
- `components/navigation/mobile-pill-nav.tsx`
- `components/shared/app-overlays.tsx`

Business modules:

- `app/(app)/customers/page.tsx`
- `app/(app)/employees/page.tsx`
- `app/(app)/orders/page.tsx`
- `app/(app)/orders/[id]/page.tsx`
- `app/(app)/quotes/page.tsx`
- `app/(app)/invoices/page.tsx`
- `app/(app)/accounting/page.tsx`
- `app/(app)/time/page.tsx`
- `app/(app)/settings/page.tsx`

CSS / guardrails / tests:

- `app/globals.css`
- `app/ui-foundation-v19.css`
- `scripts/architecture-check.mjs`
- `scripts/sheet-migration-check.mjs`
- `scripts/e2e-audit.mjs`
- `QA_CHECKLIST.md`
- `TEST_PLAN.md`
- `package.json`

20 standard form-sheet usages now use the canonical `StandardFormSheet` API.

## 2. Legacy sheet classes removed

Verified active CSS count is zero for:

- `.form-sheet`
- `.standard-mobile-sheet`
- `.sheet-layer`
- `.sheet-heading`
- `.sheet-actions`
- `.sheet-grabber`
- `.mobile-fullscreen-sheet`

The legacy classes were also removed from all business page markup.

## 3. Remaining legacy occurrences and justification

No production business-page or active CSS occurrence remains.

The literal legacy names remain only inside architecture/guardrail scripts where they are intentionally listed as forbidden patterns, and in historical documentation where they describe the previous implementation.

Canonical class names such as `.app-sheet-actions` and `.app-sheet-grabber` are not legacy classes; they belong to the active AppSheet component system.

## 4. StandardFormSheet API changes

The canonical API now accepts:

- `open`
- `title`
- `description`
- `onClose`
- `onSubmit`
- `children`
- `footer`
- `mode`
- `loading`
- `formId`
- optional semantic `panelClassName`

`StandardFormSheet` internally owns the form element and delegates presentation to `AppSheet`.

## 5. rawContent usages removed

`rawContent` has been removed from `AppSheet` / `StandardFormSheet` and has zero production code usages.

Invoice builder and payment selection were migrated to `ResponsiveOverlay` instead of using `AppSheet rawContent`.

## 6. Scroll ownership implementation

Canonical structure:

`AppSheet -> Header -> AppSheetContent -> Footer`

Only `.app-sheet-content` owns normal vertical scrolling.

- root: `display:flex; flex-direction:column; overflow:hidden`
- content: `flex:1 1 auto; min-height:0; overflow-y:auto`
- header/footer: `flex:0 0 auto`

## 7. Footer implementation

Footer is outside the form scroll region and uses normal flex layout rather than `position:sticky`.

Standard forms use stable form IDs. Footer submit buttons use `type="submit" form="..."`, so the footer does not need to be placed inside the scrolling form DOM.

## 8. Safe-area implementation

Safe-area ownership remains centralized through the existing global tokens. Canonical footer padding includes `var(--safe-bottom)`. Fullscreen sheet headers include the top safe area on mobile/PWA.

No business page contains page-specific safe-area calculations.

## 9. VisualViewport implementation

`DeviceEnvironmentProvider` now exposes:

- `layoutViewportWidth`
- `layoutViewportHeight`
- `visualViewportWidth`
- `visualViewportHeight`
- `visualViewportOffsetTop`

It observes window resize, orientation change, VisualViewport resize and VisualViewport scroll, with proper listener cleanup.

The provider writes one canonical set of CSS viewport tokens:

- `--app-layout-viewport-width`
- `--app-layout-viewport-height`
- `--app-visual-viewport-width`
- `--app-visual-viewport-height`
- `--app-visual-viewport-offset-top`

Legacy `--app-vh` / `--visible-viewport-height` sheet sizing was removed.

## 10. Keyboard behaviour

The canonical sheet uses the current VisualViewport height and one internal scroll region. Browser focus scrolling remains responsible for bringing inputs into view; inputs are not manually translated.

Real iOS/Android keyboard validation still requires browser/device testing and is not claimed as passed in this environment.

## 11. Breakpoint consolidation

Architecture guardrails confirm that legacy `760/761px` sheet breakpoints are absent. Responsive presentation continues to use the centralized 820/821 boundary.

Business pages contain no page-specific sheet breakpoint.

## 12. ResponsivePreview changes

`ResponsivePreview` remains a specialized document presentation system.

It now uses the shared overlay/scroll-lock manager and has explicit fixed regions:

- preview toolbar
- `document-preview-content` as the preview scroll region
- optional preview action footer

Mobile/PWA presentation remains fullscreen; desktop remains a controlled large presentation.

## 13. Overlay primitive / scroll-lock changes

Added `components/ui/overlay-manager.ts` as the single modal scroll-lock / focus-management owner.

It provides:

- document scroll locking
- nested overlay lock depth
- Escape handling
- focus entry
- focus trap
- focus return

`AppSheet` and `ResponsivePreview` both use this manager.

Global search and quick-create now use `ResponsiveOverlay`; they no longer create raw backdrop/dialog structures.

## 14. CSS blocks removed

Historical sheet geometry selectors were removed from both `globals.css` and `ui-foundation-v19.css`.

Dead CSS for the old raw `overlay-layer` / `command-dialog` implementation was also removed after global search migrated to `ResponsiveOverlay`.

One canonical responsive overlay block remains in `ui-foundation-v19.css`.

## 15. !important rules removed

The canonical AppSheet implementation contains zero `!important` declarations.

Unrelated historical UI rules may still contain `!important`; they were not rewritten as part of this structural migration unless they owned sheet/overlay geometry.

## 16. Architecture guardrails added

`architecture-check.mjs` now fails on:

- rawContent in business pages
- direct AppSheet use in business pages
- legacy sheet classes in business pages
- page-specific viewport/safe-area sheet geometry
- direct page `visualViewport`
- direct page DOM/window infrastructure
- non-central body scroll-lock
- active legacy sheet CSS
- old viewport variables
- sticky canonical sheet header/footer
- multiple `.app-sheet` root implementations

`scripts/sheet-migration-check.mjs` additionally validates the canonical StandardFormSheet API and scroll model.

## 17. Test results

Passed:

- Architecture check: 37 rules
- Canonical Sheet migration check: 21 checks
- Static E2E audit: 67 checks
- Release source check: 82 TS/TSX files
- CSS parsing: 0 parser errors in `globals.css`, `ui-foundation-v19.css`, `documents.css`

## 18. Build result

Not verified.

The repository does not contain installed dependencies and dependency installation timed out in the current execution environment. A Next.js production build could therefore not be run reliably.

## 19. Lint result

Not verified for the same dependency-install reason.

## 20. Typecheck result

Full project typecheck is not verified because React/Next type packages are not installed in the working repository.

A TypeScript source-level release check using the available global TypeScript installation passed for syntax, local imports and named exports across 82 TS/TSX files.

## 21. Visual regression result

Not executed. No browser/Playwright environment with an authenticated application session is available in this workspace.

The required viewport and behaviour matrices were added to `QA_CHECKLIST.md` and `TEST_PLAN.md`. Production release must still capture/review screenshots at the required viewport sizes.

## 22. Remaining known issues

1. Full `npm install`, lint, Next.js production build and TypeScript typecheck must run in the real project CI environment.
2. Real iOS Safari / installed PWA keyboard behaviour must be validated on-device or through an appropriate browser test environment.
3. Visual regression screenshots remain a release gate.
4. Historical architecture documentation still references legacy class names for documentation purposes; active runtime code/CSS does not use them.

No additional parallel sheet component or final override CSS architecture was introduced.
