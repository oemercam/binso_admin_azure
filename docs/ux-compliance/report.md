# Binso One UX Compliance 1.0.0

Source: `b398ff7400eb1b2ea90016c25e596261d58c822b`; digest `033b96962b960931c4329a76f0e5f919f5dd09663b03fa036e45d887c6bf8de8`. Baseline `b398ff7400eb1b2ea90016c25e596261d58c822b`.

No full compliance: 599 current browser measurement cases; 43 individual failed checks. 70/71 source routes have runtime evidence.

| ID | Route | Priority | Expected | Observed | Cause | Central correction |
| --- | --- | --- | --- | --- | --- | --- |
| UX-FIN-010 | /dashboard | P1 | Light Theme: aufgelöster Hintergrund entspricht --color-bg; frühere dunkle Variante ist dokumentierter Konflikt | {"actual":"rgb(23, 25, 29)","expected":"rgb(255, 255, 255)","conflict":"Earlier hardcoded dark variant superseded in light theme"} | app/styles/app.css .bo-statistics hardcodes #17191d; earlier browser assertion also enforces that superseded variant | Reconcile Statistics palette with app background tokens, axes/legend/bar contrast and approved focus motion centrally |
| UX-FIN-010 | /dashboard | P1 | Light Theme: aufgelöster Hintergrund entspricht --color-bg; frühere dunkle Variante ist dokumentierter Konflikt | {"actual":"rgb(23, 25, 29)","expected":"rgb(255, 255, 255)","conflict":"Earlier hardcoded dark variant superseded in light theme"} | app/styles/app.css .bo-statistics hardcodes #17191d; earlier browser assertion also enforces that superseded variant | Reconcile Statistics palette with app background tokens, axes/legend/bar contrast and approved focus motion centrally |
| UX-FIN-010 | /demo | P1 | Light Theme: aufgelöster Hintergrund entspricht --color-bg; frühere dunkle Variante ist dokumentierter Konflikt | {"actual":"rgb(23, 25, 29)","expected":"rgb(255, 255, 255)","conflict":"Earlier hardcoded dark variant superseded in light theme"} | app/styles/app.css .bo-statistics hardcodes #17191d; earlier browser assertion also enforces that superseded variant | Reconcile Statistics palette with app background tokens, axes/legend/bar contrast and approved focus motion centrally |
| UX-FIN-010 | /willkommen | P1 | Light Theme: aufgelöster Hintergrund entspricht --color-bg; frühere dunkle Variante ist dokumentierter Konflikt | {"actual":"rgb(23, 25, 29)","expected":"rgb(255, 255, 255)","conflict":"Earlier hardcoded dark variant superseded in light theme"} | app/styles/app.css .bo-statistics hardcodes #17191d; earlier browser assertion also enforces that superseded variant | Reconcile Statistics palette with app background tokens, axes/legend/bar contrast and approved focus motion centrally |
| UX-FIN-010 | /finanzen/analyse | P1 | Light Theme: aufgelöster Hintergrund entspricht --color-bg; frühere dunkle Variante ist dokumentierter Konflikt | {"actual":"rgb(23, 25, 29)","expected":"rgb(255, 255, 255)","conflict":"Earlier hardcoded dark variant superseded in light theme"} | app/styles/app.css .bo-statistics hardcodes #17191d; earlier browser assertion also enforces that superseded variant | Reconcile Statistics palette with app background tokens, axes/legend/bar contrast and approved focus motion centrally |
| UX-FIN-010 | /demo | P1 | Light Theme: aufgelöster Hintergrund entspricht --color-bg; frühere dunkle Variante ist dokumentierter Konflikt | {"actual":"rgb(23, 25, 29)","expected":"rgb(255, 255, 255)","conflict":"Earlier hardcoded dark variant superseded in light theme"} | app/styles/app.css .bo-statistics hardcodes #17191d; earlier browser assertion also enforces that superseded variant | Reconcile Statistics palette with app background tokens, axes/legend/bar contrast and approved focus motion centrally |
| UX-FIN-010 | /belege | P1 | Light Theme: aufgelöster Hintergrund entspricht --color-bg; frühere dunkle Variante ist dokumentierter Konflikt | {"actual":"rgb(23, 25, 29)","expected":"rgb(255, 255, 255)","conflict":"Earlier hardcoded dark variant superseded in light theme"} | app/styles/app.css .bo-statistics hardcodes #17191d; earlier browser assertion also enforces that superseded variant | Reconcile Statistics palette with app background tokens, axes/legend/bar contrast and approved focus motion centrally |
| UX-FIN-010 | /preview/dashboard | P1 | Light Theme: aufgelöster Hintergrund entspricht --color-bg; frühere dunkle Variante ist dokumentierter Konflikt | {"actual":"rgb(23, 25, 29)","expected":"rgb(255, 255, 255)","conflict":"Earlier hardcoded dark variant superseded in light theme"} | app/styles/app.css .bo-statistics hardcodes #17191d; earlier browser assertion also enforces that superseded variant | Reconcile Statistics palette with app background tokens, axes/legend/bar contrast and approved focus motion centrally |
| UX-FIN-010 | /finanzen | P1 | Light Theme: aufgelöster Hintergrund entspricht --color-bg; frühere dunkle Variante ist dokumentierter Konflikt | {"actual":"rgb(23, 25, 29)","expected":"rgb(255, 255, 255)","conflict":"Earlier hardcoded dark variant superseded in light theme"} | app/styles/app.css .bo-statistics hardcodes #17191d; earlier browser assertion also enforces that superseded variant | Reconcile Statistics palette with app background tokens, axes/legend/bar contrast and approved focus motion centrally |
| UX-FIN-010 | /demo | P1 | Light Theme: aufgelöster Hintergrund entspricht --color-bg; frühere dunkle Variante ist dokumentierter Konflikt | {"actual":"rgb(23, 25, 29)","expected":"rgb(255, 255, 255)","conflict":"Earlier hardcoded dark variant superseded in light theme"} | app/styles/app.css .bo-statistics hardcodes #17191d; earlier browser assertion also enforces that superseded variant | Reconcile Statistics palette with app background tokens, axes/legend/bar contrast and approved focus motion centrally |
| UX-FIN-010 | /kunden/customer-one | P1 | Light Theme: aufgelöster Hintergrund entspricht --color-bg; frühere dunkle Variante ist dokumentierter Konflikt | {"actual":"rgb(23, 25, 29)","expected":"rgb(255, 255, 255)","conflict":"Earlier hardcoded dark variant superseded in light theme"} | app/styles/app.css .bo-statistics hardcodes #17191d; earlier browser assertion also enforces that superseded variant | Reconcile Statistics palette with app background tokens, axes/legend/bar contrast and approved focus motion centrally |
| UX-FIN-010 | /finanzen | P1 | Light Theme: aufgelöster Hintergrund entspricht --color-bg; frühere dunkle Variante ist dokumentierter Konflikt | {"actual":"rgb(23, 25, 29)","expected":"rgb(255, 255, 255)","conflict":"Earlier hardcoded dark variant superseded in light theme"} | app/styles/app.css .bo-statistics hardcodes #17191d; earlier browser assertion also enforces that superseded variant | Reconcile Statistics palette with app background tokens, axes/legend/bar contrast and approved focus motion centrally |
| UX-FIN-010 | /kunden/customer-one | P1 | Light Theme: aufgelöster Hintergrund entspricht --color-bg; frühere dunkle Variante ist dokumentierter Konflikt | {"actual":"rgb(23, 25, 29)","expected":"rgb(255, 255, 255)","conflict":"Earlier hardcoded dark variant superseded in light theme"} | app/styles/app.css .bo-statistics hardcodes #17191d; earlier browser assertion also enforces that superseded variant | Reconcile Statistics palette with app background tokens, axes/legend/bar contrast and approved focus motion centrally |
| UX-FIN-010 | /preview/dashboard | P1 | Light Theme: aufgelöster Hintergrund entspricht --color-bg; frühere dunkle Variante ist dokumentierter Konflikt | {"actual":"rgb(23, 25, 29)","expected":"rgb(255, 255, 255)","conflict":"Earlier hardcoded dark variant superseded in light theme"} | app/styles/app.css .bo-statistics hardcodes #17191d; earlier browser assertion also enforces that superseded variant | Reconcile Statistics palette with app background tokens, axes/legend/bar contrast and approved focus motion centrally |
| UX-FIN-010 | /finanzen | P1 | Light Theme: aufgelöster Hintergrund entspricht --color-bg; frühere dunkle Variante ist dokumentierter Konflikt | {"actual":"rgb(23, 25, 29)","expected":"rgb(255, 255, 255)","conflict":"Earlier hardcoded dark variant superseded in light theme"} | app/styles/app.css .bo-statistics hardcodes #17191d; earlier browser assertion also enforces that superseded variant | Reconcile Statistics palette with app background tokens, axes/legend/bar contrast and approved focus motion centrally |
| UX-FIN-010 | /dashboard | P1 | Light Theme: aufgelöster Hintergrund entspricht --color-bg; frühere dunkle Variante ist dokumentierter Konflikt | {"actual":"rgb(23, 25, 29)","expected":"rgb(255, 255, 255)","conflict":"Earlier hardcoded dark variant superseded in light theme"} | app/styles/app.css .bo-statistics hardcodes #17191d; earlier browser assertion also enforces that superseded variant | Reconcile Statistics palette with app background tokens, axes/legend/bar contrast and approved focus motion centrally |
| UX-FIN-010 | /preview/dashboard | P1 | Light Theme: aufgelöster Hintergrund entspricht --color-bg; frühere dunkle Variante ist dokumentierter Konflikt | {"actual":"rgb(23, 25, 29)","expected":"rgb(255, 255, 255)","conflict":"Earlier hardcoded dark variant superseded in light theme"} | app/styles/app.css .bo-statistics hardcodes #17191d; earlier browser assertion also enforces that superseded variant | Reconcile Statistics palette with app background tokens, axes/legend/bar contrast and approved focus motion centrally |
| UX-FIN-010 | /finanzen/analyse | P1 | Light Theme: aufgelöster Hintergrund entspricht --color-bg; frühere dunkle Variante ist dokumentierter Konflikt | {"actual":"rgb(23, 25, 29)","expected":"rgb(255, 255, 255)","conflict":"Earlier hardcoded dark variant superseded in light theme"} | app/styles/app.css .bo-statistics hardcodes #17191d; earlier browser assertion also enforces that superseded variant | Reconcile Statistics palette with app background tokens, axes/legend/bar contrast and approved focus motion centrally |
| UX-FIN-010 | /dashboard | P1 | Light Theme: aufgelöster Hintergrund entspricht --color-bg; frühere dunkle Variante ist dokumentierter Konflikt | {"actual":"rgb(23, 25, 29)","expected":"rgb(255, 255, 255)","conflict":"Earlier hardcoded dark variant superseded in light theme"} | app/styles/app.css .bo-statistics hardcodes #17191d; earlier browser assertion also enforces that superseded variant | Reconcile Statistics palette with app background tokens, axes/legend/bar contrast and approved focus motion centrally |
| UX-FIN-010 | /finanzen/analyse | P1 | Light Theme: aufgelöster Hintergrund entspricht --color-bg; frühere dunkle Variante ist dokumentierter Konflikt | {"actual":"rgb(23, 25, 29)","expected":"rgb(255, 255, 255)","conflict":"Earlier hardcoded dark variant superseded in light theme"} | app/styles/app.css .bo-statistics hardcodes #17191d; earlier browser assertion also enforces that superseded variant | Reconcile Statistics palette with app background tokens, axes/legend/bar contrast and approved focus motion centrally |
| UX-FIN-010 | /belege | P1 | Light Theme: aufgelöster Hintergrund entspricht --color-bg; frühere dunkle Variante ist dokumentierter Konflikt | {"actual":"rgb(23, 25, 29)","expected":"rgb(255, 255, 255)","conflict":"Earlier hardcoded dark variant superseded in light theme"} | app/styles/app.css .bo-statistics hardcodes #17191d; earlier browser assertion also enforces that superseded variant | Reconcile Statistics palette with app background tokens, axes/legend/bar contrast and approved focus motion centrally |
| UX-FIN-010 | /finanzen/analyse | P1 | Light Theme: aufgelöster Hintergrund entspricht --color-bg; frühere dunkle Variante ist dokumentierter Konflikt | {"actual":"rgb(23, 25, 29)","expected":"rgb(255, 255, 255)","conflict":"Earlier hardcoded dark variant superseded in light theme"} | app/styles/app.css .bo-statistics hardcodes #17191d; earlier browser assertion also enforces that superseded variant | Reconcile Statistics palette with app background tokens, axes/legend/bar contrast and approved focus motion centrally |
| UX-FIN-010 | /willkommen | P1 | Light Theme: aufgelöster Hintergrund entspricht --color-bg; frühere dunkle Variante ist dokumentierter Konflikt | {"actual":"rgb(23, 25, 29)","expected":"rgb(255, 255, 255)","conflict":"Earlier hardcoded dark variant superseded in light theme"} | app/styles/app.css .bo-statistics hardcodes #17191d; earlier browser assertion also enforces that superseded variant | Reconcile Statistics palette with app background tokens, axes/legend/bar contrast and approved focus motion centrally |
| UX-FIN-010 | /finanzen | P1 | Light Theme: aufgelöster Hintergrund entspricht --color-bg; frühere dunkle Variante ist dokumentierter Konflikt | {"actual":"rgb(23, 25, 29)","expected":"rgb(255, 255, 255)","conflict":"Earlier hardcoded dark variant superseded in light theme"} | app/styles/app.css .bo-statistics hardcodes #17191d; earlier browser assertion also enforces that superseded variant | Reconcile Statistics palette with app background tokens, axes/legend/bar contrast and approved focus motion centrally |
| UX-FIN-010 | /kunden/customer-one | P1 | Light Theme: aufgelöster Hintergrund entspricht --color-bg; frühere dunkle Variante ist dokumentierter Konflikt | {"actual":"rgb(23, 25, 29)","expected":"rgb(255, 255, 255)","conflict":"Earlier hardcoded dark variant superseded in light theme"} | app/styles/app.css .bo-statistics hardcodes #17191d; earlier browser assertion also enforces that superseded variant | Reconcile Statistics palette with app background tokens, axes/legend/bar contrast and approved focus motion centrally |
| UX-FIN-010 | /willkommen | P1 | Light Theme: aufgelöster Hintergrund entspricht --color-bg; frühere dunkle Variante ist dokumentierter Konflikt | {"actual":"rgb(23, 25, 29)","expected":"rgb(255, 255, 255)","conflict":"Earlier hardcoded dark variant superseded in light theme"} | app/styles/app.css .bo-statistics hardcodes #17191d; earlier browser assertion also enforces that superseded variant | Reconcile Statistics palette with app background tokens, axes/legend/bar contrast and approved focus motion centrally |
| UX-FIN-010 | /belege | P1 | Light Theme: aufgelöster Hintergrund entspricht --color-bg; frühere dunkle Variante ist dokumentierter Konflikt | {"actual":"rgb(23, 25, 29)","expected":"rgb(255, 255, 255)","conflict":"Earlier hardcoded dark variant superseded in light theme"} | app/styles/app.css .bo-statistics hardcodes #17191d; earlier browser assertion also enforces that superseded variant | Reconcile Statistics palette with app background tokens, axes/legend/bar contrast and approved focus motion centrally |
| UX-FIN-010 | /dashboard | P1 | Light Theme: aufgelöster Hintergrund entspricht --color-bg; frühere dunkle Variante ist dokumentierter Konflikt | {"actual":"rgb(23, 25, 29)","expected":"rgb(255, 255, 255)","conflict":"Earlier hardcoded dark variant superseded in light theme"} | app/styles/app.css .bo-statistics hardcodes #17191d; earlier browser assertion also enforces that superseded variant | Reconcile Statistics palette with app background tokens, axes/legend/bar contrast and approved focus motion centrally |
| UX-FIN-010 | /finanzen | P1 | Light Theme: aufgelöster Hintergrund entspricht --color-bg; frühere dunkle Variante ist dokumentierter Konflikt | {"actual":"rgb(23, 25, 29)","expected":"rgb(255, 255, 255)","conflict":"Earlier hardcoded dark variant superseded in light theme"} | app/styles/app.css .bo-statistics hardcodes #17191d; earlier browser assertion also enforces that superseded variant | Reconcile Statistics palette with app background tokens, axes/legend/bar contrast and approved focus motion centrally |
| UX-FIN-010 | /dashboard | P1 | Light Theme: aufgelöster Hintergrund entspricht --color-bg; frühere dunkle Variante ist dokumentierter Konflikt | {"actual":"rgb(23, 25, 29)","expected":"rgb(255, 255, 255)","conflict":"Earlier hardcoded dark variant superseded in light theme"} | app/styles/app.css .bo-statistics hardcodes #17191d; earlier browser assertion also enforces that superseded variant | Reconcile Statistics palette with app background tokens, axes/legend/bar contrast and approved focus motion centrally |
| UX-FIN-010 | /finanzen | P1 | Light Theme: aufgelöster Hintergrund entspricht --color-bg; frühere dunkle Variante ist dokumentierter Konflikt | {"actual":"rgb(23, 25, 29)","expected":"rgb(255, 255, 255)","conflict":"Earlier hardcoded dark variant superseded in light theme"} | app/styles/app.css .bo-statistics hardcodes #17191d; earlier browser assertion also enforces that superseded variant | Reconcile Statistics palette with app background tokens, axes/legend/bar contrast and approved focus motion centrally |
| UX-FIN-010 | /dashboard | P1 | Light Theme: aufgelöster Hintergrund entspricht --color-bg; frühere dunkle Variante ist dokumentierter Konflikt | {"actual":"rgb(23, 25, 29)","expected":"rgb(255, 255, 255)","conflict":"Earlier hardcoded dark variant superseded in light theme"} | app/styles/app.css .bo-statistics hardcodes #17191d; earlier browser assertion also enforces that superseded variant | Reconcile Statistics palette with app background tokens, axes/legend/bar contrast and approved focus motion centrally |
| UX-FIN-010 | /finanzen | P1 | Light Theme: aufgelöster Hintergrund entspricht --color-bg; frühere dunkle Variante ist dokumentierter Konflikt | {"actual":"rgb(23, 25, 29)","expected":"rgb(255, 255, 255)","conflict":"Earlier hardcoded dark variant superseded in light theme"} | app/styles/app.css .bo-statistics hardcodes #17191d; earlier browser assertion also enforces that superseded variant | Reconcile Statistics palette with app background tokens, axes/legend/bar contrast and approved focus motion centrally |
| UX-FIN-010 | /finanzen | P1 | Light Theme: aufgelöster Hintergrund entspricht --color-bg; frühere dunkle Variante ist dokumentierter Konflikt | {"actual":"rgb(23, 25, 29)","expected":"rgb(255, 255, 255)","conflict":"Earlier hardcoded dark variant superseded in light theme"} | app/styles/app.css .bo-statistics hardcodes #17191d; earlier browser assertion also enforces that superseded variant | Reconcile Statistics palette with app background tokens, axes/legend/bar contrast and approved focus motion centrally |
| UX-FIN-010 | /dashboard | P1 | Light Theme: aufgelöster Hintergrund entspricht --color-bg; frühere dunkle Variante ist dokumentierter Konflikt | {"actual":"rgb(23, 25, 29)","expected":"rgb(255, 255, 255)","conflict":"Earlier hardcoded dark variant superseded in light theme"} | app/styles/app.css .bo-statistics hardcodes #17191d; earlier browser assertion also enforces that superseded variant | Reconcile Statistics palette with app background tokens, axes/legend/bar contrast and approved focus motion centrally |
| UX-FIN-010 | /finanzen | P1 | Light Theme: aufgelöster Hintergrund entspricht --color-bg; frühere dunkle Variante ist dokumentierter Konflikt | {"actual":"rgb(23, 25, 29)","expected":"rgb(255, 255, 255)","conflict":"Earlier hardcoded dark variant superseded in light theme"} | app/styles/app.css .bo-statistics hardcodes #17191d; earlier browser assertion also enforces that superseded variant | Reconcile Statistics palette with app background tokens, axes/legend/bar contrast and approved focus motion centrally |
| UX-FIN-010 | /kunden/customer-one | P1 | Light Theme: aufgelöster Hintergrund entspricht --color-bg; frühere dunkle Variante ist dokumentierter Konflikt | {"actual":"rgb(23, 25, 29)","expected":"rgb(255, 255, 255)","conflict":"Earlier hardcoded dark variant superseded in light theme"} | app/styles/app.css .bo-statistics hardcodes #17191d; earlier browser assertion also enforces that superseded variant | Reconcile Statistics palette with app background tokens, axes/legend/bar contrast and approved focus motion centrally |
| UX-FIN-010 | /kunden/customer-one | P1 | Light Theme: aufgelöster Hintergrund entspricht --color-bg; frühere dunkle Variante ist dokumentierter Konflikt | {"actual":"rgb(23, 25, 29)","expected":"rgb(255, 255, 255)","conflict":"Earlier hardcoded dark variant superseded in light theme"} | app/styles/app.css .bo-statistics hardcodes #17191d; earlier browser assertion also enforces that superseded variant | Reconcile Statistics palette with app background tokens, axes/legend/bar contrast and approved focus motion centrally |
| UX-FIN-010 | /finanzen | P1 | Light Theme: aufgelöster Hintergrund entspricht --color-bg; frühere dunkle Variante ist dokumentierter Konflikt | {"actual":"rgb(23, 25, 29)","expected":"rgb(255, 255, 255)","conflict":"Earlier hardcoded dark variant superseded in light theme"} | app/styles/app.css .bo-statistics hardcodes #17191d; earlier browser assertion also enforces that superseded variant | Reconcile Statistics palette with app background tokens, axes/legend/bar contrast and approved focus motion centrally |
| UX-FIN-010 | /finanzen | P1 | Light Theme: aufgelöster Hintergrund entspricht --color-bg; frühere dunkle Variante ist dokumentierter Konflikt | {"actual":"rgb(23, 25, 29)","expected":"rgb(255, 255, 255)","conflict":"Earlier hardcoded dark variant superseded in light theme"} | app/styles/app.css .bo-statistics hardcodes #17191d; earlier browser assertion also enforces that superseded variant | Reconcile Statistics palette with app background tokens, axes/legend/bar contrast and approved focus motion centrally |
| UX-FIN-010 | /finanzen | P1 | Light Theme: aufgelöster Hintergrund entspricht --color-bg; frühere dunkle Variante ist dokumentierter Konflikt | {"actual":"rgb(23, 25, 29)","expected":"rgb(255, 255, 255)","conflict":"Earlier hardcoded dark variant superseded in light theme"} | app/styles/app.css .bo-statistics hardcodes #17191d; earlier browser assertion also enforces that superseded variant | Reconcile Statistics palette with app background tokens, axes/legend/bar contrast and approved focus motion centrally |
| UX-FIN-010 | /finanzen | P1 | Light Theme: aufgelöster Hintergrund entspricht --color-bg; frühere dunkle Variante ist dokumentierter Konflikt | {"actual":"rgb(23, 25, 29)","expected":"rgb(255, 255, 255)","conflict":"Earlier hardcoded dark variant superseded in light theme"} | app/styles/app.css .bo-statistics hardcodes #17191d; earlier browser assertion also enforces that superseded variant | Reconcile Statistics palette with app background tokens, axes/legend/bar contrast and approved focus motion centrally |
| UX-FIN-010 | /finanzen | P1 | Light Theme: aufgelöster Hintergrund entspricht --color-bg; frühere dunkle Variante ist dokumentierter Konflikt | {"actual":"rgb(23, 25, 29)","expected":"rgb(255, 255, 255)","conflict":"Earlier hardcoded dark variant superseded in light theme"} | app/styles/app.css .bo-statistics hardcodes #17191d; earlier browser assertion also enforces that superseded variant | Reconcile Statistics palette with app background tokens, axes/legend/bar contrast and approved focus motion centrally |

