import assert from 'node:assert/strict';
import {planChanges,fullRoutes,shouldRunBrowser,isDocumentationOnlyChange} from './qa-plan.mjs';
assert.deepEqual(planChanges(['components/product-form.tsx'],{level:'fast'}).routes,['/produkte','/produkte/product-one','/produkte/neu']);
assert.equal(planChanges(['components/product-form.tsx']).level,'standard');
for(const path of ['app/design-system/collections.css','components/ui.tsx','components/records.tsx','components/app-chrome.tsx','components/binso-ux.tsx','components/use-dialog-focus.ts']){const p=planChanges([path]);assert(p.global);for(const r of ['/dashboard','/kunden/neu','/rechnungen/RE-TEST-1','/support/ticket-one','/operator'])assert(p.routes.includes(r),path+': '+r);}
for(const path of ['.github/workflows/quality.yml','database/migrations/new.sql','app/api/auth/session/route.ts','components/unmapped.tsx'])assert.deepEqual(planChanges([path]).routes,fullRoutes,path);
assert.deepEqual(planChanges(['docs/readme.md']).routes,[]);
for(const files of [['README.md','AGENTS.md'],['docs/architecture/v21-5-routes.md'],['docs/product-auth-guide.md','docs/notes.txt']]){
 assert.equal(isDocumentationOnlyChange(files),true);
 assert.deepEqual(planChanges(files).routes,[],'Prose filenames do not imply runtime dependencies');
 assert.deepEqual(planChanges(files,{level:'full'}).routes,fullRoutes,'Explicit full coverage survives a prose-only diff');
}
for(const files of [[],['docs/readme.md','components/ui.tsx'],['docs/product.js'],['docs/product-config.json'],['docs/architecture/reference-foundation.md'],['docs/audit/v24/reference/IMPLEMENTIERUNG.md'],['README.runtime.js'],['docs/../components/ui.tsx'],['docs\\readme.md'],['docs/a\nb.md']]){
 assert.equal(isDocumentationOnlyChange(files),false,JSON.stringify(files));
 assert.deepEqual(planChanges(files).routes,fullRoutes,'Unsafe or unknown diff retains full coverage: '+JSON.stringify(files));
}
assert.deepEqual(planChanges(['components/documents.tsx']).interactions,['documents']);
assert.equal(planChanges([],{level:'full'}).routes.length,fullRoutes.length);
for(const width of [320,390,600,760,761,820,1024,1440,1920]){
 const full=planChanges([],{level:'full'});assert.ok(full.widths.includes(width),'Full Chromium coverage includes V25.5 boundary '+width);assert.ok(full.webkitWidths.includes(width),'Full WebKit coverage includes V25.5 boundary '+width);
}
assert(planChanges([],{level:'full'}).webkitWidths.includes(1024),'The release candidate must actually measure the desktop header in WebKit');
const catalog=JSON.parse(await (await import('node:fs/promises')).readFile('docs/architecture/ux-inventory.json','utf8'));
for(const file of ['components/sensitive-access.tsx','lib/server/sensitive-access.ts','app/api/auth/sensitive-access/route.ts','components/pages/suppliers.tsx','lib/server/repositories/suppliers.ts','components/pages/employees.tsx','lib/server/repositories/employment.ts']){
 assert.ok(planChanges([file],{level:'fast'}).suites.includes('employee-dossier-test'),'The shared isolated HR/supplier contract remains selected for '+file);
}
for(const route of ['/lieferanten','/lieferanten/neu','/lieferanten/supplier-one'])assert.ok(fullRoutes.includes(route),'Required coverage retains '+route);
assert.ok(planChanges(['components/pages/suppliers.tsx'],{level:'fast'}).routes.includes('/lieferanten/supplier-one'),'Supplier detail uses its own existing QA fixture, never an offer ID');
for(const entry of catalog.routes){const expression=new RegExp('^'+entry.route.replace(/\[\.\.\.section\]/g,'.+').replace(/\[id\]/g,'[^/]+')+'$');assert.ok(fullRoutes.some(route=>expression.test(route)),'Full QA omits page '+entry.route);}
assert(planChanges(['components/unmapped.tsx'],{level:'fast'}).routes.includes('/kunden/neu'),'Unknown FAST dependencies must retain representative browser coverage');
assert.throws(()=>planChanges([],{level:'skip'}));
console.log('QA scope covers changed modules, shared dependencies, unknown files and forced releases without unsafe skips.');

