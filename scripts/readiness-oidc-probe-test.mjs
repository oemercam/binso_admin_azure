import assert from 'node:assert/strict';
import fs from 'node:fs';
import {probe,validateContext,category,identity} from './readiness-oidc-probe.mjs';
import {resources} from './azure-readiness-check.mjs';
const sha='a'.repeat(40),env={GITHUB_REPOSITORY:'oemercam/binso_admin_azure',GITHUB_REF:'refs/heads/main',GITHUB_EVENT_NAME:'workflow_dispatch',GITHUB_SHA:sha,READINESS_CLIENT_ID:identity.client,READINESS_TENANT_ID:identity.tenant,READINESS_SUBSCRIPTION_ID:identity.subscription};
const data=()=>({app:{id:resources.app,properties:{state:'Running'}},insights:{id:resources.insights,properties:{},tags:{['hidden-link:'+resources.app]:'Resource'}},alert:{id:resources.alert,properties:{enabled:true,scopes:[resources.app],criteria:{allOf:[{metricName:'Http5xx',metricNamespace:'Microsoft.Web/sites',operator:'GreaterThan',threshold:0,timeAggregation:'Total'}]},actions:[{actionGroupId:resources.actionGroup}]}},actionGroup:{id:resources.actionGroup,properties:{enabled:true}},postgres:{id:resources.postgres,properties:{state:'Ready',backup:{backupRetentionDays:7,geoRedundantBackup:'Disabled'}}}});
const account={tenantId:identity.tenant,id:identity.subscription,user:{type:'servicePrincipal',name:identity.client}};
const execute=(command,args)=>{if(command==='git'){assert.deepEqual(args,['rev-parse','HEAD']);return sha;}assert.equal(command,'az');assert.deepEqual(args,['account','show','-o','json']);return JSON.stringify(account);};
let reads=[];const run=d=>probe(env,{execute,read:key=>{reads.push(key);return d[key];}});
assert.equal(run(data()).passed,true);assert.equal(reads.length,5);
for(const patch of [{GITHUB_REF:'refs/heads/feature'},{GITHUB_EVENT_NAME:'pull_request'},{GITHUB_REPOSITORY:'fork/repo'},{GITHUB_SHA:'main'},{READINESS_CLIENT_ID:''},{READINESS_TENANT_ID:'deployment'},{READINESS_SUBSCRIPTION_ID:''}])assert.throws(()=>probe({...env,...patch},{execute:()=>assert.fail('Must reject before any CLI call')}));
assert.throws(()=>probe(env,{execute:()=> 'b'.repeat(40)}),/SHA differs/);
assert.throws(()=>probe(env,{execute:(command,args)=>command==='git'?sha:JSON.stringify({...account,user:{type:'servicePrincipal',name:'deployment'}}),read:()=>assert.fail('Wrong account cannot read resources')}),/dedicated/);
const stale=data();stale.alert.properties.scopes=[resources.app.replace(identity.subscription,'41e77b08-a365-41cd-a681-b07dc0326bc6')];const result=run(stale);assert.equal(result.authentication.status,'passed');assert.equal(result.resources.length,5);assert.equal(result.monitoring.status,'failed');assert.equal(result.backup.status,'passed');assert.equal(result.passed,false);assert.deepEqual(result.resources.find(r=>r.resource==='alert').actualScopes,stale.alert.properties.scopes);
for(const [message,expected] of [['AuthorizationFailed 403','azure_rbac'],['InvalidAuthenticationToken 401','authentication'],['ResourceNotFound 404','resource_mapping']]){
 let calls=0;const report=probe(env,{execute,read:key=>{calls++;if(key==='app')throw new Error(message);return data()[key];}});
 assert.equal(calls,5);assert.equal(report.resources[0].category,expected);assert.equal(report.monitoring.status,'blocked');assert.equal(report.backup.status,'passed');assert.equal(report.passed,false);
}
const wrong=data();wrong.postgres.id=resources.app;assert.equal(run(wrong).resources.find(r=>r.resource==='postgres').category,'resource_mapping');
const sensitive=data();sensitive.insights.properties.connectionString='SECRET_SENTINEL';assert(!JSON.stringify(run(sensitive)).includes('SECRET_SENTINEL'));
assert.equal(category(new Error('Other failure')),'unexpected_error');assert.equal(validateContext(env),sha);
const workflow=fs.readFileSync(new URL('../.github/workflows/readiness-oidc-verification.yml',import.meta.url),'utf8');
assert(workflow.includes("if: github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main' && github.repository == 'oemercam/binso_admin_azure'"));
assert(!workflow.includes('secrets.')&&!workflow.includes('continue-on-error')&&!workflow.includes('pull_request_target'));
assert(workflow.indexOf('id-token: write')>workflow.indexOf('  readiness:'));
assert(workflow.includes('node scripts/readiness-oidc-probe.mjs --validate'));
console.log('OIDC probe contracts passed: PR/fork/wrong identity/SHA blocked; five GETs independently classified; stale monitoring fails while backup succeeds; no secret payload in report.');
