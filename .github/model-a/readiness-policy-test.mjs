import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {validateReadinessConfiguration} from './readiness-policy.mjs';
import {classifyChanges} from './policy.mjs';
const require=createRequire(import.meta.url),yaml=createRequire(require.resolve('eslint'))('js-yaml');
const read=name=>yaml.load(fs.readFileSync(name,'utf8'));
const composite=read('.github/actions/setup-readiness-azure/action.yml');
assert.equal(composite.runs.steps[0].name,'Validate readiness configuration before requesting Azure access');
assert(composite.runs.steps[0].run.includes('validateReadinessConfiguration(process.env)'));
assert(composite.runs.steps[1].uses.startsWith('azure/login@'));
for(const step of composite.runs.steps)if(step.uses)assert.match(step.uses,/@[a-f0-9]{40}$/,'Immutable composite dependency');
assert(!JSON.stringify(composite).includes('secrets.'));
const valid={GITHUB_REPOSITORY:'oemercam/binso_admin_azure',GITHUB_REF:'refs/heads/main',READINESS_CLIENT_ID:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',READINESS_TENANT_ID:'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',READINESS_SUBSCRIPTION_ID:'cccccccc-cccc-cccc-cccc-cccccccccccc'};
// Execute the actual YAML guard through Bash/Node, then fake only azure/login.
// No token, cloud call or database is involved; the failure ordering is real.
const bash=process.platform==='win32'?path.join(process.env.ProgramFiles,'Git','bin','bash.exe'):'bash';
const simulate=env=>{
 let logins=0;
 for(const step of composite.runs.steps){
  if(step.run){const run=spawnSync(bash,['-euo','pipefail','-c',step.run],{env:{...process.env,...env},encoding:'utf8'});if(run.error)throw run.error;if(run.status!==0)return {status:run.status,logins};}
  else if(step.uses?.startsWith('azure/login@'))logins++;
  else throw new Error('Unmodelled composite step');
 }
 return {status:0,logins};
};
assert.deepEqual(simulate(valid),{status:0,logins:1});
for(const env of [{...valid,GITHUB_REF:'refs/heads/feature'},{...valid,GITHUB_REPOSITORY:'fork/repo'},...['READINESS_CLIENT_ID','READINESS_TENANT_ID','READINESS_SUBSCRIPTION_ID'].flatMap(key=>[{...valid,[key]:''},{...valid,[key]:'invalid'}])]){
 assert.throws(()=>validateReadinessConfiguration(env));
 assert.deepEqual(simulate(env),{status:1,logins:0},'Guard must fail before even fake login');
}
assert.deepEqual(simulate({GITHUB_REPOSITORY:valid.GITHUB_REPOSITORY,GITHUB_REF:valid.GITHUB_REF,AZURE_CLIENT_ID:valid.READINESS_CLIENT_ID,AZURE_TENANT_ID:valid.READINESS_TENANT_ID,AZURE_SUBSCRIPTION_ID:valid.READINESS_SUBSCRIPTION_ID}),{status:1,logins:0},'Deployment values cannot serve as fallback');
for(const [file,job] of [['production-monitoring-readiness.yml','monitoring'],['postgresql-backup-readiness.yml','backup']]){
 const workflow=read('.github/workflows/'+file),scope=workflow.jobs[job];
 assert.equal(scope.environment,'readiness');
 assert.equal(scope.if,"github.ref == 'refs/heads/main'");
 assert.deepEqual(workflow.permissions,{contents:'read','id-token':'write'},'Existing permissions unchanged');
 const setup=scope.steps.find(s=>s.uses==='./.github/actions/setup-readiness-azure');
 for(const key of ['client-id','tenant-id','subscription-id'])assert.match(setup.with[key],/^\$\{\{ vars\.READINESS_AZURE_/);
 assert(!JSON.stringify(scope).includes('secrets.'),'Reader job cannot obtain Production secrets');
 assert.equal(classifyChanges(['.github/workflows/'+file],{additions:1,deletions:0}).automatic,false,'Credential boundary changes never become routine');
}
for(const [file,job] of [['deploy-azure.yml','deploy'],['retention-maintenance.yml','cleanup'],['graph-mail-readiness.yml','graph-mail'],['stripe-configuration-audit.yml','audit'],['azure-architecture-audit.yml','audit']])assert.equal(read('.github/workflows/'+file).jobs[job].environment,'production','Existing mutation/secret-reading job stays protected');
console.log('Readiness boundary integration: separate configuration accepted; missing/invalid/fork/deployment fallback blocked before login; existing permissions and Production boundaries preserved. Azure RBAC remains unverified.');
