import assert from 'node:assert/strict';
import './v8-runtime-grants-test.mjs';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),yaml=createRequire(require.resolve('eslint'))('js-yaml');
const directory='.github/workflows';
const setup=yaml.load(fs.readFileSync('.github/actions/setup-node/action.yml','utf8'));
for(const step of setup.runs.steps)if(step.uses)assert(/@[a-f0-9]{40}$/.test(step.uses),'Pinned composite dependency');
const workflows=Object.fromEntries(fs.readdirSync(directory).filter(f=>f.endsWith('.yml')).map(f=>[f,yaml.load(fs.readFileSync(directory+'/'+f,'utf8'))]));
for(const file of ['quality.yml','avatar-profile.yml','document-discounts.yml','v25-final-sample.yml','invoice-readiness.yml']){
 const install=Object.values(workflows[file].jobs).flatMap(job=>job.steps??[]).find(step=>step.run?.includes('install --with-deps'));
 assert(install,'Every browser workflow retains complete system dependency installation: '+file);
 assert(install.run.indexOf('bash scripts/prepare-browser-host.sh')>=0&&install.run.indexOf('bash scripts/prepare-browser-host.sh')<install.run.indexOf('install --with-deps'),'Prepare the same reliable signed archive before browser dependencies: '+file);
}
const browserHost=fs.readFileSync('scripts/prepare-browser-host.sh','utf8');
assert(browserHost.includes('https://archive.ubuntu.com/ubuntu'));
assert(browserHost.includes('/etc/apt/apt-mirrors.txt'),'Hosted Ubuntu mirror+file sources must be prepared too');
assert(!/AllowUnauthenticated|AllowInsecureRepositories|Verify-Peer.*false|trusted=yes/.test(browserHost),'Mirror reliability cannot bypass package or TLS verification');
for(const name of ['checks','ux-compliance']){
 const checkout=workflows['quality.yml'].jobs[name].steps.find(step=>step.uses?.startsWith('actions/checkout@'));
 assert.equal(checkout.with['fetch-depth'],0,'Immutable navigation reference checks require real historical source in '+name);
 assert.equal(checkout.with['persist-credentials'],false,'Historical source access cannot persist credentials');
}
// Evaluate the actual event expressions over synthetic contexts; no credentials,
// service calls, deployment, mail or database operation is executed by this test.
const evaluate=(expression,github,inputs={})=>Function('github','inputs','return ('+expression.replace(/^\$\{\{\s*|\s*\}\}$/g,'')+')')(github,inputs);
for(const [file,workflow] of Object.entries(workflows)){
 assert.equal(workflow.permissions.contents,'read',file);
 assert(!['pull_request_target','workflow_run'].some(event=>event in workflow.on),'No privileged follow-on trigger: '+file);
 for(const [name,job] of Object.entries(workflow.jobs)){
  assert(job['timeout-minutes']>0&&job['timeout-minutes']<=45,'Bounded job: '+file+'/'+name);
  for(const step of job.steps??[])if(step.uses&&!step.uses.startsWith('./'))assert(/@[a-f0-9]{40}$/.test(step.uses),'Immutable action: '+step.uses);
  if(job.environment==='production'){
   assert(job.if,'Production job needs an explicit branch guard: '+file);
   for(const event_name of ['push','schedule','workflow_dispatch'])assert.equal(Boolean(evaluate(job.if,{event_name,ref:'refs/heads/feature'},{approve_production:true})),false,file);
  }
 }
}
const graph=workflows['graph-mail-readiness.yml'];
const graphStep=graph.jobs['graph-mail'].steps.find(s=>s.env?.SEND_SELF_TEST);
for(const event_name of ['push','schedule','workflow_dispatch'])for(const send_self_test of [false,true]){
 assert.equal(evaluate(graphStep.env.SEND_SELF_TEST,{event_name},{send_self_test}),event_name==='workflow_dispatch'&&send_self_test);
}
assert(graphStep.run.indexOf('if [ "$SEND_SELF_TEST" != true ]')<graphStep.run.indexOf('/sendMail'));
assert(graphStep.run.includes('exit 0'),'Read-only validation exits before sendMail');
const retention=workflows['retention-maintenance.yml'];
const cleanup=retention.jobs.cleanup.steps.find(s=>s.env?.RETENTION_DRY_RUN);
for(const event_name of ['push','schedule','workflow_dispatch'])for(const apply_cleanup of [false,true]){
 assert.equal(evaluate(cleanup.env.RETENTION_DRY_RUN,{event_name},{apply_cleanup}),!(event_name==='schedule'||event_name==='workflow_dispatch'&&apply_cleanup));
}
assert.equal(graph.on.workflow_dispatch.inputs.send_self_test.default,false);
assert.equal(retention.on.workflow_dispatch.inputs.apply_cleanup.default,false);
const deploy=workflows['deploy-azure.yml'].jobs.deploy;
const attestation=workflows['legacy-checksum-attestation.yml'];
assert.deepEqual(Object.keys(attestation.on),['workflow_dispatch'],'Legacy metadata correction is manual only');
assert.equal(attestation.on.workflow_dispatch.inputs.apply.default,false,'Read-only plan is the default');
assert.equal(attestation.concurrency.group,'production-deploy','No concurrent deployment and checksum correction');
assert.equal(attestation.concurrency['cancel-in-progress'],false);
assert.equal(attestation.jobs.attest.environment,'production','Existing human environment gate remains');
assert(attestation.jobs.attest.steps.find(step=>step.name==='Verify exact main identity').run.includes('"$SOURCE_SHA" = "$GITHUB_SHA"'));
assert(attestation.jobs.attest.steps.some(step=>step.env?.BINSO_APPROVED_PLAN_SHA256==='${{ inputs.plan_sha256 }}'));
assert.equal(attestation.jobs.attest.steps.at(-1).if,'always()','Scoped firewall cleanup survives rejection or failure');
assert(workflows['quality.yml'].jobs.checks.steps.some(step=>step.run==='node scripts/legacy-checksum-attestation-test.mjs'),'Attestation adversaries are mandatory in CI');
assert.equal(workflows['deploy-azure.yml'].permissions['id-token'],undefined,'OIDC is job-scoped');
assert.equal(deploy.permissions['id-token'],'write');
const guard=deploy.steps[0];
assert.equal(guard.name,'Validate dispatch identity before checking out code');
const validate=Function('process','context',guard.with.script),sha='a'.repeat(40);
validate({env:{BINSO_DEPLOY_SHA:sha}},{sha,ref:'refs/heads/main'});
for(const context of [{sha:'b'.repeat(40),ref:'refs/heads/main'},{sha,ref:'refs/heads/feature'}])assert.throws(()=>validate({env:{BINSO_DEPLOY_SHA:sha}},context));
assert.throws(()=>validate({env:{BINSO_DEPLOY_SHA:'main'}},{sha,ref:'refs/heads/main'}));
const steps=deploy.steps.map(s=>s.name);
assert.equal(workflows['deploy-azure.yml'].on.workflow_dispatch.inputs.apply_v8_runtime_grants.default,false,'V8 runtime grants require separate explicit opt-in');
const grantStep=deploy.steps.find(s=>s.name==='Apply explicitly approved V8 runtime object grants');
assert.equal(evaluate(grantStep.if,{},{}),false);
assert.equal(evaluate(grantStep.if,{},{apply_v8_runtime_grants:false}),false);
assert.equal(evaluate(grantStep.if,{},{apply_v8_runtime_grants:true}),true);
assert(grantStep.run.includes("fs.readFile('database/operations/grant-v8-billing-completion.sql','utf8')")&&grantStep.run.includes('rejectUnauthorized:true'),'Only the reviewed SQL is executed with verified TLS');
assert(steps.indexOf('Validate and migrate Azure PostgreSQL')<steps.indexOf(grantStep.name)&&steps.indexOf(grantStep.name)<steps.indexOf('Validate runtime role and prepare authorized development settings'),'Reviewed grants follow migration and precede runtime validation and deployment');
assert(steps.indexOf('Validate deploy artifact')<steps.indexOf('Validate and migrate Azure PostgreSQL'));
assert(deploy.steps.find(s=>s.name==='Validate deploy artifact').run.includes('release-artifact.mjs verify'));
const quality=workflows['quality.yml'];
assert.deepEqual(quality.jobs.quality.needs,['plan','checks','build','browser','ux-compliance','scanner-engine']);
assert.equal(quality.permissions['id-token'],undefined,'Untrusted PR tests cannot request Azure identity');
assert(quality.jobs.checks.steps.some(s=>s.run?.includes('node scripts/workflow-safety-test.mjs')),'Safety test is a mandatory Quality contract');
const promotion=quality.jobs.quality.steps;
const verification=promotion.findIndex(s=>s.run?.includes('release-artifact.mjs verify'));
assert(verification>promotion.findIndex(s=>s.uses?.startsWith('actions/checkout@'))&&verification>promotion.findIndex(s=>s.uses?.startsWith('actions/setup-node@')),'Central verifier source and runtime must exist before verification');
assert.equal(promotion[verification].if,undefined,'Non-production PR/manual runs also exercise the final verifier');
console.log('Workflow safety: actual YAML event truth tables, main-only production jobs, explicit writes, pinned actions, timeouts, exact dispatch and mandatory gates passed.');
