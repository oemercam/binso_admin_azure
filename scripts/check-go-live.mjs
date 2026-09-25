import fs from 'node:fs'

const checks = [
  ['database/migrations/0007_subscription_lifecycle.sql', "'expired'"],
  ['app/subscription-required/page.tsx', '/api/billing/checkout'],
  ['app/post-login/page.tsx', "redirect('/subscription-required')"],
  ['lib/auth/tenant-server.ts', 'resolveMembershipContext'],
  ['app/api/internal/lifecycle/route.ts', 'isInternalJobAuthorized'],
  ['lib/auth/internal-job.ts', 'serverEnv.internalJobSecret'],
  ['lib/db/repositories/subscription-lifecycle.ts', 'trial.expired'],
  ['lib/email/graph.ts', 'graph.microsoft.com/v1.0/users'],
  ['scripts/production-preflight.mjs', 'Production preflight passed'],
  ['.github/workflows/main_binso-admin-prod.yml', 'Apply database migrations'],
  ['.github/workflows/binso-one-lifecycle.yml', '/api/internal/lifecycle'],
]

for (const [file, needle] of checks) {
  if (!fs.existsSync(file)) {
    console.error(`FAIL: ${file} is missing`)
    process.exit(1)
  }
  const source = fs.readFileSync(file, 'utf8')
  if (!source.includes(needle)) {
    console.error(`FAIL: ${file} does not contain expected production invariant: ${needle}`)
    process.exit(1)
  }
}

const env = fs.readFileSync('.env.example', 'utf8')
for (const key of ['INTERNAL_JOB_SECRET=', 'EMAIL_DELIVERY_MODE=', 'GRAPH_TENANT_ID=', 'GRAPH_CLIENT_ID=', 'GRAPH_CLIENT_SECRET=', 'GRAPH_SENDER_USER_ID=']) {
  if (!env.includes(key)) {
    console.error(`FAIL: .env.example is missing ${key}`)
    process.exit(1)
  }
}

console.log('Go-live checks passed (billing recovery, migrations, lifecycle, Graph mail and preflight).')
