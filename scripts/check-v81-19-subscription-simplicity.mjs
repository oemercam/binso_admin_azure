import fs from 'node:fs'
import assert from 'node:assert/strict'
const read=(file)=>fs.readFileSync(file,'utf8')
const plans=read('lib/data/plans.ts')
const pricing=read('app/pricing/page.tsx')
const nav=read('components/navigation/nav-items.ts')
const desktop=read('components/navigation/desktop-nav.tsx')
const mobile=read('components/navigation/mobile-pill-nav.tsx')
const gate=read('components/auth/entitlement-gate.tsx')
const settings=read('app/(app)/settings/page.tsx')
const org=read('app/(app)/organization/page.tsx')
const api=read('app/api/billing/subscription/route.ts')
const presentation=read('lib/data/plan-presentation.ts')

assert.equal((plans.match(/selfService: true/g) ?? []).length, 3)
assert.ok(plans.includes("id: 'starter'") && plans.includes("id: 'business'") && plans.includes("id: 'professional'"))
assert.ok(plans.includes("id: 'enterprise'") && plans.includes('selfService: false'))
assert.ok(pricing.includes('selfServicePlanDefinitions'))
assert.ok(presentation.includes("['starter', 'business', 'professional']"))
assert.ok(desktop.includes('enabled.has(item.feature)'))
assert.ok(mobile.includes('enabled.has(item.feature)'))
assert.ok(nav.includes("feature: 'time'") && nav.includes("feature: 'finance'") && nav.includes("feature: 'employees'"))
assert.ok(gate.includes("prefix: '/work'") && gate.includes('Abo ansehen'))
assert.ok(settings.includes("enabledFeatures.has('imports') || enabledFeatures.has('exports')"))
assert.ok(settings.includes('canUseAutomationSettings'))
assert.ok(org.includes('selfServicePlanDefinitions.map'))
assert.ok(org.includes("disabled={subscription.plan === 'enterprise'}"))
assert.ok(org.includes('planName(subscription.plan)'))
assert.ok(!api.includes("'professional', 'enterprise'"))
for (const expected of [
  ["starter", ["crm","quotes","orders","invoices","exports"]],
  ["business", ["contracts","time","finance","employees","imports"]],
  ["professional", ["accounting","margin","audit","api","automations"]],
]) {
  const [id, features] = expected
  const block = plans.split(`id: '${id}'`)[1]?.split('},')[0] ?? ''
  for (const feature of features) assert.ok(block.includes(`'${feature}'`), `${id} missing ${feature}`)
}
console.log('V81.19 subscription simplicity checks passed for Starter, Business and Professional.')
