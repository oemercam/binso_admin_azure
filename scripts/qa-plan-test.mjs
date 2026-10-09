import assert from 'node:assert/strict';
import {planChanges,fullRoutes} from './qa-plan.mjs';
assert.deepEqual(planChanges(['components/product-form.tsx'],{level:'fast'}).routes,['/produkte','/produkte/product-one','/produkte/neu']);
assert.equal(planChanges(['components/product-form.tsx']).level,'standard');
for(const path of ['app/styles/app.css','components/ui.tsx','components/records.tsx','components/binso-ux.tsx','components/use-dialog-focus.ts']){const p=planChanges([path]);assert(p.global);for(const r of ['/dashboard','/kunden/neu','/rechnungen/RE-TEST-1','/support/ticket-one','/operator'])assert(p.routes.includes(r),path+': '+r);}
for(const path of ['.github/workflows/quality.yml','database/migrations/new.sql','app/api/auth/session/route.ts','components/unmapped.tsx'])assert.deepEqual(planChanges([path]).routes,fullRoutes,path);
assert.deepEqual(planChanges(['docs/readme.md']).routes,[]);
assert.deepEqual(planChanges(['components/documents.tsx']).interactions,['documents']);
assert.equal(planChanges([],{level:'full'}).routes.length,fullRoutes.length);
const catalog=JSON.parse(await (await import('node:fs/promises')).readFile('docs/architecture/ux-inventory.json','utf8'));
for(const entry of catalog.routes){const expression=new RegExp('^'+entry.route.replace(/\[\.\.\.section\]/g,'.+').replace(/\[id\]/g,'[^/]+')+'$');assert.ok(fullRoutes.some(route=>expression.test(route)),'Full QA omits page '+entry.route);}
assert(planChanges(['components/unmapped.tsx'],{level:'fast'}).routes.includes('/kunden/neu'),'Unknown FAST dependencies must retain representative browser coverage');
assert.throws(()=>planChanges([],{level:'skip'}));
console.log('QA scope covers changed modules, shared dependencies, unknown files and forced releases without unsafe skips.');

assert.equal(planChanges(['app/styles/app.css','unmapped/custom-engine.ts'],{level:'standard'}).level,'full','A known global dependency cannot hide an unknown dependency');

assert.deepEqual(planChanges(['components/pdf-preview.tsx'],{level:'fast'}).interactions,['documents'],'PDF renderer changes select document interactions');

assert.deepEqual(planChanges(['components/pages/products.tsx'],{level:'fast'}).widths,[390]);
assert(!planChanges(['components/pages/products.tsx'],{level:'fast'}).routes.includes('/zeit'),'Product-only changes do not rebuild a cross-module browser scope');
assert.equal(planChanges(['scripts/qa.mjs'],{level:'integration'}).level,'integration','Local integration uses representative coverage while required CI remains full');
for(const path of ['components/form-wizard.tsx','components/ui.tsx','scripts/eslint/central-ui.mjs'])assert.ok(planChanges([path],{level:'fast'}).suites.includes('ui-foundation-test'),'FAST executes actual canonical-owner fixtures for '+path);
for(const path of ['lib/client/backend.ts','lib/client/use-api-query.ts','lib/money.ts','lib/financial-status.ts','lib/finance-periods.ts'])assert.ok(planChanges([path],{level:'fast'}).suites.includes('data-foundation-test'),'FAST executes data/financial contracts for '+path);
for(const path of ['app/styles/tokens.css','components/app-shell.tsx','components/operator.tsx'])assert.ok(planChanges([path],{level:'fast'}).suites.includes('navigation-foundation-test'),'FAST retains frozen-navigation contract for '+path);
