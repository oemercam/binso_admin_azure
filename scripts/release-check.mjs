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
