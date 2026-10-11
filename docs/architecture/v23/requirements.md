# V23 Anforderungs- und Prüfinventar

Vollständige Felder (Dateien, Methode, Erwartung, Ergebnis, Nachweis): `requirements.json`. Status bezeichnet den tatsächlichen Nachweisumfang.

| ID | Anforderung | Status | Tatsächlicher Stand |
| --- | --- | --- | --- |
| V23-A-001 | Current repository and live commit | verified | main=live=e33af01; main CI/deploy green |
| V23-A-002 | Open PRs and concurrent work | verified | 237 diverged 10 ahead/20 behind; 231/222 reviewed as existing independent work |
| V23-A-003 | Azure resources and readiness | blocked | App/DB present; storage/Insights/alerts absent; security checks fail |
| V23-B-001 | Complete source inventory | verified | 14 views; 20 endpoints; 9 workflows; 2504 element occurrences; no full business acceptance inferred |
| V23-C-001 | Frozen navigation and More | verified | Markup identical; navigation-foundation passes |
| V23-C-002 | Shared UX foundation | implemented_pending_ci | Existing six CSS files and 760px breakpoint reused; browser CI pending |
| V23-D-001 | Chart architecture | implemented_pending_ci | Statistics/CashStatistics kept; one new measured hourly time-series component shared by portal/wallboard; no dependency added |
| V23-D-002 | No fabricated charts | implemented_pending_ci | Measured hourly vital p75; empty state and missing-hour gaps; no fabricated uptime/history |
| V23-D-003 | Chart loading/error/permission/unavailable | implemented_pending_ci | Loading/error handled centrally; unavailable/stale empty plot; permission-masked business metrics |
| V23-E-001 | Monthly subscription value | verified | 1200 CHF yearly contributes 100 CHF/month; label explicit |
| V23-E-002 | 30-day payments | verified | Dashboard uses today-29; today-30 excluded; monitoring uses same window |
| V23-E-003 | Customer activation/status/profile/subscriptions/history | partially_verified | Rendering/API/database paths recorded; full operator mutation/provider matrix not yet proven. No production mutations performed. |
| V23-E-004 | Payments/invoices/subscriptions/refunds/exports | partially_verified | Rendering/API/database paths recorded; full operator mutation/provider matrix not yet proven. No production mutations performed. |
| V23-E-005 | Internal users/roles/config/notifications/audit | partially_verified | Rendering/API/database paths recorded; full operator mutation/provider matrix not yet proven. No production mutations performed. |
| V23-E-006 | Restrictions/reactivation and audit atomicity | partially_verified | Rendering/API/database paths recorded; full operator mutation/provider matrix not yet proven. No production mutations performed. |
| V23-F-001 | Shared monitoring contract | verified | Typed aggregate contract; null is Unknown; read-only repeatable snapshot; 120s stale |
| V23-F-002 | Azure Monitor/Insights/Log Analytics | blocked | No Insights/alerts/action groups in observed group; no authenticated control-plane; Azure metrics unavailable |
| V23-F-003 | Application telemetry completeness | partially_verified | Worker uptime, measured snapshot/SQL durations, logged application events, queue counts, vital history available; full request/error/auth streams absent |
| V23-F-004 | Business process telemetry | partially_verified | Accounts/subscriptions/payments/past_due/webhook failures measured; failed signup/invoice streams unavailable |
| V23-F-005 | Deployment telemetry | partially_verified | Worker SHA present; live deployment history not integrated; no success inferred from SHA |
| V23-G-001 | All monitoring sections | implemented_pending_ci | Overview, infrastructure, app/API, DB, jobs, integrations, events, security, deployments, alarm centre, history rendered |
| V23-G-002 | Central health states | verified | Explicit states; unknown, stale, future timestamps and denied data fail closed |
| V23-G-003 | Alarm boundaries/dedup/recovery | verified | Local rule evaluation; mail/billing failures; rule key dedup; fresh 0 recovers |
| V23-G-004 | Persistent alerts/owners/escalation | decision_required | Not activated; owners/escalation unset; no messages sent; no persistent acknowledgement history |
| V23-H-001 | Authenticated standalone wallboard | implemented_pending_ci | Server requireOperatorSession and authorizeOperator; positive/negative CI pending |
| V23-H-002 | Profiles, fullscreen, themes, responsive | implemented_pending_ci | Implemented; no personal details; native fullscreen with truthful unsupported state |
| V23-H-003 | Refresh and connection status | implemented_pending_ci | Existing hook reused; timestamp+offline/error/stale labels; CI pending |
| V23-I-001 | Monitoring privacy/role boundaries | verified | Aggregate-only; financial/audit metrics masked; no new grants |
| V23-I-002 | Production DB privileges/RLS | blocked | Check fails for binsoadmin; production role change explicitly requires approval; PR237 contains separate remediation |
| V23-I-003 | Production Entra boundary | blocked | Latest readiness fails; no production authentication change attempted |
| V23-I-004 | Administrative audit and races | partially_verified | Existing routes audited in source; exhaustive concurrency/audit-failure scenarios unresolved; avoid unreviewed workflow replacement |
| V23-J-001 | Quality gates | implemented_pending_ci | Local suite in progress; PR CI pending; no assertions/gates disabled |
| V23-J-002 | Physical device/PWA acceptance | partially_verified | Responsive/PWA automated tests retained; physical kiosk/27–55 inch devices unavailable |
| V23-K-001 | Evidence-driven cleanup | verified | Old MonitoringCockpit/MonitoringView implementation removed after caller check; wrapper reuses one MonitoringPanel; no unrelated legacy deletion |
| V23-L-001 | Feature branch/PR/release controls | pending_review | Feature branch from e33af01; no migrations; merge/deploy awaiting explicit approval |
| V23-L-002 | Post-deployment verification | not_started | V23 not deployed; cannot claim post-release success |
| V23-M-001 | Traceable acceptance report | partially_verified | Partial verified implementation; blockers and decisions remain explicit |
