# V21.3 API inventory

Static AST/source inventory, not proof that every runtime branch is tested. Calls include exact source arguments and locations; dynamic dispatch requires the domain matrix and runtime tests.

95 API route files, 21 client consumers, 46 migrations, 95 declared tables.

| Endpoint | Methods | Source | Direct data/auth evidence |
|---|---|---|---|
| `/api/auth/invitation` | GET, POST | `app/api/auth/invitation/route.ts` | `withPlatform:10`, `c.query:11`, `c.query:15`, `withPlatform:34`, `c.query:35`, `c.query:37`, `c.query:38`, `c.query:40`, `c.query:42`, `c.query:44`, `c.query:46`, `c.query:48`, `c.query:50`, `c.query:51` |
| `/api/auth/login` | POST | `app/api/auth/login/route.ts` | `query:24`, `query:48`, `query:49`, `query:59`, `query:71`, `query:72` |
| `/api/auth/logout` | POST | `app/api/auth/logout/route.ts` |  |
| `/api/auth/mfa/confirm` | POST | `app/api/auth/mfa/confirm/route.ts` | `query:19`, `query:25` |
| `/api/auth/mfa` | GET, DELETE | `app/api/auth/mfa/route.ts` | `query:11` |
| `/api/auth/mfa/setup` | POST | `app/api/auth/mfa/setup/route.ts` | `query:18` |
| `/api/auth/password` | PATCH | `app/api/auth/password/route.ts` | `requireSession:14`, `query:18`, `c.query:21`, `c.query:21`, `query:26`, `query:27` |
| `/api/auth/recover` | POST | `app/api/auth/recover/route.ts` | `query:15` |
| `/api/auth/register` | POST | `app/api/auth/register/route.ts` | `query:33` |
| `/api/auth/resend-verification` | POST | `app/api/auth/resend-verification/route.ts` | `query:18` |
| `/api/auth/session` | GET | `app/api/auth/session/route.ts` |  |
| `/api/auth/sessions/[id]` | DELETE | `app/api/auth/sessions/[id]/route.ts` | `requireSession:11`, `query:16` |
| `/api/auth/sessions` | GET, DELETE | `app/api/auth/sessions/route.ts` | `requireSession:10`, `query:11`, `requireSession:44`, `query:45` |
| `/api/auth/verify-email` | POST | `app/api/auth/verify-email/route.ts` | `query:13`, `query:21`, `query:22`, `query:35` |
| `/api/billing/catalog` | GET | `app/api/billing/catalog/route.ts` | `requireSession:8`, `authorize:8` |
| `/api/billing/checkout` | POST | `app/api/billing/checkout/route.ts` | `requireSession:15`, `authorize:15`, `query:22`, `withTenant:25` |
| `/api/billing/portal` | POST | `app/api/billing/portal/route.ts` | `requireSession:1`, `authorize:1`, `query:1` |
| `/api/billing/webhook` | POST | `app/api/billing/webhook/route.ts` | `withPlatform:14` |
| `/api/customers/[id]/activity` | GET | `app/api/customers/[id]/activity/route.ts` | `requireSession:6`, `authorize:6`, `withTenant:7`, `c.query:15` |
| `/api/customers/[id]/contacts/[contactId]` | PATCH, DELETE | `app/api/customers/[id]/contacts/[contactId]/route.ts` | `authorize:8`, `authorize:11` |
| `/api/customers/[id]/contacts` | GET, POST | `app/api/customers/[id]/contacts/route.ts` | `tenantList:13`, `authorize:27` |
| `/api/customers/[id]/documents` | GET | `app/api/customers/[id]/documents/route.ts` | `tenantList:7` |
| `/api/customers/[id]` | GET, PATCH, DELETE | `app/api/customers/[id]/route.ts` | `requireSession:11`, `authorize:11`, `tenantList:11`, `requireSession:15`, `authorize:15`, `requireSession:22`, `authorize:22` |
| `/api/customers` | GET, POST | `app/api/customers/route.ts` | `requireSession:10`, `authorize:10`, `requireSession:15`, `authorize:15` |
| `/api/dashboard` | GET | `app/api/dashboard/route.ts` | `requireSession:11`, `authorize:13`, `authorize:14`, `withTenant:15` |
| `/api/demo/dashboard` | GET | `app/api/demo/dashboard/route.ts` |  |
| `/api/demo/data` | GET | `app/api/demo/data/route.ts` |  |
| `/api/demo/finance` | GET | `app/api/demo/finance/route.ts` |  |
| `/api/demo/platform-finance` | GET | `app/api/demo/platform-finance/route.ts` | `withPlatform:7`, `c.query:8`, `c.query:9` |
| `/api/demo/session` | GET, POST, DELETE | `app/api/demo/session/route.ts` |  |
| `/api/documents/[number]/pdf` | GET | `app/api/documents/[number]/pdf/route.ts` | `requireSession:10`, `withTenant:11`, `authorize:14`, `c.query:15` |
| `/api/documents/[number]` | GET, PATCH | `app/api/documents/[number]/route.ts` | `tenantList:14`, `tenantList:37`, `tenantRpc:54` |
| `/api/documents/[number]/send` | POST | `app/api/documents/[number]/send/route.ts` | `requireSession:14`, `withTenant:18`, `c.query:20`, `c.query:24`, `c.query:26`, `c.query:28`, `withTenant:37`, `c.query:37`, `withTenant:40`, `c.query:41`, `c.query:43` |
| `/api/documents/[number]/status` | POST | `app/api/documents/[number]/status/route.ts` | `requireSession:7`, `withTenant:9` |
| `/api/documents/preview` | POST | `app/api/documents/preview/route.ts` | `requireSession:13`, `authorize:14`, `withTenant:21`, `c.query:22`, `c.query:23`, `c.query:25` |
| `/api/documents` | GET, POST | `app/api/documents/route.ts` | `tenantList:15`, `tenantList:32`, `tenantRpc:49` |
| `/api/employees/[id]` | GET, PATCH | `app/api/employees/[id]/route.ts` | `tenantList:12` |
| `/api/employees` | GET, POST | `app/api/employees/route.ts` | `tenantList:10` |
| `/api/expenses/[id]/reimbursement` | POST | `app/api/expenses/[id]/reimbursement/route.ts` | `requireSession:9`, `authorize:9`, `withTenant:12`, `c.query:13`, `c.query:17` |
| `/api/expenses/[id]` | GET, PATCH | `app/api/expenses/[id]/route.ts` | `tenantList:11` |
| `/api/expenses/billing` | GET | `app/api/expenses/billing/route.ts` | `requireSession:8`, `authorize:8`, `withTenant:10`, `c.query:10` |
| `/api/expenses/options` | GET | `app/api/expenses/options/route.ts` | `requireSession:6`, `authorize:6`, `withTenant:7`, `c.query:7` |
| `/api/expenses` | GET, POST | `app/api/expenses/route.ts` | `tenantList:9`, `tenantList:30` |
| `/api/expenses/scan-receipt` | POST | `app/api/expenses/scan-receipt/route.ts` | `requireSession:9`, `authorize:9` |
| `/api/files/[id]/download` | GET | `app/api/files/[id]/download/route.ts` | `requireSession:13`, `authorize:14`, `withTenant:15`, `client.query:15`, `authorize:21` |
| `/api/files` | GET, POST | `app/api/files/route.ts` | `requireSession:17`, `authorize:17`, `authorize:19`, `withTenant:22`, `c.query:22`, `requireSession:27`, `authorize:33`, `authorize:36`, `withTenant:38`, `c.query:38`, `authorize:41`, `withTenant:46`, `c.query:48`, `c.query:52`, `c.query:54`, `c.query:55`, `c.query:56` |
| `/api/finance/overview` | GET | `app/api/finance/overview/route.ts` | `requireSession:11`, `authorize:11`, `withTenant:13`, `authorize:16`, `authorize:16` |
| `/api/finance` | GET | `app/api/finance/route.ts` | `requireSession:7`, `authorize:7`, `withTenant:7` |
| `/api/health/ready` | GET | `app/api/health/ready/route.ts` | `query:26` |
| `/api/health` | GET | `app/api/health/route.ts` |  |
| `/api/integrations/status` | GET | `app/api/integrations/status/route.ts` |  |
| `/api/notifications/[id]` | PATCH | `app/api/notifications/[id]/route.ts` | `requireSession:10`, `withTenant:11`, `c.query:11` |
| `/api/notifications` | GET, PATCH | `app/api/notifications/route.ts` | `requireSession:7`, `withTenant:7`, `c.query:7`, `requireSession:8`, `withTenant:8`, `c.query:8`, `withTenant:8`, `c.query:8` |
| `/api/operator/accounts/[id]` | PATCH | `app/api/operator/accounts/[id]/route.ts` | `requireOperatorSession:10`, `authorizeOperator:10` |
| `/api/operator/accounts` | GET | `app/api/operator/accounts/route.ts` | `requireOperatorSession:7`, `authorizeOperator:7` |
| `/api/operator/announcements` | GET, POST | `app/api/operator/announcements/route.ts` | `requireOperatorSession:2`, `authorizeOperator:2`, `query:2`, `requireOperatorSession:3`, `authorizeOperator:3`, `query:3` |
| `/api/operator/audit` | GET | `app/api/operator/audit/route.ts` | `requireOperatorSession:2`, `authorizeOperator:2`, `query:2` |
| `/api/operator/customers/[id]` | GET | `app/api/operator/customers/[id]/route.ts` | `requireOperatorSession:8`, `authorizeOperator:8` |
| `/api/operator/customers` | GET | `app/api/operator/customers/route.ts` | `requireOperatorSession:7`, `authorizeOperator:7` |
| `/api/operator/dashboard` | GET | `app/api/operator/dashboard/route.ts` | `requireOperatorSession:6`, `authorizeOperator:6`, `withPlatform:7`, `c.query:8`, `c.query:9`, `c.query:10`, `c.query:16`, `c.query:17`, `c.query:18` |
| `/api/operator/demo-session` | POST | `app/api/operator/demo-session/route.ts` |  |
| `/api/operator/finance` | GET | `app/api/operator/finance/route.ts` | `requireOperatorSession:8`, `authorizeOperator:8`, `withPlatform:9`, `c.query:11`, `c.query:12`, `c.query:13` |
| `/api/operator/integrations/email-test` | POST | `app/api/operator/integrations/email-test/route.ts` | `authorizeOperator:9`, `requireOperatorSession:11` |
| `/api/operator/logout` | POST | `app/api/operator/logout/route.ts` |  |
| `/api/operator/monitoring` | GET | `app/api/operator/monitoring/route.ts` | `requireOperatorSession:15`, `authorizeOperator:15`, `withPlatform:17`, `c.query:18`, `c.query:19`, `c.query:20` |
| `/api/operator/payments` | GET | `app/api/operator/payments/route.ts` | `requireOperatorSession:7`, `authorizeOperator:7` |
| `/api/operator/restrictions/[id]` | PATCH | `app/api/operator/restrictions/[id]/route.ts` | `authorizeOperator:9`, `requireOperatorSession:14` |
| `/api/operator/restrictions` | GET, POST | `app/api/operator/restrictions/route.ts` | `authorizeOperator:11`, `authorizeOperator:22`, `requireOperatorSession:27` |
| `/api/operator/sso/callback` | GET | `app/api/operator/sso/callback/route.ts` | `client.query:15`, `client.query:20`, `client.query:30` |
| `/api/operator/tickets/[id]/messages` | POST | `app/api/operator/tickets/[id]/messages/route.ts` | `authorizeOperator:11`, `requireOperatorSession:20` |
| `/api/operator/tickets/[id]` | GET, PATCH | `app/api/operator/tickets/[id]/route.ts` | `requireOperatorSession:10`, `authorizeOperator:10`, `requireOperatorSession:28`, `authorizeOperator:28` |
| `/api/operator/tickets` | GET | `app/api/operator/tickets/route.ts` | `requireOperatorSession:7`, `authorizeOperator:7` |
| `/api/operator/users` | GET, POST | `app/api/operator/users/route.ts` | `requireOperatorSession:10`, `authorizeOperator:11`, `query:12` |
| `/api/payments/[id]` | GET | `app/api/payments/[id]/route.ts` | `tenantList:7` |
| `/api/payments` | GET, POST | `app/api/payments/route.ts` | `tenantList:8`, `tenantList:25`, `tenantList:29`, `tenantRpc:32` |
| `/api/products/[id]` | GET, PATCH | `app/api/products/[id]/route.ts` | `tenantList:10` |
| `/api/products` | GET, POST | `app/api/products/route.ts` | `tenantList:8` |
| `/api/projects` | GET, POST | `app/api/projects/route.ts` | `requireSession:9`, `authorize:9`, `withTenant:9`, `c.query:9`, `requireSession:14`, `authorize:14`, `withTenant:15`, `c.query:16`, `c.query:16`, `c.query:17`, `c.query:18` |
| `/api/search` | GET | `app/api/search/route.ts` | `requireSession:14`, `withTenant:18` |
| `/api/settings/company` | GET, PATCH | `app/api/settings/company/route.ts` | `requireSession:12`, `authorize:12`, `withTenant:13`, `c.query:13`, `requireSession:20`, `authorize:20`, `withTenant:26`, `c.query:26` |
| `/api/settings/documents` | GET, PATCH | `app/api/settings/documents/route.ts` | `requireSession:11`, `authorize:11`, `withTenant:11`, `c.query:11`, `requireSession:12`, `authorize:12`, `withTenant:12`, `c.query:12` |
| `/api/settings/notifications` | GET, PATCH | `app/api/settings/notifications/route.ts` | `requireSession:6`, `withTenant:6`, `c.query:6`, `requireSession:7`, `withTenant:7`, `c.query:7` |
| `/api/settings/profile` | GET, PATCH | `app/api/settings/profile/route.ts` |  |
| `/api/settings/subscription` | GET | `app/api/settings/subscription/route.ts` | `requireSession:6`, `authorize:6`, `withTenant:7`, `c.query:7` |
| `/api/settings/team/invitations/[id]` | DELETE | `app/api/settings/team/invitations/[id]/route.ts` | `requireSession:8`, `authorize:8`, `withTenant:9`, `c.query:10` |
| `/api/settings/team/invitations` | GET, POST | `app/api/settings/team/invitations/route.ts` | `requireSession:9`, `authorize:9`, `withTenant:9`, `c.query:9`, `c.query:9`, `c.query:9`, `requireSession:10`, `authorize:10`, `withTenant:10`, `c.query:11`, `c.query:12`, `c.query:14`, `c.query:15`, `c.query:16`, `withTenant:16`, `c.query:16` |
| `/api/settings/team/members/[userId]` | PATCH | `app/api/settings/team/members/[userId]/route.ts` | `requireSession:8`, `authorize:8`, `withTenant:8`, `c.query:8`, `c.query:8` |
| `/api/support/tickets/[id]/messages` | GET, POST | `app/api/support/tickets/[id]/messages/route.ts` | `requireSession:7`, `authorize:7`, `withTenant:8`, `c.query:8`, `requireSession:11`, `authorize:11`, `withTenant:12`, `c.query:13`, `c.query:14` |
| `/api/support/tickets` | GET, POST | `app/api/support/tickets/route.ts` | `requireSession:8`, `authorize:8`, `withTenant:8`, `c.query:8`, `requireSession:12`, `authorize:12`, `withTenant:19`, `c.query:20`, `c.query:21` |
| `/api/telemetry/web-vitals` | POST | `app/api/telemetry/web-vitals/route.ts` | `query:12` |
| `/api/time-entries/[id]` | PATCH | `app/api/time-entries/[id]/route.ts` | `requireSession:12`, `authorize:12`, `withTenant:18`, `c.query:19` |
| `/api/time-entries/billing` | GET | `app/api/time-entries/billing/route.ts` | `requireSession:10`, `authorize:10`, `withTenant:12`, `c.query:12` |
| `/api/time-entries/policy` | GET, PATCH | `app/api/time-entries/policy/route.ts` | `requireSession:7`, `authorize:7`, `withTenant:7`, `c.query:7`, `requireSession:8`, `authorize:8`, `withTenant:8`, `c.query:8` |
| `/api/time-entries` | GET, POST | `app/api/time-entries/route.ts` | `requireSession:11`, `authorize:11`, `withTenant:12`, `c.query:12`, `requireSession:25`, `authorize:25`, `withTenant:33`, `c.query:35`, `c.query:35`, `c.query:38`, `c.query:44`, `c.query:45`, `c.query:46`, `c.query:50` |
| `/api/time-tracker` | GET, POST | `app/api/time-tracker/route.ts` | `requireSession:10`, `authorize:10`, `withTenant:11`, `c.query:12`, `requireSession:19`, `authorize:19`, `withTenant:22`, `c.query:23`, `c.query:24`, `c.query:30`, `c.query:33`, `c.query:38`, `c.query:39`, `c.query:39`, `c.query:46` |

Full import closure, query arguments, client consumers, migration relations and RLS declarations: `v21-3-data-inventory.json`. Absence of direct evidence in this table does not mean authorization is absent: inspect delegated handlers in the JSON.
