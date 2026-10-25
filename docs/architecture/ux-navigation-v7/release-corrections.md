# V7 release preparation — 25 October 2026

PR #318 initially tested head `366ee01bf7e64aae59b1433c62d66a3c0207d6ee`.
The owner approved that exact head for merge and an identical-content Main
deployment after all mandatory gates, using the existing development profile.
It has not been merged or deployed: required gates identified these corrections.

- CodeQL #42: the local loading-test HTTP fixture allowed an absolute incoming
  request target to replace its otherwise loopback-validated upstream. Forwarding
  now takes hostname/port exclusively from the configured local upstream and only
  path/query from the request. An executed HTTP countertest covers relative,
  absolute and protocol-relative targets, requiring three upstream responses and
  zero requests at the alternative listener. No scanner exclusion or dismissal.
  CodeQL confirmed the original thread resolved. Its subsequent #43 finding in
  the new countertest server is also corrected: the server returns fixed text;
  requested paths are captured separately and asserted without reflecting them
  into HTTP output. The same forwarding and zero-foreign-request checks remain.
- Startup geometry: the probe still required a page animation removed by the
  approved V7 presentation. It now samples actual animation-free frames; its
  separately injected historical ancestor animation must still reproduce a jump
  exceeding 100 px. The fixture uses long content so that this negative remains
  meaningful with the current minimum page height. All twelve viewport/theme/
  customer/Admin cases pass in both local Chromium and WebKit. The complete
  compliance measurement countertests also pass in both engines.
- Narrow tablet tables: CI exposed horizontal overflow at 761/768 px in customer
  offer and Admin directories after card insets reduced the usable width. The
  existing shared `recordGrid` lets the identity column shrink instead of forcing
  an extra 180-px minimum. Secondary column minima and existing row/data behavior
  remain unchanged. The four failing route families pass sixteen local WebKit
  route/width/theme combinations on the corrected production build; the full
  102-route Chromium matrix at both boundary widths passed all 408 combinations.

The corrected production build, selected fast QA, focused lint, documentation
consistency and release resolver passed locally. The countertest-only follow-up
preserves application source bytes; its own executed HTTP regression, focused
lint and regenerated architecture contracts are checked separately. Fresh CI
status for the final SHA must be checked before approval and promotion.

Initial CI Linux tests, dependency/security checks, build, artifact smoke,
authenticated HTTP checks and actual scanner qualification succeeded. Those
results do not qualify a later head. The corrected head needs fresh GitHub gates
and new exact-SHA owner approval; the earlier approval does not transfer.
Physical iPhone/iPad, full role/language/legal acceptance and the documented
intermittent WebKit startup observation remain open. No new migration or workflow
change is included. No production deployment is asserted by this report.

## Browser harness follow-up after approved a56def1b

Quality run `40204371870` passed Linux tests, security/scanner qualification,
build, both functional lanes and four responsive lanes. One Chromium lane
observed a transient unmeasurable mobile project heading; the geometry contract
now waits for a visible heading and measures visibility/size/centering atomically,
preserving the 1.5-px tolerance. Customer hub checks similarly wait for their
actual eight-row owner rather than treating network idleness as a React commit.

Another WebKit lane exposed repeated hard navigations inside the customer state
fixture. This was reproduced locally with the iPhone 13 engine profile: a prior
document's RSC prefetches emitted access-control page errors during `page.goto`
scenario resets. The existing central fresh-document scenario reset is now also
used inside this helper. Held/read-only fixture routes are installed on the new
page after closing the old scenario, avoiding interference with old prefetches.
Actual contact links, retry, read-only denials, editors and all other application
Link navigation remain real transitions. Runtime error assertions remain active;
no error filtering, retry loop or timeout increase is added.

The first context-wide held-fixture attempt stalled old prefetch requests and
was discarded in favor of page-scoped setup after the reset. Failed logs remain
private QA evidence. The original compliance report recorded zero failed checks
but lacked Chromium evidence for `/belege`, `/preview/zeit` and `/vertraege`
because a responsive lane exited early. These missing cases are not passes.
Local corrected customer flows now pass in both themes with the iPhone 13 WebKit
profile (four matrix cases plus the complete customer interaction domain, zero
runtime errors). The project title passes twelve Chromium cases across all six
mobile reference widths and both themes, including compliance measurements.
These local checks do not replace all mandatory fresh CI gates.
This follow-up changes tests/documentation only, with unchanged application and
migration source relative to approved `3aa8b4c1` / `a56def1b`.
