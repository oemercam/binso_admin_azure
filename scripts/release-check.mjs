import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const deploy=await fs.readFile('.github/workflows/deploy-azure.yml','utf8');
assert.ok(deploy.indexOf('pnpm db:migrate')<deploy.indexOf('pnpm db:check'),'Migrate before checking latest schema');
assert.ok(deploy.includes('Verify current production build and routes'));
const home=await fs.readFile('app/page.tsx','utf8');
const pricing=await fs.readFile('app/preise/page.tsx','utf8');
const register=await fs.readFile('app/registrieren/page.tsx','utf8');
for(const [name,source] of [['landing',home],['pricing',pricing],['register',register]]){
  assert.ok(!source.includes('30 Tage kostenlos'),name+' must not advertise the old 30-day trial');
}
for(const legacy of ['CHF 19','CHF 49','CHF 89']){
  assert.ok(!home.includes(legacy)&&!pricing.includes(legacy),'Public pages must not contain legacy price '+legacy);
}
assert.ok(pricing.includes('domainConfig.trialDays')&&pricing.includes('plans.map'),'Pricing page must use canonical trial and plan configuration');
assert.ok(register.includes('billingCycle')&&register.includes('selectedPlan'),'Registration must preserve selected plan and billing cycle');
console.log('Release gates passed.');

const email=await fs.readFile('lib/server/email.ts','utf8');
assert.ok(email.includes('graph.microsoft.com')&&email.includes('sendMail'),'Microsoft Graph must remain the only production mail path');
const envExample=await fs.readFile('.env.example','utf8');
for(const name of ['GRAPH_TENANT_ID','GRAPH_CLIENT_ID','GRAPH_CLIENT_SECRET','GRAPH_SENDER_USER_ID']){
  assert.ok(envExample.includes(name+'='),'.env.example must document '+name);
}

const deployWorkflow=await fs.readFile('.github/workflows/deploy-azure.yml','utf8');
assert.ok(deployWorkflow.includes('pnpm retention:cleanup'),'Production deploy must enforce retention cleanup');
assert.ok(deployWorkflow.includes('/api/health/ready'),'Production deploy must verify readiness health');
assert.ok(deployWorkflow.includes('retry_curl()'),'Production verification must retry transient HTTP failures');
assert.ok(deployWorkflow.includes('trap cleanup_demo_session EXIT'),'Production demo verification must always clean up its session');
await fs.access('.github/workflows/retention-maintenance.yml');
await fs.access('.github/workflows/graph-mail-readiness.yml');
await fs.access('app/api/health/ready/route.ts');
await fs.access('docs/production-rollback.md');
await fs.access('docs/azure-postgresql-backup-restore.md');

await fs.access('scripts/organization-data-lifecycle.mjs');
await fs.access('scripts/data-lifecycle-schema-test.mjs');
await fs.access('docs/customer-data-lifecycle.md');
await fs.access('.github/workflows/production-monitoring-readiness.yml');
await fs.access('.github/workflows/postgresql-backup-readiness.yml');
const lifecycle=await fs.readFile('scripts/organization-data-lifecycle.mjs','utf8');
for(const guard of ['BINSO_DELETE_CONFIRM','BINSO_DELETE_EXPORT_CONFIRMED','Organization must be archived before final deletion','Active/trial billing state blocks final deletion']){
  assert.ok(lifecycle.includes(guard),'Customer deletion safeguard missing: '+guard);
}

await fs.access('docs/graph-mail-least-privilege.md');

await fs.access('app/api/auth/sessions/route.ts');
await fs.access('app/api/auth/sessions/[id]/route.ts');
const sessionSecurityUi=await fs.readFile('components/security-settings-page.tsx','utf8');
assert.ok(sessionSecurityUi.includes('/api/auth/sessions')&&sessionSecurityUi.includes('Alle anderen abmelden'),'Security settings must expose real session management');

const packageJson=JSON.parse(await fs.readFile('package.json','utf8'));
assert.equal(packageJson.engines?.node,'>=24 <25','Runtime contract must stay pinned to Node 24');
assert.ok(packageJson.scripts?.['security:scan']?.includes('audit --prod --audit-level high'),'Quality security gate must block high production dependency advisories');
await fs.access('docs/dependency-security-review.md');

assert.equal(packageJson.scripts['security:scan'],'pnpm audit --prod --audit-level high','Blocking security audit must cover production dependencies at high severity');
assert.equal(packageJson.scripts['security:scan:all'],'node scripts/full-security-audit.mjs','Full dependency audit must use the exact advisory gate');
await fs.access('scripts/full-security-audit.mjs');
const fullAuditGate=await fs.readFile('scripts/full-security-audit.mjs','utf8');
assert.ok(fullAuditGate.includes('GHSA-VFJ7-8CJW-P6XM'),'Full dependency audit may tolerate only the documented unresolved dev-tool advisory');

await import("./repository-cleanliness-check.mjs");

await import('./documentation-consistency-check.mjs');
