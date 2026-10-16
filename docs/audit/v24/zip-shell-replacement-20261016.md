# ZIP shell replacement, 16 October 2026

The owner explicitly requires that no old UX remain. This supersedes the prior
exception retaining the existing bottom navigation. The original ZIP files stay
unchanged as evidence; the newer instruction is recorded in AGENTS.md, the active
UX contract and navigation-contract.v3.json.

The previous deployment retained a glass dock, multiple responsive boundaries
(760/1100 px) and the old document header/facts arrangement. At a 1065 px browser
width this produced mobile navigation/header together with a desktop document
table. A successful deployment and functional checks did not establish ZIP parity.

The replacement uses an opaque edge-to-edge navigation with persistent labels,
blue selection, no floating capsule, blur, shadow or scroll shrinking. Destinations,
permission conditions, document calculations, APIs and document/PDF rendering are
preserved. Business/navigation fingerprints were extracted from the pre-change
commit with only obsolete compact styling excluded; no screenshot baseline is
automatically refreshed.

One product boundary governs shell, lists, fields, sheets and details: mobile up
to 1023 px; desktop header and expandable sidebar from 1024 px. Interactive code
uses lib/client/layout.ts. CSS and the shared helper are guarded by independent
contract checks. Conflicting tablet branches and 119 superseded declarations or
blocks were retired. Page, header and navigation consume the same ZIP palette.

Invoice and offer detail share DetailFacts and their existing domain renderer.
Their single status belongs to the customer row; actions use the shared menu.
Draft editing remains permission-aware. Section typography follows the shared
body role rather than the previous oversized headings. Missing offer desktop and
admin originals remain derived views, not silently approved mockups.

Validation records are stored in the local ZIP comparison and the corresponding
GitHub workflows. Rendered routes cover narrow, 1065 px and wide layouts; navigation
assertions require a visible desktop shell and reject hybrid layouts. Additional
interaction tests cover document actions, headers, creation, focus and permissions.
Neither static assignment nor a passing build grants physical-device or complete
pixel approval. The existing development release scope is unchanged.
