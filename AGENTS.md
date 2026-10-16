<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# BINso One — binding product and UI rules

The user's original ZIP in docs/audit/v24/reference/ is the binding visual source.
Read IMPLEMENTIERUNG.md and docs/architecture/reference-foundation.md before UI work.
The original Microsoft variant wins over historical Flow, Noir, Apple, grey or
permanent-toolbox instructions. Historical audit reports are evidence, not rules.

- app/design-system/manifest.json declares the ordered CSS owners. There is no
  fixed stylesheet count. Base, states and responsive rules share a component owner.
- Reuse the design-system components for headings, controls, lists, sheets,
  feedback and charts. Extend the common owner for reusable requirements.
- No route-local CSS, JSX style blocks or literal inline presentation. Dynamic
  measurements may pass CSS custom properties into the owning component.
- New pages must follow a documented page pattern and include loading, empty,
  error, read-only, keyboard and narrow-screen states. Mark missing reference
  screens as derived in the review; never silently call them original-approved.
- Preserve real APIs, authentication, roles, financial calculations and files.
  Reference data is allowed only in isolated test fixtures, never tenant data.
- The owner instruction of 2026-10-16 replaces the earlier frozen-navigation
  exception. Use the ZIP white edge-to-edge navigation with persistent labels and
  blue selection; no glass or floating dock. Preserve destinations and permissions.
  The explicit v3 contract and adversarial tests protect the replacement.
- Compare original and actual login/list/detail at equal content widths first.
  Then cover every route family and operator variant with rendered evidence.
- During work use qa:fast and focused tests; run the coherent browser matrix after
  relevant changes. A green build or static inventory is not visual acceptance.
- Keep incomplete work in a draft PR. Never disable failed gates, silently accept
  new screenshot baselines, or deploy production without explicit authorization.
