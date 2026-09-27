import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const scope =
  process.argv.find((arg) => arg.startsWith('--scope='))?.split('=')[1] || 'all'

const requiredOperations = [
  'docs/operations/CONTACT-ARCHITECTURE.md',
  'docs/operations/SUPPORT.md',
  'docs/operations/ACCESS-MANAGEMENT.md',
  'docs/operations/JOINER-MOVER-LEAVER.md',
  'docs/operations/ASSET-INVENTORY.md',
  'docs/operations/COMMUNICATION-MATRIX.md',
  'docs/operations/BUSINESS-CONTINUITY.md',
  'docs/operations/DISASTER-RECOVERY.md',
  'docs/operations/LOAD-TESTING.md',
  'docs/operations/EMAIL-SETUP-CHECKLIST.md',
  'docs/operations/OPERATIONS-GAPS.md',
]

const requiredGovernance = [
  'docs/governance/VENDOR-MANAGEMENT.md',
  'docs/governance/DATA-CLASSIFICATION.md',
  'docs/governance/RETENTION-MATRIX.md',
  'docs/governance/BUSINESS-IMPACT-ANALYSIS.md',
  'docs/governance/RISK-REGISTER-TEMPLATE.md',
  'docs/governance/POLICY-INDEX.md',
]

const requiredCompliance = [
  'docs/compliance/EVIDENCE-INDEX.md',
  'docs/compliance/ROADMAP.md',
  'docs/compliance/INTERNAL-AUDIT-CHECKLIST.md',
  'docs/compliance/MANAGEMENT-REVIEW-TEMPLATE.md',
]

const requiredRunbooks = [
  'docs/runbooks/DEPLOYMENT.md',
  'docs/runbooks/ROLLBACK.md',
  'docs/runbooks/DATABASE-RECOVERY.md',
  'docs/runbooks/SECRET-ROTATION.md',
  'docs/runbooks/INCIDENT.md',
  'docs/runbooks/STRIPE-WEBHOOK.md',
  'docs/runbooks/EMAIL-FAILURE.md',
  'docs/runbooks/AUTH-FAILURE.md',
]

const required = [
  'SECURITY.md',
  'docs/FINAL-OPERATIONAL-AUDIT.md',
  'docs/FINAL-QUALITY-SCORECARD.md',
  'docs/operations/EXTERNAL-SETUP-REQUIRED.md',
  ...requiredOperations,
  ...requiredGovernance,
  ...requiredCompliance,
  ...requiredRunbooks,
]

if (scope === 'all' || scope === 'operations') {
  for (const file of required) {
    assert.ok(existsSync(file), `Missing master readiness file: ${file}`)
  }
}

if (scope === 'all' || scope === 'contact') {
  const identity = readFileSync('lib/config/app-identity.ts', 'utf8')
  const contactConfig = readFileSync('lib/config/contact-config.ts', 'utf8')

  assert.match(identity, /contacts:\s*publicContacts/)
  assert.match(contactConfig, /NEXT_PUBLIC_CONTACT_SECURITY/)
  assert.match(contactConfig, /NEXT_PUBLIC_CONTACT_PRIVACY/)
  assert.match(contactConfig, /NEXT_PUBLIC_CONTACT_BILLING/)

  assert.ok(
    existsSync('app/.well-known/security.txt/route.ts'),
    'Missing dynamic security.txt route',
  )

  const bannedPersonalAddress = 'oemer.cam@binso.ch'
  const allowedReferenceFile = 'lib/config/contact-config.ts'
  const roots = ['app', 'components', 'lib']

  function scan(dir) {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry)
      const info = statSync(path)

      if (info.isDirectory()) {
        scan(path)
        continue
      }

      if (!/\.(ts|tsx|js|mjs)$/.test(path)) {
        continue
      }

      const normalizedPath = path.replaceAll('\\', '/')

      if (normalizedPath === allowedReferenceFile) {
        continue
      }

      const source = readFileSync(path, 'utf8').toLowerCase()

      assert.ok(
        !source.includes(bannedPersonalAddress),
        `Personal owner email must not appear in public/runtime source: ${normalizedPath}`,
      )
    }
  }

  for (const dir of roots) {
    scan(dir)
  }
}

const preflight = readFileSync('scripts/production-preflight.mjs', 'utf8')

assert.match(
  preflight,
  /NEXT_PUBLIC_ROLE_CONTACTS_ENABLED/,
  'Production preflight must validate role-contact configuration',
)

assert.match(
  preflight,
  /ENFORCE_LIVE_STRIPE_IN_PRODUCTION/,
  'Production preflight must contain the optional Stripe live-mode guard',
)

console.log(
  `Master readiness check passed (${scope}). External/organizational items remain evidence-gated.`,
)
