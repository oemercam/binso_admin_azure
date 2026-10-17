/** Advisory guard for the authenticated Codex orchestrator, never a merge token.
 * Input must come from fresh authenticated GitHub reads, never from PR content.
 */
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
const sha=value=>typeof value==='string'&&/^[a-f0-9]{40}$/.test(value);
const canonical=p=>typeof p==='string'&&!/[\\\r\n]/.test(p)&&!p.split('/').some(s=>!s||s==='.'||s==='..');
const governance=p=>/^(\.github\/|AGENTS\.md$|package\.json$|pnpm-|next\.config|database\/|infrastructure\/|config\/|ux-compliance\/|scripts\/)|(^|\/)(auth|session|permission|role|tenant|payment|stripe|security|release|deploy|migration|retention|graph-mail|model-a)|^docs\/(audit\/v24\/reference\/|architecture\/reference-foundation\.md$|codex-workflow\/)/i.test(p);
export function classifyChanges(files,{additions,deletions}={}){
 if(!Array.isArray(files)||!files.length)return {risk:'critical',automatic:false,reason:'Missing complete diff'};
 const paths=files.map(f=>typeof f==='string'?f:f?.filename);
 if(paths.some(p=>!canonical(p)||governance(p))||files.some(f=>typeof f==='object'&&(!['added','modified','removed'].includes(f?.status)||f.previous_filename)))return {risk:'critical',automatic:false,reason:'Governance, security, rename or unknown path'};
 const prose=paths.every(p=>/^(README\.md|docs\/.+\.(md|txt))$/.test(p));
 const bounded=paths.length<=10&&Number.isSafeInteger(additions)&&additions>=0&&Number.isSafeInteger(deletions)&&deletions>=0&&additions+deletions<=200;
 if(prose&&bounded)return {risk:'routine',automatic:true,reason:'Bounded prose-only diff'};
 return {risk:'elevated',automatic:false,reason:'Runtime, test semantics, shared dependencies or scope require separate assessment'};
}
export function integrationDecision(snapshot){
 const s=snapshot??{},pr=s.pr??{},branch=s.main??{},p=s.protection??{};
 const classification=classifyChanges(s.files,{additions:pr.additions,deletions:pr.deletions});
 const reasons=[];
 if(!classification.automatic)reasons.push(classification.reason);
 if(s.repository!=='oemercam/binso_admin_azure'||pr.headRepository!==s.repository||pr.baseRef!=='main')reasons.push('Unexpected repository or fork/base');
 if(!sha(pr.headSha)||s.inspectedHeadSha!==pr.headSha||!sha(branch.sha)||pr.baseSha!==branch.sha)reasons.push('Stale or incomplete commit binding');
 if(pr.state!=='open'||pr.draft!==false||pr.mergeableState!=='clean')reasons.push('PR is not ready under GitHub rules');
 if(!Array.isArray(s.files)||pr.changedFiles!==s.files.length||s.files.some(f=>!f||typeof f!=='object'||!['added','modified','removed'].includes(f.status))||new Set(s.files.map(f=>f?.filename)).size!==pr.changedFiles)reasons.push('Incomplete or duplicate file list');
 if(p.enabled!==true||p.enforceAdmins!==true||p.requirePullRequest!==true||p.strict!==true||p.requireConversationResolution!==true)reasons.push('Required protection unavailable');
 for(const name of ['quality','analyze']){
  if(!p.requiredChecks?.some(c=>c.context===name&&c.appId===15368))reasons.push('Missing protected check: '+name);
  const check=(s.checkRuns??[]).filter(c=>c.name===name&&c.appId===15368).sort((a,b)=>b.id-a.id)[0];
  if(!check||check.headSha!==pr.headSha||check.status!=='completed'||check.conclusion!=='success')reasons.push('Missing, stale or unsuccessful check: '+name);
 }
 if(s.unresolvedThreads!==0||!Array.isArray(s.reviews)||s.reviews.some(r=>['CHANGES_REQUESTED','PENDING'].includes(r.state)))reasons.push('Review evidence missing or unresolved');
 return {risk:classification.risk,ready:reasons.length===0,expectedHeadSha:pr.headSha??null,reasons};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const result=integrationDecision(JSON.parse(fs.readFileSync(process.argv[2],'utf8')));
 console.log(JSON.stringify(result,null,2));
 if(!result.ready)process.exitCode=1;
}
