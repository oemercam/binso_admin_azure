import assert from 'node:assert/strict';
import {fixtureCase,fixtureCases} from './fixtures.mjs';
// Requirements validation plus adversarial isolation: shared object mutation must not leak.
import fs from 'node:fs';
const registry=JSON.parse(fs.readFileSync('ux-compliance/requirements.v1.json','utf8'));
assert.equal(new Set(registry.requirements.map(r=>r.id)).size,registry.requirements.length);
for(const r of registry.requirements)for(const key of ['id','description','routes','componentTypes','expected','owner','method','testCase','priority','acceptance'])assert.ok(r[key],r.id+' missing '+key);
for(const name of fixtureCases){const a=fixtureCase(name),b=fixtureCase(name,'ux-tenant-b'),again=fixtureCase(name);assert.deepEqual(a,again);assert.ok(a.invoices.every(i=>i.tenant_id===a.tenant&&i.customer_id.startsWith(a.tenant)));assert.ok(!a.invoices.some(i=>b.invoices.some(j=>i.id===j.id)));if(a.customers.length)a.customers[0].name='mutated';assert.deepEqual(again,fixtureCase(name));}
assert.equal(fixtureCase('empty').invoices.length,0);assert.equal(fixtureCase('large').customers.length,500);assert.equal(fixtureCase('partial').invoices[0].paid_amount,25);assert.equal(fixtureCase('no-expenses').cash.outflows.length,0);assert.ok(fixtureCase('negative').cash.payments[0].amount<fixtureCase('negative').cash.outflows[0].amount);assert.throws(()=>fixtureCase('few','production-tenant'));
console.log('Registry and fixture determinism, object isolation, tenant IDs, empty/large/partial/negative cases verified.');
