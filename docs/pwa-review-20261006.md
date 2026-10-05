# PWA screenshot review — 6 October 2026

Based on IMG_9612–IMG_9621 and main commit 4d264ad4b6262ccaed7ce05149c4f8e450df9770.

- Scale the generated Swiss QR SVG using its full 210 × 105 mm viewport; preserve its payment payload and all child coordinates.
- Provide a toggle between fitted and enlarged document previews. Account for the top safe area in the preview toolbar.
- Hide the mobile bottom navigation on creation routes and while editing documents. Ask before following links with unsaved form changes; register the browser unload warning. Browser history gestures and iOS process termination are not covered by this guard.
- Buffer mobile line edits until Apply; Cancel, backdrop and Escape leave the document unchanged. Keep dialog focus inside the line editor and restore its trigger.
- Use shared form label sizing, left-aligned native date/time values and a single focus indicator. Format document VAT to two decimal places without changing stored rates.
- Keep sheets within the visual viewport when a keyboard is open. Scroll long field content and keep the line/time editor action rows separate.
- Resynchronize theme-color metadata after route metadata replacement. The existing default Apple status bar setting remains; its physical-device behavior needs verification.
- Shorten privacy copy, soften bottom navigation shadow, compact payment confirmation, translate known payment method codes and put ticket subjects first.

Validation: existing automated suite, QR SVG regression, CSS architecture, TypeScript, lint and production build. Physical iPhone PWA keyboard, status bar, pinch zoom and history gesture testing remains necessary. Browser binaries could not be installed in this environment, so no visual browser acceptance is claimed. Document sharing continues to share the current URL; this change does not add a PDF export service.
