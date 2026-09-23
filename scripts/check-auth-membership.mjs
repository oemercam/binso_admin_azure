import fs from 'node:fs'

const requiredFiles = [
  'database/migrations/0002_auth_memberships.sql',
  'lib/db/repositories/users.ts',
  'lib/db/repositories/onboarding.ts',
  'app/api/auth/session/route.ts',
  'app/api/onboarding/route.ts',
  'app/api/registration/route.ts',
]

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) throw new Error(`Missing authentication foundation file: ${file}`)
}

const registration = fs.readFileSync('app/api/registration/route.ts', 'utf8')
if (!registration.includes("email !== session.user.email.trim().toLowerCase()")) {
  throw new Error('Registration must bind the requested owner email to the authenticated identity')
}

const onboarding = fs.readFileSync('app/api/onboarding/route.ts', 'utf8')
if (!onboarding.includes('createTrialOrganization')) throw new Error('Onboarding must persist the organization server-side')
if (!onboarding.includes('signupId')) throw new Error('Onboarding must consume a persisted registration')

const repository = fs.readFileSync('lib/db/repositories/onboarding.ts', 'utf8')
for (const invariant of ['organization_memberships', 'organization_subscriptions', 'organization_entitlements', 'platform_tenants', 'audit_events']) {
  if (!repository.includes(invariant)) throw new Error(`Onboarding transaction missing ${invariant}`)
}

const migration = fs.readFileSync('database/migrations/0002_auth_memberships.sql', 'utf8')
if (!migration.includes('create table if not exists app_users')) throw new Error('app_users identity table missing')
if (!migration.includes('organization_id uuid references organizations')) throw new Error('signup organization relation missing')

console.log('Authentication and membership foundation check passed (V60-compatible).')
