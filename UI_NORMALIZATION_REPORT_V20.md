# Binso Admin V20 – Focused UI Normalization Report

## Scope

Focused correction pass on the existing V20 canonical architecture. No redesign and no parallel UI architecture were introduced.

## 1. Footer component changes

- Added `components/ui/action-footer.tsx`.
- `ActionFooter` / `SheetFooterActions` is the shared geometry owner for two-action footers.
- `StandardFormSheet` now routes its footer through the shared action footer.
- `ConfirmationDialog` uses the same action footer.

## 2. Mobile stacking rule removed

- Removed the `max-width: 420px` rule that stacked `.app-sheet-actions` into one column.
- Standard two-action footers remain two equal columns from 320 px upward.

## 3. Final button sizes

- Default business button: 40 px visual height.
- Mobile sheet action: 42 px visual height.
- Compact button variant: 34 px.
- Secondary action stays left; primary/destructive action stays right.

## 4. Final toggle dimensions

- Track: 36 × 20 px.
- Thumb: 14 × 14 px.
- Travel: 16 px.
- Setting rows remain at least approximately 48–52 px high so touch accessibility is carried by the row, not by an oversized switch.

## 5. Light toggle tokens

Defined centrally in `app/globals.css`:

- `--switch-track-off`
- `--switch-track-on`
- `--switch-track-disabled`
- `--switch-thumb`
- `--switch-border`
- `--switch-focus-ring`

## 6. Dark toggle tokens

Dark mode defines explicit switch tokens instead of relying on generic surface colours.

## 7. OFF-state contrast improvements

- OFF track now has a dedicated visible neutral tone.
- Border is explicit.
- Thumb stays clearly visible.
- Dark mode no longer renders the OFF switch as dark grey on nearly black with insufficient separation.

## 8. Button contrast improvements

- Secondary buttons use the elevated surface plus a visible border.
- Destructive action has a dedicated destructive variant.
- One canonical focus ring token is used for buttons and common controls.

## 9. Toast standardization

- Added global `FeedbackProvider` and `useFeedback()`.
- Added one canonical toast viewport with success/info/warning/error categories.
- Toasts are compact, safe-area aware, and positioned below the mobile header.
- Settings, quotes, time, invoices and push settings no longer use their former local success-notice patterns for routine feedback.

## 10. Save behaviour

- Shared footer geometry prevents width changes between normal and busy states.
- `aria-busy` styling supports a centered spinner without resizing the button.
- Existing form business logic remains unchanged.

## 11. Cancel behaviour

`StandardFormSheet` now owns close/cancel handling. If no field was changed it closes immediately.

## 12. Unsaved changes behaviour

- `StandardFormSheet` tracks input/change events centrally.
- Closing a dirty form opens the shared confirmation:
  - `Weiter bearbeiten` on the left.
  - `Verwerfen` on the right.
- Backdrop, Escape and the standard cancel button flow through the same close request.

## 13. Delete confirmation behaviour

- Added `ConfirmationDialog` using `ResponsiveOverlay` + `ActionFooter`.
- Invoice cancellation was migrated away from native `window.confirm`.
- Destructive emphasis is applied only to the destructive action.

## 14. Validation behaviour

Existing field-level validation remains in place. This pass did not replace business validation rules or move them into toasts.

## 15. Settings rows updated

- Settings remain clean row-based controls with separators.
- Toggle visual size is reduced while row interaction remains comfortable.
- Clicking the non-button area of an enabled toggle row changes the setting without nesting interactive buttons.

## 16. Architecture guardrails updated

`architecture-check.mjs` now additionally rejects page-level custom toast/confirmation/footer geometry and custom toggle geometry. Added `ui-normalization-check.mjs` and package script `check:ui`.

## 17. Light mode test results

Static token and component checks pass. Browser visual regression could not be executed because dependencies are not installed in this environment.

## 18. Dark mode test results

Static dark token checks pass. Browser visual regression could not be executed because dependencies are not installed in this environment.

## 19. Mobile test results

Static checks confirm:

- two footer actions stay side-by-side,
- mobile action height is 42 px,
- switch is 36 × 20 px,
- safe-area-aware toast placement exists,
- no 420 px footer stacking override remains.

Real browser/PWA keyboard and viewport screenshots still require installed dependencies and browser test tooling.

## 20. Remaining exceptions / verification limits

- `npm install --package-lock-only` timed out in the execution environment.
- Local `node_modules` are absent.
- `release-check.mjs` cannot import local `typescript` without installed dependencies.
- Global `tsc --noEmit` therefore reports missing React/Next type packages and cannot serve as a valid project typecheck.
- Production build, lint, browser visual regression and real PWA keyboard testing are **not claimed as passed**.

## Verified static checks

- Architecture check: **44 passed**.
- Canonical sheet migration check: **21 passed**.
- Focused UI normalization check: **20 passed**.
- Static E2E wiring audit: **74 passed**.
- Local import resolution: **0 missing local imports**.
- CSS structural check: **balanced braces in all active CSS files**.
