import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {moduleUrl,planCatalogModuleUrl,planAccessModuleUrl} from './data-test-modules.mjs';
const {planCatalog,effectiveUserLimit,capacityReached,canonicalPlanId}=await import(planCatalogModuleUrl);
const {planAllowsModule}=await import(planAccessModuleUrl);
const limits=await import(moduleUrl((await fs.readFile('lib/subscription-plans.ts','utf8')).replaceAll("'@/config/plans'",JSON.stringify(planCatalogModuleUrl)).replaceAll('"@/config/plans"',JSON.stringify(planCatalogModuleUrl))));
for(const [plan,monthly,yearly,users] of [['start',29,290,3],['business',69,690,15],['pro',129,1290,null]]){
 assert.equal(planCatalog[plan].monthly,monthly);assert.equal(planCatalog[plan].yearly,yearly);
 assert.equal(effectiveUserLimit(plan),users);
 for(const moduleKey of ['kunden','offerten','projekte','zeiterfassung','rechnungen','zahlungen'])assert.equal(planAllowsModule(plan,moduleKey),true,plan+moduleKey);
 assert.equal(planAllowsModule(plan,'dokumente'),plan==='pro');
 assert.equal(capacityReached(10000001,effectiveUserLimit(plan,10000)),plan!=='pro');
}
assert.equal(canonicalPlanId('professional'),'pro');assert.equal(canonicalPlanId('enterprise'),'pro');assert.equal(canonicalPlanId('starter'),'start');assert.equal(canonicalPlanId('unknown'),null);
assert.equal(effectiveUserLimit('start',50),3);assert.equal(effectiveUserLimit('business',5),5);assert.equal(capacityReached(2,3),false);assert.equal(capacityReached(3,3),true);
for(const plan of ['start','business','pro']){assert.equal(limits.subscriptionEntitlements(plan).users,planCatalog[plan].limits.users);assert.deepEqual(limits.subscriptionEntitlements(plan).features,[...planCatalog[plan].features]);}
console.log('V25.4 tariffs: unchanged prices, Start order flow, Pro-only independent documents, unlimited Pro and capped-plan negatives passed.');