assert.equal(planChanges(['app/design-system/collections.css','unmapped/custom-engine.ts'],{level:'standard'}).level,'full','A known global dependency cannot hide an unknown dependency');

assert.deepEqual(planChanges(['components/pdf-preview.tsx'],{level:'fast'}).interactions,['documents'],'PDF renderer changes select document interactions');

assert.deepEqual(planChanges(['components/pages/products.tsx'],{level:'fast'}).widths,[390]);
assert(!planChanges(['components/pages/products.tsx'],{level:'fast'}).routes.includes('/zeit'),'Product-only changes do not rebuild a cross-module browser scope');
assert.equal(planChanges(['scripts/qa.mjs'],{level:'integration'}).level,'integration','Local integration uses representative coverage while required CI remains full');
for(const path of ['components/form-wizard.tsx','components/ui.tsx','scripts/eslint/central-ui.mjs'])assert.ok(planChanges([path],{level:'fast'}).suites.includes('ui-foundation-test'),'FAST executes actual canonical-owner fixtures for '+path);
for(const path of ['lib/client/backend.ts','lib/client/use-api-query.ts','lib/money.ts','lib/financial-status.ts','lib/finance-periods.ts'])assert.ok(planChanges([path],{level:'fast'}).suites.includes('data-foundation-test'),'FAST executes data/financial contracts for '+path);
for(const path of ['app/design-system/theme.css','components/app-shell.tsx','components/operator.tsx'])assert.ok(planChanges([path],{level:'fast'}).suites.includes('navigation-foundation-test'),'FAST retains current Microsoft navigation and access regressions for '+path);
for(const path of ['lib/server/file-scan.ts','app/api/files/route.ts','app/api/settings/company/route.ts']){
 const suites=planChanges([path],{level:'fast'}).suites;
 assert.ok(suites.includes('file-scan-test')&&suites.includes('auth-integrity-test'),'FAST retains scan protocol and database publication checks for '+path);
}
for(const path of ['lib/server/public-reports.ts','lib/server/report-exports.ts','lib/server/report-mail.ts','lib/server/report-document.ts','lib/server/plan-access.ts','lib/server/document-amount-sql.ts'])assert.ok(planChanges([path],{level:'fast'}).suites.includes('migration-test'),'FAST preserves actual service-owner DB boundaries: '+path);
for(const path of ['lib/server/public-reports.ts','lib/server/report-mail.ts']){const plan=planChanges([path],{level:'fast'});assert.ok(plan.suites.includes('mail-message-test')&&plan.suites.includes('web-vitals-consent-test'));assert.ok(plan.routes.includes('/bericht')&&plan.routes.includes('/berichte'));}
for(const path of ['components/product-form.tsx','docs/report-mail-notes.md'])assert.equal(planChanges([path],{level:'fast'}).suites.includes('mail-message-test'),false,'Unrelated products/prose do not run mail contracts');

// Prompt-sized local checks must not launch browser processes implicitly.
for(const level of ['fast','integration']){
 assert.equal(shouldRunBrowser(level),false);
 assert.equal(shouldRunBrowser(level,['--browser']),true);
}
for(const level of ['standard','full']) assert.equal(shouldRunBrowser(level),true);
for(const level of ['fast','integration','standard','full'])
 assert.equal(shouldRunBrowser(level,['--browser','--no-browser']),false);

for(const width of [2560,3840]){const wide=planChanges(["components/ui.tsx"],{level:"full"});assert.ok(wide.widths.includes(width));assert.ok(wide.webkitWidths.includes(width));}
