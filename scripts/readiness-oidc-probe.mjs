import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {resources,readResource,inspectReadiness} from './azure-readiness-check.mjs';
export const identity={client:'d9ad1b32-dd83-4421-801d-9bae92f8d3ee',tenant:'8b0bab04-0ac3-48e2-85bd-6b857601aa5b',subscription:'57c41f8a-69de-4655-bea5-fad30de6921a'};
export function validateContext(env){
 if(env.GITHUB_REPOSITORY!=='oemercam/binso_admin_azure'||env.GITHUB_REF!=='refs/heads/main'||env.GITHUB_EVENT_NAME!=='workflow_dispatch'||!/^[a-f0-9]{40}$/.test(env.GITHUB_SHA??''))throw new Error('Only exact-SHA manual dispatch on this repository main may use readiness');
 for(const [key,value] of Object.entries(identity))if(env['READINESS_'+key.toUpperCase()+'_ID']!==value)throw new Error('Missing or unexpected dedicated readiness '+key+' ID');
 return env.GITHUB_SHA;
}
export function category(error){
 const text=String(error.stderr??'')+' '+error.message;
 if(/AuthorizationFailed|Forbidden|Access denied|\b403\b/i.test(text))return 'azure_rbac';
 if(/AuthenticationFailed|AADSTS|InvalidAuthenticationToken|Azure account is not|\b401\b/i.test(text))return 'authentication';
 if(/ResourceNotFound|ResourceGroupNotFound|\b404\b|resource ID/i.test(text))return 'resource_mapping';
 if(/Only exact-SHA|Missing or unexpected|Checked-out SHA differs|Expected --/.test(text))return 'configuration';
 return 'unexpected_error';
}
export function probe(env,{execute=execFileSync,read=readResource}={}){
 const sha=validateContext(env);
 if(execute('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()!==sha)throw new Error('Checked-out SHA differs from dispatch SHA');
 const account=JSON.parse(execute('az',['account','show','-o','json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
 if(account.tenantId!==identity.tenant||account.id!==identity.subscription||account.user?.type!=='servicePrincipal'||account.user?.name?.toLowerCase()!==identity.client)throw new Error('Azure account is not the dedicated readiness identity');
 const report={sourceSha:sha,authentication:{status:'passed',clientId:identity.client,tenantId:identity.tenant},resources:[],monitoring:null,backup:null,passed:false},cache={};
 for(const key of Object.keys(resources)){
  try{
   const data=read(key);
   if(data?.id?.toLowerCase()!==resources[key].toLowerCase())throw new Error('Wrong resource ID');
   cache[key]=data;
   const result={resource:key,id:data.id,status:'passed'};
   // Never log/persist full resource JSON, Insights keys or any token.
   if(key==='alert')result.actualScopes=data.properties?.scopes??[];
   report.resources.push(result);
  }catch(error){report.resources.push({resource:key,id:resources[key],status:'failed',category:category(error)});}
 }
 for(const mode of ['monitoring','backup']){
  const needed=mode==='backup'?['postgres']:['app','insights','alert','actionGroup'];
  if(needed.some(key=>!cache[key])){report[mode]={status:'blocked',category:'resource_get_failed'};continue;}
  try{report[mode]={status:'passed',message:inspectReadiness(mode,key=>cache[key])};}
  catch(error){report[mode]={status:'failed',category:'readiness_configuration',message:error.message};}
 }
 report.passed=report.resources.every(r=>r.status==='passed')&&report.monitoring.status==='passed'&&report.backup.status==='passed';
 return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  if(process.argv[2]==='--validate'){
   const sha=validateContext(process.env);
   if(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()!==sha)throw new Error('Checked-out SHA differs from dispatch SHA');
   console.log('Validated readiness configuration for '+sha);
  }else if(process.argv[2]==='--probe'){
   const report=probe(process.env),output=JSON.stringify(report,null,2);
   console.log(output);
   if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'```json\n'+output+'\n```\n');
   if(!report.passed)process.exitCode=1;
  }else throw new Error('Expected --validate or --probe');
 }catch(error){console.error('::error::Readiness verification blocked: '+category(error));process.exitCode=1;}
}
