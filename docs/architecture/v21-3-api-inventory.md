# V21.3 API inventory

Static AST/source inventory, not proof that every runtime branch is tested. Calls include exact source arguments and locations; dynamic dispatch requires the domain matrix and runtime tests.

159 API route files, 62 client consumers, 111 migrations, 129 declared tables.

| Endpoint | Methods | Source | Direct data/auth evidence |
|---|---|---|---|
| `/api/absences/[id]` | PATCH | `app/api/absences/[id]/route.ts` | `requireSession:7`, `withTenant:8` |
| `/api/absences/context` | GET | `app/api/absences/context/route.ts` | `requireSession:7`, `withTenant:7` |
| `/api/absences` | GET, POST | `app/api/absences/route.ts` | `requireSession:7`, `withTenant:9`, `requireSession:12`, `withTenant:13` |
| `/api/auth/invitation` | GET, POST | `app/api/auth/invitation/route.ts` | `withPlatform:11`, `c.query:12`, `c.query:16`, `c.query:17`, `c.query:19`, `withPlatform:41`, `c.query:42`, `c.query:44`, `c.query:45`, `c.query:47`, `c.query:49`, `c.query:53`, `c.query:54`, `c.query:55`, `c.query:57`, `c.query:59`, `c.query:61`, `c.query:62` |
| `/api/auth/login` | POST | `app/api/auth/login/route.ts` | `query:24`, `client.query:31`, `client.query:32`, `query:55`, `query:56` |
| `/api/auth/logout` | POST | `app/api/auth/logout/route.ts` |  |
| `/api/auth/mfa/confirm` | POST | `app/api/auth/mfa/confirm/route.ts` | `client.query:23`, `client.query:29`, `client.query:30`, `client.query:31`, `client.query:32` |
| `/api/auth/mfa` | GET, DELETE | `app/api/auth/mfa/route.ts` | `query:15`, `withTenant:17`, `client.query:17`, `withTenant:25`, `client.query:26`, `client.query:27`, `client.query:28`, `client.query:29`, `client.query:31`, `client.query:32`, `client.query:33` |
| `/api/auth/mfa/setup` | POST | `app/api/auth/mfa/setup/route.ts` | `query:21` |
| `/api/auth/passkeys/options` | POST | `app/api/auth/passkeys/options/route.ts` | `requireSession:11`, `requireSession:13` |
| `/api/auth/passkeys` | GET, PATCH, DELETE | `app/api/auth/passkeys/route.ts` | `requireSession:7`, `requireSession:10`, `requireSession:19` |
| `/api/auth/passkeys/verify` | POST | `app/api/auth/passkeys/verify/route.ts` | `requireSession:13`, `requireSession:15` |
| `/api/auth/password` | PATCH | `app/api/auth/password/route.ts` | `requireSession:19`, `query:24`, `c.query:27`, `c.query:27`, `c.query:27`, `client.query:35`, `client.query:37`, `client.query:38`, `client.query:40`, `client.query:41`, `client.query:49`, `client.query:51`, `client.query:52` |
| `/api/auth/reauthenticate` | POST | `app/api/auth/reauthenticate/route.ts` | `query:19`, `withTenant:21`, `client.query:21`, `withTenant:35`, `client.query:38`, `client.query:40`, `client.query:41` |
| `/api/auth/recover` | POST | `app/api/auth/recover/route.ts` | `query:16` |
| `/api/auth/register` | GET, POST | `app/api/auth/register/route.ts` | `query:42` |
| `/api/auth/resend-verification` | POST | `app/api/auth/resend-verification/route.ts` | `query:16`, `client.query:18`, `client.query:19` |
| `/api/auth/sensitive-access` | GET | `app/api/auth/sensitive-access/route.ts` | `requireSession:4` |
| `/api/auth/session` | GET | `app/api/auth/session/route.ts` |  |
| `/api/auth/sessions/[id]` | DELETE | `app/api/auth/sessions/[id]/route.ts` | `requireSession:11`, `query:16` |
| `/api/auth/sessions` | GET, DELETE | `app/api/auth/sessions/route.ts` | `requireSession:10`, `query:11`, `requireSession:44`, `query:45` |
| `/api/auth/verify-email` | POST | `app/api/auth/verify-email/route.ts` | `client.query:23`, `client.query:32`, `query:40` |
| `/api/billing/catalog` | GET | `app/api/billing/catalog/route.ts` | `requireSession:8`, `authorize:8` |
| `/api/billing/checkout` | POST | `app/api/billing/checkout/route.ts` | `requireSession:16`, `authorize:16`, `query:23`, `withTenant:26` |
| `/api/billing/portal` | POST | `app/api/billing/portal/route.ts` | `requireSession:2`, `authorize:2`, `query:2` |
| `/api/billing/webhook` | POST | `app/api/billing/webhook/route.ts` | `withPlatform:12` |
| `/api/contracts/[id]/conditions/[conditionId]/review` | POST | `app/api/contracts/[id]/conditions/[conditionId]/review/route.ts` | `requireSession:6`, `withTenant:6` |
| `/api/contracts/[id]/conditions/[conditionId]` | PATCH | `app/api/contracts/[id]/conditions/[conditionId]/route.ts` | `requireSession:6`, `withTenant:6` |
| `/api/contracts/[id]/conditions` | POST | `app/api/contracts/[id]/conditions/route.ts` | `requireSession:6`, `withTenant:6` |
| `/api/contracts/[id]` | GET, PATCH | `app/api/contracts/[id]/route.ts` | `requireSession:6`, `withTenant:6`, `requireSession:7`, `withTenant:7` |
| `/api/contracts/[id]/status` | PATCH | `app/api/contracts/[id]/status/route.ts` | `requireSession:6`, `withTenant:6` |
| `/api/contracts` | GET, POST | `app/api/contracts/route.ts` | `requireSession:7`, `withTenant:9`, `requireSession:11`, `withTenant:11` |
| `/api/customers/[id]/activity` | GET | `app/api/customers/[id]/activity/route.ts` | `requireSession:6`, `authorize:6`, `withTenant:7` |
| `/api/customers/[id]/contacts/[contactId]` | PATCH, DELETE | `app/api/customers/[id]/contacts/[contactId]/route.ts` | `authorize:8`, `authorize:11` |
| `/api/customers/[id]/contacts` | GET, POST | `app/api/customers/[id]/contacts/route.ts` | `tenantList:13`, `authorize:27` |
| `/api/customers/[id]/documents` | GET | `app/api/customers/[id]/documents/route.ts` | `tenantList:7` |
| `/api/customers/[id]` | GET, PATCH, DELETE | `app/api/customers/[id]/route.ts` | `requireSession:14`, `authorize:14`, `withTenant:14`, `tenantList:14`, `requireSession:18`, `authorize:18`, `requireSession:25`, `authorize:25` |
| `/api/customers/archive` | GET, POST | `app/api/customers/archive/route.ts` | `requireSession:8`, `authorize:8`, `requireSession:14`, `authorize:14` |
| `/api/customers/duplicates` | GET | `app/api/customers/duplicates/route.ts` | `requireSession:7`, `authorize:7` |
| `/api/customers/import` | POST | `app/api/customers/import/route.ts` | `requireSession:14`, `authorize:14`, `withTenant:30`, `withTenant:31` |
| `/api/customers/merge` | POST | `app/api/customers/merge/route.ts` | `requireSession:9`, `authorizeCustomerMergeReview:9` |
| `/api/customers` | GET, POST | `app/api/customers/route.ts` | `requireSession:13`, `authorize:13`, `requireSession:24`, `authorize:24` |
| `/api/dashboard` | GET | `app/api/dashboard/route.ts` | `requireSession:14`, `authorize:15`, `authorize:18`, `authorize:19`, `withTenant:20`, `c.query:29` |
| `/api/demo/dashboard` | GET, POST, DELETE | `app/api/demo/dashboard/route.ts` |  |
| `/api/demo/data` | GET, POST, DELETE | `app/api/demo/data/route.ts` |  |
| `/api/demo/finance` | GET, POST, DELETE | `app/api/demo/finance/route.ts` |  |
| `/api/demo/platform-finance` | GET, POST, DELETE | `app/api/demo/platform-finance/route.ts` |  |
| `/api/demo/session` | GET, POST, DELETE | `app/api/demo/session/route.ts` |  |
| `/api/documents/[number]/credits` | POST | `app/api/documents/[number]/credits/route.ts` | `requireSession:9`, `withTenant:12` |
| `/api/documents/[number]/followups` | GET, POST | `app/api/documents/[number]/followups/route.ts` | `requireSession:10`, `withTenant:11`, `requireSession:14`, `withTenant:17` |
| `/api/documents/[number]/pdf` | GET | `app/api/documents/[number]/pdf/route.ts` | `requireSession:10`, `withTenant:11`, `authorize:14`, `c.query:16`, `c.query:19`, `c.query:22` |
| `/api/documents/[number]/refunds` | POST | `app/api/documents/[number]/refunds/route.ts` | `requireSession:9`, `withTenant:11` |
| `/api/documents/[number]/revision` | POST | `app/api/documents/[number]/revision/route.ts` | `requireSession:7`, `withTenant:8` |
| `/api/documents/[number]` | GET, PATCH, DELETE | `app/api/documents/[number]/route.ts` | `tenantList:18`, `requireSession:41`, `authorize:41`, `tenantList:42`, `tenantRpc:62`, `tenantRpc:88` |
| `/api/documents/[number]/send` | POST | `app/api/documents/[number]/send/route.ts` | `requireSession:21`, `withTenant:29`, `c.query:31`, `c.query:38`, `c.query:42`, `c.query:47`, `c.query:50`, `c.query:52`, `c.query:53`, `withTenant:64`, `withTenant:76`, `c.query:77`, `withTenant:83`, `c.query:84`, `c.query:86` |
| `/api/documents/[number]/status` | POST | `app/api/documents/[number]/status/route.ts` | `requireSession:7`, `withTenant:9` |
| `/api/documents/[number]/versions` | GET, POST | `app/api/documents/[number]/versions/route.ts` | `requireSession:14`, `authorize:14`, `withTenant:15`, `c.query:16`, `c.query:21`, `c.query:25`, `c.query:26`, `c.query:30`, `requireSession:37`, `authorize:37`, `withTenant:40`, `c.query:41`, `c.query:43`, `c.query:46`, `c.query:51`, `c.query:53`, `c.query:57` |
| `/api/documents/preview` | POST | `app/api/documents/preview/route.ts` | `requireSession:16`, `authorize:17`, `withTenant:22`, `c.query:29`, `c.query:30`, `c.query:32` |
| `/api/documents` | GET, POST | `app/api/documents/route.ts` | `tenantListPage:18`, `requireSession:34`, `authorize:34`, `tenantList:35`, `tenantRpc:55` |
| `/api/employees/[id]/allowances/[claimId]` | PATCH | `app/api/employees/[id]/allowances/[claimId]/route.ts` | `requireSession:7`, `withTenant:8` |
| `/api/employees/[id]/allowances` | POST | `app/api/employees/[id]/allowances/route.ts` | `requireSession:7`, `withTenant:8` |
| `/api/employees/[id]/employment/[periodId]` | PATCH | `app/api/employees/[id]/employment/[periodId]/route.ts` | `requireSession:10`, `authorize:10`, `withTenant:12` |
| `/api/employees/[id]/employment` | GET, POST | `app/api/employees/[id]/employment/route.ts` | `requireSession:10`, `authorize:10`, `withTenant:11`, `requireSession:14`, `authorize:14`, `withTenant:16` |
| `/api/employees/[id]/family/[childId]` | PATCH | `app/api/employees/[id]/family/[childId]/route.ts` | `requireSession:7`, `withTenant:8` |
| `/api/employees/[id]/family` | GET, POST | `app/api/employees/[id]/family/route.ts` | `requireSession:7`, `withTenant:7`, `requireSession:10`, `withTenant:11` |
| `/api/employees/[id]` | GET, PATCH | `app/api/employees/[id]/route.ts` | `tenantList:12` |
| `/api/employees/[id]/wages/[definitionId]` | PATCH | `app/api/employees/[id]/wages/[definitionId]/route.ts` | `requireSession:7`, `withTenant:8` |
| `/api/employees/[id]/wages` | GET, POST | `app/api/employees/[id]/wages/route.ts` | `requireSession:7`, `withTenant:7`, `requireSession:10`, `withTenant:11` |
| `/api/employees` | GET, POST | `app/api/employees/route.ts` | `tenantListPage:10` |
| `/api/expenses/[id]/reimbursement` | POST | `app/api/expenses/[id]/reimbursement/route.ts` | `requireSession:14`, `authorize:14`, `withTenant:23`, `c.query:25`, `c.query:34` |
| `/api/expenses/[id]` | GET, PATCH | `app/api/expenses/[id]/route.ts` | `tenantList:12` |
| `/api/expenses/billing` | GET | `app/api/expenses/billing/route.ts` | `requireSession:8`, `authorize:8`, `withTenant:10`, `c.query:10` |
| `/api/expenses/options` | GET | `app/api/expenses/options/route.ts` | `requireSession:6`, `authorize:6`, `withTenant:7`, `c.query:7` |
| `/api/expenses` | GET, POST | `app/api/expenses/route.ts` | `tenantListPage:10`, `tenantList:32` |
| `/api/expenses/scan-receipt` | POST | `app/api/expenses/scan-receipt/route.ts` | `requireSession:10`, `authorize:10` |
| `/api/files/[id]/download` | GET | `app/api/files/[id]/download/route.ts` | `requireSession:15`, `authorize:16`, `withTenant:17`, `client.query:17`, `authorize:26` |
| `/api/files/[id]` | PATCH, DELETE | `app/api/files/[id]/route.ts` | `requireSession:16`, `withTenant:21`, `c.query:22`, `c.query:25`, `c.query:29`, `requireSession:38`, `withTenant:40`, `c.query:41`, `c.query:42`, `c.query:43`, `c.query:48`, `c.query:49`, `authorize:53`, `c.query:56`, `c.query:60`, `c.query:65`, `c.query:71` |
| `/api/files` | GET, POST | `app/api/files/route.ts` | `requireSession:25`, `authorize:25`, `withTenant:42`, `c.query:42`, `requireSession:47`, `authorize:58`, `authorize:62`, `withTenant:65`, `c.query:65`, `authorize:68`, `withTenant:78`, `c.query:80`, `c.query:86`, `c.query:91`, `c.query:96`, `c.query:99`, `c.query:103`, `c.query:105`, `c.query:106`, `c.query:107`, `c.query:108` |
| `/api/finance/overview` | GET | `app/api/finance/overview/route.ts` | `requireSession:11`, `authorize:11`, `withTenant:13`, `authorize:16`, `authorize:17` |
| `/api/finance` | GET | `app/api/finance/route.ts` | `requireSession:7`, `authorize:7`, `withTenant:7` |
| `/api/health/ready` | GET | `app/api/health/ready/route.ts` | `query:26` |
| `/api/health` | GET | `app/api/health/route.ts` |  |
| `/api/integrations/status` | GET | `app/api/integrations/status/route.ts` |  |
| `/api/notifications/[id]` | PATCH | `app/api/notifications/[id]/route.ts` | `requireSession:11`, `withTenant:12` |
| `/api/notifications/followups` | POST | `app/api/notifications/followups/route.ts` | `requireSession:9`, `withTenant:10` |
| `/api/notifications/push` | GET, POST, DELETE | `app/api/notifications/push/route.ts` | `requireSession:15`, `withTenant:16`, `c.query:16`, `requireSession:25`, `withTenant:34`, `c.query:35`, `requireSession:53`, `withTenant:54`, `c.query:54` |
| `/api/notifications` | GET, PATCH | `app/api/notifications/route.ts` | `requireSession:8`, `withTenant:8`, `requireSession:9`, `withTenant:9` |
| `/api/operator/accounts/[id]` | PATCH | `app/api/operator/accounts/[id]/route.ts` | `requireOperatorSession:13`, `authorizeOperator:13`, `authorizeOperator:30`, `withPlatform:40`, `c.query:41`, `c.query:42`, `c.query:46` |
| `/api/operator/accounts` | GET | `app/api/operator/accounts/route.ts` | `requireOperatorSession:7`, `authorizeOperator:7` |
| `/api/operator/announcements` | GET, POST | `app/api/operator/announcements/route.ts` | `requireOperatorSession:2`, `authorizeOperator:2`, `query:2`, `requireOperatorSession:3`, `authorizeOperator:3`, `withPlatform:3`, `client.query:3`, `client.query:3` |
| `/api/operator/audit` | GET | `app/api/operator/audit/route.ts` | `requireOperatorSession:2`, `authorizeOperator:2`, `query:2` |
| `/api/operator/customers/[id]` | GET | `app/api/operator/customers/[id]/route.ts` | `requireOperatorSession:8`, `authorizeOperator:8` |
| `/api/operator/customers` | GET | `app/api/operator/customers/route.ts` | `requireOperatorSession:7`, `authorizeOperator:7` |
| `/api/operator/dashboard` | GET | `app/api/operator/dashboard/route.ts` | `requireOperatorSession:7`, `authorizeOperator:7`, `withPlatform:9`, `c.query:10`, `c.query:11`, `c.query:12`, `c.query:18`, `c.query:19`, `c.query:20` |
| `/api/operator/demo-session` | GET, POST, DELETE | `app/api/operator/demo-session/route.ts` |  |
| `/api/operator/finance` | GET | `app/api/operator/finance/route.ts` | `requireOperatorSession:8`, `authorizeOperator:8`, `withPlatform:9`, `c.query:11`, `c.query:12`, `c.query:13` |
| `/api/operator/integrations/email-test` | POST | `app/api/operator/integrations/email-test/route.ts` | `authorizeOperator:9`, `requireOperatorSession:11` |
| `/api/operator/logout` | POST | `app/api/operator/logout/route.ts` |  |
| `/api/operator/maintenance` | GET, POST | `app/api/operator/maintenance/route.ts` | `requireOperatorSession:10`, `authorizeOperator:10`, `requireOperatorSession:12`, `authorizeOperator:12`, `withPlatform:17`, `client.query:18` |
| `/api/operator/monitoring` | GET | `app/api/operator/monitoring/route.ts` | `requireOperatorSession:6`, `authorizeOperator:6` |
| `/api/operator/notifications/push` | GET, POST | `app/api/operator/notifications/push/route.ts` | `requireOperatorSession:14`, `authorizeOperator:14`, `withPlatform:16`, `c.query:16`, `requireOperatorSession:24`, `authorizeOperator:24` |
| `/api/operator/payments` | GET | `app/api/operator/payments/route.ts` | `requireOperatorSession:7`, `authorizeOperator:7` |
| `/api/operator/preferences` | GET, PATCH | `app/api/operator/preferences/route.ts` | `requireOperatorSession:10`, `authorizeOperator:10`, `withPlatform:11`, `c.query:11`, `requireOperatorSession:16`, `authorizeOperator:16`, `withPlatform:19`, `c.query:20`, `c.query:23` |
| `/api/operator/restrictions/[id]` | PATCH | `app/api/operator/restrictions/[id]/route.ts` | `requireOperatorSession:10`, `authorizeOperator:10`, `withPlatform:12`, `c.query:13`, `c.query:15` |
| `/api/operator/restrictions` | GET, POST | `app/api/operator/restrictions/route.ts` | `requireOperatorSession:10`, `authorizeOperator:10`, `withPlatform:11`, `requireOperatorSession:16`, `authorizeOperator:16`, `withPlatform:23`, `c.query:24` |
| `/api/operator/sso/callback` | GET | `app/api/operator/sso/callback/route.ts` | `client.query:17`, `client.query:22`, `client.query:32` |
| `/api/operator/tickets/[id]/messages` | POST | `app/api/operator/tickets/[id]/messages/route.ts` | `authorizeOperator:13`, `withPlatform:22` |
| `/api/operator/tickets/[id]` | GET, PATCH | `app/api/operator/tickets/[id]/route.ts` | `requireOperatorSession:14`, `authorizeOperator:14`, `requireOperatorSession:32`, `authorizeOperator:32`, `withPlatform:48` |
| `/api/operator/tickets` | GET | `app/api/operator/tickets/route.ts` | `requireOperatorSession:7`, `authorizeOperator:7` |
| `/api/operator/users` | GET, POST | `app/api/operator/users/route.ts` | `requireOperatorSession:10`, `authorizeOperator:11`, `query:12` |
| `/api/payments/[id]` | GET | `app/api/payments/[id]/route.ts` | `tenantList:7` |
| `/api/payments` | GET, POST | `app/api/payments/route.ts` | `tenantListPage:9`, `tenantList:27`, `tenantList:31`, `tenantRpc:34` |
| `/api/products/[id]` | GET, PATCH | `app/api/products/[id]/route.ts` | `tenantList:10` |
| `/api/products` | GET, POST | `app/api/products/route.ts` | `tenantListPage:8` |
| `/api/projects/[id]/milestones/[milestoneId]` | POST | `app/api/projects/[id]/milestones/[milestoneId]/route.ts` | `requireSession:9`, `authorize:9`, `withTenant:10`, `c.query:11`, `c.query:13` |
| `/api/projects/[id]` | GET, PATCH | `app/api/projects/[id]/route.ts` | `requireSession:9`, `authorize:9`, `withTenant:9`, `requireSession:10`, `authorize:10`, `withTenant:10` |
| `/api/projects` | GET, POST | `app/api/projects/route.ts` | `requireSession:13`, `authorize:13`, `withTenant:13`, `requireSession:14`, `authorize:14`, `withTenant:16`, `c.query:17`, `c.query:17`, `c.query:18`, `c.query:21` |
| `/api/public/offer` | POST | `app/api/public/offer/route.ts` | `c.query:19`, `c.query:25` |
| `/api/public/report` | POST | `app/api/public/report/route.ts` |  |
| `/api/reports/exports/[id]` | GET | `app/api/reports/exports/[id]/route.ts` | `requireSession:9`, `withTenant:10` |
| `/api/reports/exports/[id]/send` | GET, POST | `app/api/reports/exports/[id]/send/route.ts` | `requireSession:8`, `requireSession:10` |
| `/api/reports/exports/[id]/share` | GET, POST | `app/api/reports/exports/[id]/share/route.ts` | `requireSession:8`, `requireSession:10` |
| `/api/reports/exports` | POST | `app/api/reports/exports/route.ts` | `requireSession:10`, `authorize:10`, `['query','locale'].includes:13` |
| `/api/reports` | GET | `app/api/reports/route.ts` | `requireSession:15`, `authorize:15`, `withTenant:18`, `query.get:19`, `query.get:20`, `query.get:21`, `withTenant:22`, `c.query:22`, `query.get:22`, `query.get:22`, `query.get:23` |
| `/api/search` | GET | `app/api/search/route.ts` | `requireSession:14`, `withTenant:18` |
| `/api/settings/company` | GET, PATCH | `app/api/settings/company/route.ts` | `requireSession:17`, `authorize:17`, `withTenant:18`, `c.query:18`, `requireSession:25`, `authorize:25`, `withTenant:37`, `c.query:40`, `c.query:47`, `c.query:51`, `c.query:53` |
| `/api/settings/documents` | GET, PATCH | `app/api/settings/documents/route.ts` | `requireSession:12`, `authorize:12`, `withTenant:12`, `c.query:12`, `requireSession:13`, `authorize:13`, `withTenant:13`, `c.query:13` |
| `/api/settings/notifications` | GET, PATCH | `app/api/settings/notifications/route.ts` | `requireSession:8`, `withTenant:8`, `c.query:8`, `requireSession:9`, `withTenant:9`, `c.query:9`, `c.query:9` |
| `/api/settings/profile` | GET, PATCH | `app/api/settings/profile/route.ts` |  |
| `/api/settings/readiness` | GET, PATCH | `app/api/settings/readiness/route.ts` | `requireSession:7`, `withTenant:7`, `requireSession:11`, `withTenant:11` |
| `/api/settings/security` | GET, PATCH | `app/api/settings/security/route.ts` | `requireSession:7`, `authorize:7`, `requireSession:11`, `authorize:11` |
| `/api/settings/subscription` | GET | `app/api/settings/subscription/route.ts` | `requireSession:7`, `authorize:7`, `withTenant:8`, `c.query:8` |
| `/api/settings/team/invitations/[id]` | POST, DELETE | `app/api/settings/team/invitations/[id]/route.ts` | `requireSession:11`, `authorize:11`, `requireSession:15`, `authorize:15`, `withTenant:16`, `c.query:17`, `c.query:18`, `c.query:19` |
| `/api/settings/team/invitations` | GET, POST | `app/api/settings/team/invitations/route.ts` | `requireSession:11`, `authorize:11`, `withTenant:11`, `c.query:11`, `c.query:11`, `c.query:11`, `requireSession:12`, `authorize:12` |
| `/api/settings/team/members/[userId]` | PATCH | `app/api/settings/team/members/[userId]/route.ts` | `requireSession:10`, `authorize:10`, `withTenant:13`, `c.query:14`, `c.query:16`, `c.query:26`, `c.query:27`, `c.query:28`, `c.query:29`, `c.query:30`, `c.query:31`, `c.query:32`, `c.query:40`, `c.query:42` |
| `/api/settings/team/members/[userId]/sensitive-access` | GET, PATCH | `app/api/settings/team/members/[userId]/sensitive-access/route.ts` | `requireSession:12`, `authorizeWorkforceManagement:12`, `withTenant:13`, `c.query:13`, `requireSession:19`, `authorizeWorkforceManagement:19`, `withTenant:21`, `c.query:24`, `c.query:30`, `c.query:32` |
| `/api/suppliers/[id]/bank` | GET, PATCH | `app/api/suppliers/[id]/bank/route.ts` | `requireSession:14`, `authorize:14`, `authorize:14`, `withTenant:16`, `c.query:16`, `requireSession:22`, `authorize:22`, `authorize:22`, `withTenant:28`, `c.query:31`, `c.query:34` |
| `/api/suppliers/[id]/invoices/[invoiceId]/match` | GET, POST | `app/api/suppliers/[id]/invoices/[invoiceId]/match/route.ts` | `requireSession:10`, `authorize:10`, `withTenant:11`, `requireSession:14`, `authorize:14`, `withTenant:15` |
| `/api/suppliers/[id]/invoices/[invoiceId]/review` | GET, POST | `app/api/suppliers/[id]/invoices/[invoiceId]/review/route.ts` | `requireSession:3`, `withTenant:3`, `requireSession:4`, `withTenant:4` |
| `/api/suppliers/[id]/invoices` | GET, POST | `app/api/suppliers/[id]/invoices/route.ts` | `requireSession:9`, `authorize:9`, `withTenant:10`, `requireSession:13`, `authorize:13`, `withTenant:14` |
| `/api/suppliers/[id]/resources/[resourceId]/assignments` | POST, PATCH | `app/api/suppliers/[id]/resources/[resourceId]/assignments/route.ts` | `requireSession:8`, `withTenant:9` |
| `/api/suppliers/[id]/resources/[resourceId]` | PATCH | `app/api/suppliers/[id]/resources/[resourceId]/route.ts` | `requireSession:8`, `withTenant:9` |
| `/api/suppliers/[id]/resources` | GET, POST | `app/api/suppliers/[id]/resources/route.ts` | `requireSession:8`, `withTenant:9`, `requireSession:12`, `withTenant:13` |
| `/api/suppliers/[id]` | GET, PATCH | `app/api/suppliers/[id]/route.ts` | `requireSession:9`, `authorize:9`, `withTenant:10`, `requireSession:13`, `authorize:13`, `withTenant:15` |
| `/api/suppliers/approval-policy` | GET, POST | `app/api/suppliers/approval-policy/route.ts` | `requireSession:7`, `withTenant:7`, `requireSession:8`, `withTenant:8` |
| `/api/suppliers` | GET, POST | `app/api/suppliers/route.ts` | `requireSession:9`, `authorize:9`, `withTenant:10`, `requireSession:13`, `authorize:13`, `withTenant:15` |
| `/api/support/tickets/[id]/messages` | GET, POST | `app/api/support/tickets/[id]/messages/route.ts` | `requireSession:9`, `authorize:9`, `withTenant:10`, `c.query:10`, `requireSession:13`, `authorize:13`, `withTenant:14`, `c.query:16`, `c.query:18`, `c.query:19` |
| `/api/support/tickets/[id]` | PATCH | `app/api/support/tickets/[id]/route.ts` | `requireSession:10`, `authorize:10`, `withTenant:14`, `c.query:15`, `c.query:19` |
| `/api/support/tickets` | GET, POST | `app/api/support/tickets/route.ts` | `tenantListPage:11`, `requireSession:15`, `authorize:15`, `withTenant:23`, `c.query:24`, `c.query:24`, `c.query:25` |
| `/api/telemetry/web-vitals` | POST | `app/api/telemetry/web-vitals/route.ts` | `query:11` |
| `/api/time-entries/[id]/pricing` | GET, POST | `app/api/time-entries/[id]/pricing/route.ts` | `requireSession:7`, `withTenant:9`, `requireSession:12`, `withTenant:13` |
| `/api/time-entries/[id]` | PATCH | `app/api/time-entries/[id]/route.ts` | `requireSession:7`, `withTenant:10` |
| `/api/time-entries/billing` | GET | `app/api/time-entries/billing/route.ts` | `requireSession:12`, `authorize:12`, `withTenant:17`, `c.query:17`, `c.query:30` |
| `/api/time-entries/options` | GET | `app/api/time-entries/options/route.ts` | `requireSession:9`, `authorize:9`, `withTenant:11`, `withTenant:14`, `c.query:22`, `c.query:23` |
| `/api/time-entries/policy` | GET, PATCH | `app/api/time-entries/policy/route.ts` | `requireSession:7`, `authorize:7`, `withTenant:8`, `c.query:8`, `requireSession:12`, `authorize:12`, `withTenant:15`, `c.query:16` |
| `/api/time-entries/review` | POST | `app/api/time-entries/review/route.ts` | `requireSession:12`, `authorize:12`, `withTenant:16` |
| `/api/time-entries` | GET, POST | `app/api/time-entries/route.ts` | `requireSession:16`, `authorize:16`, `withTenant:17`, `requireSession:22`, `authorize:22`, `withTenant:25`, `withTenant:36`, `c.query:38`, `c.query:38`, `c.query:42`, `c.query:45`, `c.query:51`, `c.query:54`, `c.query:55`, `c.query:59` |
| `/api/time-tracker` | GET, POST | `app/api/time-tracker/route.ts` | `requireSession:13`, `authorize:13`, `withTenant:14`, `c.query:15`, `requireSession:22`, `authorize:22`, `withTenant:25`, `c.query:26`, `c.query:27`, `c.query:34`, `c.query:37`, `c.query:42`, `c.query:47`, `c.query:48`, `c.query:48`, `c.query:53`, `c.query:58` |
| `/api/workforce-assignments` | GET, POST, PATCH | `app/api/workforce-assignments/route.ts` | `requireSession:12`, `authorizeWorkforceManagement:12`, `withTenant:13`, `c.query:14`, `c.query:15`, `c.query:16`, `requireSession:21`, `authorizeWorkforceManagement:21`, `withTenant:25`, `withTenant:30`, `c.query:31`, `c.query:32`, `c.query:34`, `c.query:35`, `c.query:36`, `c.query:37`, `requireSession:43`, `authorizeWorkforceManagement:43`, `withTenant:44`, `c.query:45` |

Full import closure, query arguments, client consumers, migration relations and RLS declarations: `v21-3-data-inventory.json`. Absence of direct evidence in this table does not mean authorization is absent: inspect delegated handlers in the JSON.
