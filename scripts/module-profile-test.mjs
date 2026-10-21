import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {moduleUrl} from './data-test-modules.mjs';
const {tenantCan,tenantCanOpenPath,tenantCanCreateAt,tenantPermissions}=await import(moduleUrl(await fs.readFile('lib/permissions.ts','utf8')));
for(const path of ['/zeit','/zeit/neu','/support','/support/abc','/einstellungen','/einstellungen/konto','/einstellungen/sicherheit'])assert.equal(tenantCanOpenPath('member',path,'time_only'),true,path);
for(const path of ['/dashboard','/kunden','/kunden/neu','/finanzen','/rechnungen','/projekte','/produkte','/dokumente','/einstellungen/team','/einstellungen/firma','/supportevil','/zeitreise'])assert.equal(tenantCanOpenPath('member',path,'time_only'),false,path);
for(const permission of ['customers:read','projects:read','invoices:read','accounting:read','organization:read','users:manage','documents:write'])assert.equal(tenantCan('member',permission,'time_only'),false,permission);
assert.equal(tenantCan('member','time:write','time_only'),true);
assert.equal(tenantCanCreateAt('member','/zeit/neu','time_only'),true);
assert.equal(tenantCanCreateAt('member','/kunden/neu','time_only'),false);
for(const role of ['owner','admin','reader','unknown'])assert.equal(tenantCanOpenPath(role,'/zeit','time_only'),false,role);
for(const path of ['/dashboard','/support','/benachrichtigungen','/einstellungen/konto','/unknown'])assert.equal(tenantCanOpenPath('unknown',path),false,'An unknown role never receives a destination, including paths without a mapped module');
assert.equal(tenantCanOpenPath('member','/kunden','standard'),true);
assert.equal(tenantCanOpenPath('owner','/finanzen','standard'),true);
assert.ok(tenantPermissions('member','time_only').every(permission=>tenantCan('member',permission,'time_only')));
const shell=await fs.readFile('components/app-shell.tsx','utf8');
assert.match(shell,/tenantCanOpenPath\(access.role,path,access.moduleProfile\)/);
assert.match(shell,/canOpen\("\/dashboard"\)&&<Link/);
// V25.5 authorizes fewer slots for every role/plan, not only time_only.
function financeVisibility(source){assert.match(source,/canOpen\("\/finanzen"\)&&<Link/);assert.doesNotMatch(source,/moduleProfile!=="time_only"\|\|canOpen\("\/finanzen"\)/);}
financeVisibility(shell);
assert.equal(tenantCanOpenPath('reader','/finanzen','standard'),true,'Existing read-only Finance access remains available');
assert.throws(()=>financeVisibility(shell.replace('canOpen("/finanzen")&&<Link','(access?.moduleProfile!=="time_only"||canOpen("/finanzen"))&&<Link')),'The former unauthorized Finance shortcut must fail');
for(const role of ['member','hr','unknown'])assert.equal(tenantCanOpenPath(role,'/finanzen','standard'),false,role+' cannot receive a Finance shortcut');
assert.match(shell,/filter\(\(\[href\]\)=>canOpen\(href\)\)/);
console.log('Module profile navigation: positive/negative permission and shell wiring checks passed.');

const permissionUrl=moduleUrl(await fs.readFile('lib/permissions.ts','utf8'));
const {authorize}=await import(moduleUrl((await fs.readFile('lib/server/rbac.ts','utf8')).replace('import "server-only";','').replace('"@/lib/permissions"',JSON.stringify(permissionUrl))));
const session={role:'member',moduleProfile:'time_only',organizationStatus:'active'};
assert.doesNotThrow(()=>authorize(session,'time:write'));
for(const permission of ['customers:read','projects:read','organization:read','invoices:write','documents:write'])assert.throws(()=>authorize(session,permission),error=>error instanceof Response&&error.status===403);
assert.throws(()=>authorize({...session,organizationStatus:'read_only'},'time:write'),error=>error.status===403);
console.log('Actual server authorization: time-only and read-only positive/negative guards passed.');
