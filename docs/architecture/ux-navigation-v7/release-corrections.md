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
