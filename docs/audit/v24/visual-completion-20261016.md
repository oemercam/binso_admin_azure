# ZIP foundation completion — 2026-10-16

The owner-supplied ZIP remains unchanged. The implementation extends its Microsoft
variant, with the documented file picker, ring alignment and frozen bottom dock.
Missing full-page originals, including operator pages, are derived from its shared
components. They are not silently classified as original-approved screens.

## Causes and shared corrections

- Operator responsive CSS also selected customer `.page-container` descendants.
  This restored rounded cards, inset surfaces and old field styling on mobile.
  Remove that cross-owner block and forbid this selector in the architecture check.
- Metric, settings and workflow owners retained independent card geometry. Use
  open sections, shared type and spacing, and the common metric/currency component.
- The create action had only the mobile circular treatment. Restore the labelled
  desktop action while retaining the original mobile button and navigation.
- Desktop records controls inherited the mobile filter-only treatment. Share the
  same controller between desktop search/filter/sort and the mobile filter sheet.
- Invoice/offer, payment and expense creation bypassed FormSheet. Route creation
  through it, retaining real writes, recovery, validation and deduplicated retries.
- Demo operator dashboards and payments had separate presentation trees and
  decorative figures. Reuse the operational components; show unavailable figures
  as unavailable rather than inventing values.
- Public product screenshots embedded the preceding interface. Replace the twelve
  images with actual isolated browser captures and content-addressed URLs.
- Nested portal sheets now consume only their own input and dismissal events.
  Cancelling a position must not dismiss its parent document draft.
- Payment source hydration preserves already typed amounts and dirty notes. Error
  feedback persists until another attempt; old timeout callbacks cannot erase a
  newer failed/lost-response result. The delayed-lookup and cross-tab ledger tests
  verify these cases without production writes.

## Rendered evidence

The local review `outputs/BINso-UX-Gesamtvergleich.html` begins with original and
actual login/customer list/customer detail at 1440 and 390 px, equal content widths
and comparable synthetic data. It then contains the remaining captured route views,
with direct mobile originals where available and explicit derivation labels elsewhere.
Original source files are never rewritten to make comparisons pass.

The complete light browser matrix passed 170 route/viewport combinations. Focused
narrow/tablet dark coverage passed 20 combinations. These assertions cover layout,
overflow, typography contracts and access to shared controls; they do not constitute
automatic visual approval. Full workflow and release evidence must pass separately
before promotion. The existing development release profile remains unchanged.

Build (webpack), type checking, changed-file lint, shared foundation/navigation,
CSS ownership, localization and actual document/PDF presentation checks passed.
Browser interactions are recorded separately from the static inventory.

The shared browser harness waits for the actual startup surface and domain data,
then measures each overview in one DOM snapshot. Action counts follow the explicit
owner/admin, finance and employee fixtures. Frame settling handles background tabs
centrally and has a bounded fallback; screenshot and geometry assertions remain
separate. Customer recovery waits for the unrelated duplicate lookup to finish
before reloading, rather than ignoring WebKit page errors.

## Future work rule

Use the page patterns in `docs/architecture/reference-foundation.md`. Extend the
owning shared component and stylesheet when a pattern needs another state. Do not
restore route overrides or duplicate operator/demo variants. Keep the independent
navigation and original-reference hash checks enabled.
