import {readPageFile} from "./page-source.mjs";
import fs from 'node:fs/promises';
import ts from 'typescript';
import assert from 'node:assert/strict';
const deploy=await readPageFile('.github/workflows/deploy-azure.yml','utf8');
assert.ok(deploy.indexOf('pnpm db:migrate')<deploy.indexOf('pnpm db:check'),'Migrate before checking latest schema');
assert.ok(deploy.includes('Verify current production build and routes'));
const home=await readPageFile('app/page.tsx','utf8');
const pricing=await readPageFile('app/preise/page.tsx','utf8');
const register=await readPageFile('app/registrieren/page.tsx','utf8');
const loginRoute=await readPageFile('app/api/auth/login/route.ts','utf8');
const recoverRoute=await readPageFile('app/api/auth/recover/route.ts','utf8');
const registerRouteSource=await readPageFile('app/api/auth/register/route.ts','utf8');
const provisioningSource=await readPageFile('lib/server/provisioning.ts','utf8');
const operatorSource=await readPageFile('components/operator.tsx','utf8');
for(const [name,source] of [['landing',home],['pricing',pricing],['register',register]]){
  assert.ok(!source.includes('30 Tage kostenlos'),name+' must not advertise the old 30-day trial');
}
for(const legacy of ['CHF 19','CHF 49','CHF 89']){
  assert.ok(!home.includes(legacy)&&!pricing.includes(legacy),'Public pages must not contain legacy price '+legacy);
}
assert.ok(pricing.includes('domainConfig.trialDays')&&pricing.includes('plans.map'),'Pricing page must use canonical trial and plan configuration');
assert.ok(register.includes('RegistrationSheet'),'Registration must mount the shared sheet entry');
const registrationSheet=await fs.readFile('components/registration/registration-sheet.tsx','utf8');
assert.ok(registrationSheet.includes("search.get(\"plan\")")&&registrationSheet.includes("search.get(\"billing\")")&&registrationSheet.includes('billingCycle:context.billingCycle'),'Registration must preserve selected plan and billing cycle through the server context');
assert.ok(loginRoute.includes('verifiedEmailNow||!emailCode'),'Login must issue a fresh login code after first email verification');
assert.ok(recoverRoute.includes('domainConfig.passwordResetMinutes'),'Password recovery must use the canonical reset lifetime');
assert.ok(provisioningSource.includes('input.language??"de"'),'Persisted profile language must remain schema-compatible');
assert.ok(provisioningSource.includes('input.mode==="demo"?addHours(new Date(),domainConfig.demoSessionHours):null'),'Trial expiry must not start before first email verification');
const appPagesSource=await readPageFile('components/app-pages.tsx','utf8');
assert.ok(appPagesSource.includes('useLocale()')&&appPagesSource.includes('locales.map('),'Language settings must expose all supported locales through the shared provider');
for(const legacyMrr of ['CHF 19','CHF 49','CHF 89'])assert.ok(!operatorSource.includes('mrr:"'+legacyMrr+'"'),'Operator demo must not hardcode retired MRR '+legacyMrr);
assert.ok(operatorSource.includes('demoPlan("start")')&&operatorSource.includes('demoPlan("business")')&&operatorSource.includes('demoPlan("pro")'),'Operator demo MRR must derive from canonical plans');

console.log('Release gates passed.');

const email=await readPageFile('lib/server/email.ts','utf8');
const mailAst=ts.createSourceFile('email.ts',email,ts.ScriptTarget.Latest,true);
const mailEndpoints=[];
const collectMailEndpoints=node=>{if(ts.isCallExpression(node)&&node.expression.getText(mailAst)==='fetch'){const target=node.arguments[0];assert.ok(ts.isTemplateExpression(target)||ts.isStringLiteralLike(target),'Mail endpoint must have a fixed scheme and host');mailEndpoints.push(new URL(ts.isTemplateExpression(target)?target.head.text:target.text));}ts.forEachChild(node,collectMailEndpoints)};
collectMailEndpoints(mailAst);
assert.deepEqual(mailEndpoints.map(url=>[url.protocol,url.hostname]),[['https:','login.microsoftonline.com'],['https:','graph.microsoft.com']],'Mail must use exact HTTPS Microsoft token and Graph hosts');
assert.equal(mailEndpoints[1].pathname,'/v1.0/users/','Graph sendMail endpoint retains its fixed API path');
const envExample=await readPageFile('.env.example','utf8');
for(const name of ['GRAPH_TENANT_ID','GRAPH_CLIENT_ID','GRAPH_CLIENT_SECRET','GRAPH_SENDER_USER_ID']){
  assert.ok(envExample.includes(name+'='),'.env.example must document '+name);
}

const deployWorkflow=await readPageFile('.github/workflows/deploy-azure.yml','utf8');
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
const lifecycle=await readPageFile('scripts/organization-data-lifecycle.mjs','utf8');
for(const guard of ['BINSO_DELETE_CONFIRM','BINSO_DELETE_EXPORT_CONFIRMED','Organization must be archived before final deletion','Active/trial billing state blocks final deletion']){
  assert.ok(lifecycle.includes(guard),'Customer deletion safeguard missing: '+guard);
}

