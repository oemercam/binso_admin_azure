import assert from 'node:assert/strict';
import {planChanges,fullRoutes} from './qa-plan.mjs';
assert.deepEqual(planChanges(['components/product-form.tsx'],{level:'fast'}).routes,['/produkte','/produkte/product-one','/produkte/neu']);
assert.equal(planChanges(['components/product-form.tsx']).level,'standard');
for(const path of ['app/styles/app.css','components/ui.tsx','components/records.tsx','components/binso-ux.tsx','components/use-dialog-focus.ts']){const p=planChanges([path]);assert(p.global);for(const r of ['/dashboard','/kunden/neu','/rechnungen/RE-TEST-1','/support/ticket-one','/operator'])assert(p.routes.includes(r),path+': '+r);}
for(const path of ['.github/workflows/quality.yml','database/migrations/new.sql','app/api/auth/session/route.ts','components/unmapped.tsx'])assert.deepEqual(planChanges([path]).routes,fullRoutes,path);
assert.deepEqual(planChanges(['docs/readme.md']).routes,[]);
assert.deepEqual(planChanges(['components/documents.tsx']).interactions,['documents']);
assert.equal(planChanges([],{level:'full'}).routes.length,57);
assert(planChanges(['components/unmapped.tsx'],{level:'fast'}).routes.includes('/kunden/neu'),'Unknown FAST dependencies must retain representative browser coverage');
assert.throws(()=>planChanges([],{level:'skip'}));
console.log('QA scope covers changed modules, shared dependencies, unknown files and forced releases without unsafe skips.');

assert.equal(planChanges(['app/styles/app.css','unmapped/custom-engine.ts'],{level:'standard'}).level,'full','A known global dependency cannot hide an unknown dependency');
