# Binso Admin v18.5 – Close control alignment

All visible close controls now use one optical alignment rule:

- 44 × 44 px minimum touch target.
- 18 px visible close glyph.
- The visible `X` aligns to the same right content edge as rows, fields and actions below it.
- Sheet/editor headers use a consistent two-column grid.
- Mobile navigation, full-screen editors, document previews and popovers share the same geometry.
- Mobile bottom sheets keep their native convention: the redundant `X` stays hidden; backdrop/drag interaction remains the close affordance.

The final override lives in `app/close-alignment-v18-5.css` and is intentionally imported last in `app/layout.tsx`.