await fs.access('docs/graph-mail-least-privilege.md');

await fs.access('app/api/auth/sessions/route.ts');
await fs.access('app/api/auth/sessions/[id]/route.ts');
const sessionSecurityUi=await readPageFile('components/security-settings-page.tsx','utf8');
assert.ok(sessionSecurityUi.includes('/api/auth/sessions')&&sessionSecurityUi.includes('Alle anderen abmelden'),'Security settings must expose real session management');

const packageJson=JSON.parse(await readPageFile('package.json','utf8'));
assert.equal(packageJson.engines?.node,'>=24 <25','Runtime contract must stay pinned to Node 24');
assert.ok(packageJson.scripts?.['security:scan']?.includes('audit --prod --audit-level high'),'Quality security gate must block high production dependency advisories');
await fs.access('docs/dependency-security-review.md');

assert.equal(packageJson.scripts['security:scan'],'pnpm audit --prod --audit-level high','Blocking security audit must cover production dependencies at high severity');
assert.equal(packageJson.scripts['security:scan:all'],'node scripts/full-security-audit.mjs','Full dependency audit must use the exact advisory gate');
await fs.access('scripts/full-security-audit.mjs');
const fullAuditGate=await readPageFile('scripts/full-security-audit.mjs','utf8');
assert.ok(fullAuditGate.includes('GHSA-VFJ7-8CJW-P6XM'),'Full dependency audit may tolerate only the documented unresolved dev-tool advisory');

await import("./repository-cleanliness-check.mjs");

await import('./documentation-consistency-check.mjs');

// Execute the actual deployment resolver with mocked GitHub responses. Deployment
// must require explicit approval and a full successful run for current main.
assert.ok(!/\n  workflow_run:/.test(deployWorkflow),'Quality completion must not deploy production automatically');
assert.ok(deployWorkflow.includes("inputs.approve_production == true")&&deployWorkflow.includes("github.ref == 'refs/heads/main'"),'Production requires explicit approval from main');
const resolverBlock=deployWorkflow.split('      - name: Resolve successful Quality artifact for this exact main commit')[1]?.split('      - name: Download Quality-verified production artifact')[0];
const resolverSource=resolverBlock?.split('          script: |\n')[1]?.split('\n').map(line=>line.startsWith('            ')?line.slice(12):line).join('\n');
assert.ok(resolverSource,'Production resolver is present');
const resolveCandidate=new (Object.getPrototypeOf(async function(){}).constructor)('process','github','context','core',resolverSource);
const candidateSha='a'.repeat(40),otherSha='b'.repeat(40);
const successfulRun={id:42,event:'workflow_dispatch',head_branch:'main',path:'.github/workflows/quality.yml',head_sha:candidateSha,status:'completed',conclusion:'success',display_title:'Quality • workflow_dispatch • full'};
async function probeResolver({sha=candidateSha,main=candidateSha,runs=[successfulRun],profile='production'}={}){
 const output={};let queried=false;
 const github={rest:{repos:{getBranch:async()=>({data:{commit:{sha:main}}})},actions:{listWorkflowRuns:async input=>{queried=true;assert.equal(input.event,'workflow_dispatch');assert.equal(input.head_sha,sha);return {data:{workflow_runs:runs}}}}}};
 await resolveCandidate({env:{BINSO_DEPLOY_SHA:sha,BINSO_RELEASE_PROFILE:profile}},github,{repo:{owner:'fixture',repo:'fixture'}},{setOutput:(key,value)=>{output[key]=value}});
 assert.ok(queried);return output;
}
assert.deepEqual(await probeResolver(),{run_id:'42'});
const developmentRun={...successfulRun,display_title:successfulRun.display_title+' • development'};
assert.deepEqual(await probeResolver({profile:'development',runs:[developmentRun]}),{run_id:'42'});
await assert.rejects(probeResolver({runs:[developmentRun]}),'Development evidence cannot satisfy production acceptance');
await assert.rejects(probeResolver({profile:'development'}),'Production title cannot silently substitute an explicitly scoped development run');
await assert.rejects(probeResolver({profile:'unknown'}));
for(const input of [
 {sha:'main'}, {main:otherSha}, {runs:[]},
 {runs:[{...successfulRun,event:'push'}]},
 {runs:[{...successfulRun,head_branch:'feature'}]},
 {runs:[{...successfulRun,path:'.github/workflows/other.yml'}]},
 {runs:[{...successfulRun,head_sha:otherSha}]},
 {runs:[{...successfulRun,conclusion:'failure'}]},
 {runs:[{...successfulRun,display_title:'Quality • workflow_dispatch • standard'}]},
 {runs:[{...successfulRun,display_title:'Quality • push • standard'}]},
]) await assert.rejects(probeResolver(input));
console.log('Manual production authorization, immutable current-main SHA and full final QA resolver passed.');