## Coverage

| ID | Method | Status | Cases | Owner |
| --- | --- | --- | --- | --- |
| UX-NAV-001 | static | passed | 1 | AppShell |
| UX-NAV-002 | static | passed | 1 | AppShell |
| UX-NAV-003 | browser | partial | 117 | AppShell |
| UX-LAY-001 | browser | partial | 596 | AppShell |
| UX-LAY-002 | review | review-required | 0 | AppShell |
| UX-LAY-003 | browser | not-tested | 0 | HeaderPanel |
| UX-LAY-004 | review | review-required | 0 | AppShell |
| UX-LAY-005 | browser | not-tested | 0 | RecordsView |
| UX-LAY-006 | browser | partial | 184 | Field |
| UX-LAY-007 | browser | partial | 184 | Field |
| UX-LAY-008 | browser | partial | 100 | AppShell |
| UX-CTL-001 | browser | not-tested | 0 | RecordsView |
| UX-CTL-002 | browser | partial | 123 | DetailTabs |
| UX-CTL-003 | browser | partial | 4 | RecordsView |
| UX-HDR-001 | browser | partial | 150 | AppShell |
| UX-SHT-001 | browser | partial | 84 | FilterSheet |
| UX-SHT-002 | browser | partial | 67 | FormActions |
| UX-ARC-001 | static | passed | 1 | central-ui ESLint |
| UX-ARC-002 | review | review-required | 0 | UX architecture |
| UX-ARC-003 | review | review-required | 0 | UX architecture |
| UX-ARC-004 | review | review-required | 0 | UX architecture |
| UX-FIN-001 | browser | partial | 78 | CashStatistics |
| UX-FIN-002 | browser | partial | 58 | CashStatistics |
| UX-FIN-003 | browser | partial | 58 | Statistics |
| UX-FIN-004 | browser | partial | 78 | Statistics |
| UX-FIN-005 | interaction | partial | 1 | Statistics |
| UX-FIN-006 | interaction | not-tested | 0 | CashStatistics |
| UX-FIN-007 | interaction | partial | 1 | Statistics |
| UX-FIN-008 | review | review-required | 0 | CashStatistics data provider |
| UX-FIN-009 | review | review-required | 0 | Statistics |
| UX-FIN-010 | browser | failed | 43 | Statistics |
| UX-INT-001 | interaction | partial | 1 | RecordsView |
| UX-INT-002 | interaction | partial | 1 | AppShell |
| UX-INT-003 | interaction | partial | 1 | FormWizard |
| UX-INT-004 | interaction | partial | 1 | FormWizard |
| UX-PDF-001 | interaction | partial | 1 | PdfPreview |
| UX-DEV-001 | physical | manual-required | 0 | AppShell |
| UX-DEV-002 | interaction | not-tested | 0 | PWA |
| UX-FIX-001 | static | passed | 1 | fixture harness |
| V22.1-01-01 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-01-02 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-01-03 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-01-04 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-01-05 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-01-06 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-02-01 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-02-02 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-02-03 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-02-04 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-02-05 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-02-06 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-02-07 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-02-08 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-02-09 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-02-10 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-02-11 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-02-12 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-02-13 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-03-01 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-03-02 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-03-03 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-03-04 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-03-05 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-03-06 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-03-07 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-03-08 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-04-01 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-04-02 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-04-03 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-04-04 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-04-05 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-04-06 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-04-07 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-04-08 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-05-01 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-05-02 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-05-03 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-05-04 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-05-05 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-05-06 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-05-07 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-05-08 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-05-09 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-05-10 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-05-11 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-06-01 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-06-02 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-06-03 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-06-04 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-06-05 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-06-06 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-07-01 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-07-02 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-07-03 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-07-04 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-07-05 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-07-06 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-07-07 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-07-08 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-07-09 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-07-10 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-08-01 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-08-02 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-08-03 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-08-04 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-08-05 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-08-06 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-08-07 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-08-08 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-08-09 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-08-10 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-08-11 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-08-12 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-09-01 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-09-02 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-09-03 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-09-04 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-09-05 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-09-06 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-09-07 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-09-08 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-09-09 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-09-10 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-09-11 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-09-12 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-09-13 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-09-14 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-09-15 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-09-16 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-09-17 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-10-01 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-10-02 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-10-03 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-10-04 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-10-05 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-10-06 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-10-07 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-11-01 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-11-02 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-11-03 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-11-04 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-11-05 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-11-06 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-11-07 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-11-08 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-11-09 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-11-10 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-11-11 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-11-12 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-11-13 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-11-14 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-12-01 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-12-02 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-12-03 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-12-04 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-12-05 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-12-06 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-12-07 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-12-08 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-12-09 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-13-01 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-13-02 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-13-03 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-13-04 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-13-05 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-13-06 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-13-07 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-13-08 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-13-09 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-13-10 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-13-11 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-13-12 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-13-13 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-13-14 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-13-15 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-13-16 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-13-17 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-13-18 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-13-19 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-14-01 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-14-02 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-14-03 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-14-04 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-14-05 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-14-06 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-14-07 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-14-08 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-14-09 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-14-10 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-14-11 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-15-01 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-15-02 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-15-03 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-15-04 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-15-05 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-15-06 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-15-07 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-15-08 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-15-09 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-15-10 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-15-11 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-15-12 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-15-13 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-16-01 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-16-02 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-16-03 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-16-04 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-16-05 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-16-06 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-16-07 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-16-08 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-16-09 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-16-10 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-16-11 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-17-01 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-17-02 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-17-03 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-17-04 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-17-05 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-17-06 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-17-07 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-17-08 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-17-09 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-17-10 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-17-11 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-17-12 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-17-13 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-17-14 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-17-15 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-17-16 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-17-17 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-17-18 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-17-19 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-18-01 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-18-02 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-18-03 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-18-04 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-18-05 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-18-06 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-18-07 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-18-08 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-18-09 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-18-10 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-18-11 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-18-12 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-18-13 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-18-14 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-18-15 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-18-16 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-18-17 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-19-01 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-19-02 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-19-03 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-19-04 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-19-05 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-19-06 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-19-07 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-19-08 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-19-09 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-19-10 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-19-11 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-19-12 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-19-13 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-19-14 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-19-15 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-19-16 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-20-01 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-20-02 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-20-03 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-20-04 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-20-05 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-20-06 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-20-07 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-21-01 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-21-02 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-21-03 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-21-04 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-21-05 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-21-06 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-21-07 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-21-08 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-22-01 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-22-02 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-22-03 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-22-04 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-22-05 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-23-01 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-23-02 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-23-03 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-23-04 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-23-05 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-23-06 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-24-01 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-24-02 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-24-03 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-24-04 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-24-05 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-24-06 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-24-07 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-24-08 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-24-09 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-25-01 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-25-02 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-25-03 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-25-04 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-25-05 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-25-06 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-25-07 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-25-08 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-25-09 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-25-10 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-25-11 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-25-12 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-25-13 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-25-14 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-25-15 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-25-16 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-25-17 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-25-18 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-25-19 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-25-20 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-25-21 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-25-22 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-25-23 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-25-24 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-25-25 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-26-01 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-26-02 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-26-03 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-26-04 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-26-05 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-26-06 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-26-07 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-26-08 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-26-09 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-26-10 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-26-11 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-26-12 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-26-13 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-26-14 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-26-15 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-26-16 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-26-17 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-26-18 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-26-19 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-26-20 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-26-21 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-26-22 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-26-23 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-26-24 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-27-01 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-27-02 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-28-01 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-28-02 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-28-03 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-28-04 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-28-05 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-28-06 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-29-01 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-29-02 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-29-03 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-29-04 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-29-05 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-29-06 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-29-07 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-30-01 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-30-02 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-30-03 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-30-04 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-30-05 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-30-06 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-30-07 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-30-08 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-30-09 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-30-10 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-30-11 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.1-30-12 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-REQ-01 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-REQ-02 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-REQ-03 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-REQ-04 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-REQ-05 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-REQ-06 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-REQ-07 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-REQ-08 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-REQ-09 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-REQ-10 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-REQ-11 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-REQ-12 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-REQ-13 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-REQ-14 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-REQ-15 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-REQ-16 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-REQ-17 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-REQ-18 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-REQ-19 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-REQ-20 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-TEST-01 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-TEST-02 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-TEST-03 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-TEST-04 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-TEST-05 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-TEST-06 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-TEST-07 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-TEST-08 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-TEST-09 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-TEST-10 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-TEST-11 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-TEST-12 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-TEST-13 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-TEST-14 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-TEST-15 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-TEST-16 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-TEST-17 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-TEST-18 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-TEST-19 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-TEST-20 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-TEST-21 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-TEST-22 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-TEST-23 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-TEST-24 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-TEST-25 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-TEST-26 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-TEST-27 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-TEST-28 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-TEST-29 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-TEST-30 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-TEST-31 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-TEST-32 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-TEST-33 | review | review-required | 0 | UX owner: assign during reconciliation |
| V22.2-TEST-34 | review | review-required | 0 | UX owner: assign during reconciliation |
| UX-VIS-001 | browser | not-tested | 0 | UX approval owner |

## Technical blockers

- Original complete V21.1–V21.5 approval artifacts unavailable
- Physical installed iOS/Android PWA and OS keyboard unavailable
- All route/state/role combinations have not yet been individually instrumented
- Visual baseline requires reviewed same-commit capture; no auto-update
- React component attribution is static reachability + selector mount; no React fiber identity claim

## Prioritized remediation

- P0: preserve navigation contract; complete device/permission/dirty/replay evidence
- P1: centrally resolve Statistics background conflict and obsolete dark assertion
- P1: triage confirmed geometry failures with CSSOM before changing owners
- P1: bind imported approval requirements to individual tests and cover untested states
- P2: review CSS/legacy/padding candidates; prove non-use before deletion

## Candidate review

307 CSS property cascades, 0 important declarations, 5 possibly unused declarations. These are review candidates, never blanket violations. Full paths, line numbers, CSS contexts, render paths, measurements and route/state coverage are in report.json and inventory.json.
