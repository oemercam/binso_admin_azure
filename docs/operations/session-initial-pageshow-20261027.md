# Initial pageshow session check — 27 October 2026

Main Quality run 40480271481 initially observed two auth requests during the
close/reopen startup measurement instead of one. Its targeted unchanged rerun
passed. The CI observation alone does not identify which browser event caused
the duplicate.

A deterministic regression against the actual session watcher demonstrates a
separate concrete duplicate: the normal first `pageshow` can arrive while the
initial authoritative read is pending and queue an unnecessary second read.
Only a persisted `pageshow` represents a back/forward-cache restoration. The
watcher now distinguishes those events. Initial validation, genuine cache
restoration, focus, visibility, online, cross-tab invalidation, periodic checks,
expiry, offline handling and pending-event follow-ups remain enforced.

The startup browser harness foregrounds a new blank page before measurement and
settles the previous page's network requests before close/reopen. This separates
foreground setup and previous navigation from the new startup observation. The
one-request assertion remains exact. Partial measurement evidence is saved before
assertions so a future failure retains its observations.

Focused session lifecycle tests execute the actual watcher and tenant/operator
effects. Cases cover both normal and persisted pageshow during a pending read,
cache-return expiry and listener cleanup. Full browser evidence remains required
in Quality; this change is not physical-device or commercial acceptance.
