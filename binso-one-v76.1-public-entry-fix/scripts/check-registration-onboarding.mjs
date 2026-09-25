import fs from 'node:fs'

const checks = [
  ['registration api', fs.existsSync('app/api/registration/route.ts')],
  ['post login router', fs.existsSync('app/post-login/page.tsx')],
  ['registration repository', fs.existsSync('lib/db/repositories/registration.ts')],
  ['business bootstrap repository', fs.existsSync('lib/db/repositories/business-bootstrap.ts')],
]

const migration = fs.readFileSync('database/migrations/0003_registration_onboarding.sql', 'utf8')
const registerPage = fs.readFileSync('app/register/page.tsx', 'utf8')
const onboardingPage = fs.readFileSync('app/onboarding/page.tsx', 'utf8')
const onboardingApi = fs.readFileSync('app/api/onboarding/route.ts', 'utf8')
const layout = fs.readFileSync('app/(app)/layout.tsx', 'utf8')

checks.push(
  ['open signup uniqueness', migration.includes('uq_signup_requests_open_user')],
  ['registration no localStorage', !registerPage.includes('localStorage')],
  ['onboarding no localStorage', !onboardingPage.includes('localStorage')],
  ['onboarding uses persisted signup id', onboardingApi.includes('signupId')],
  ['server business bootstrap', layout.includes('getBusinessBootstrapForUser')],
)

const failed = checks.filter(([, ok]) => !ok)
if (failed.length) {
  for (const [name] of failed) console.error(`V60 check failed: ${name}`)
  process.exit(1)
}
console.log(`Registration and onboarding product check passed (${checks.length} invariants, V60).`)
