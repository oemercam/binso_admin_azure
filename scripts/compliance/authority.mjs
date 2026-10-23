import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {revision7Clauses} from '../revision7-source.mjs';

export const authorityPaths=['docs/audit/v25-revision7/source.md','docs/audit/v25-revision7/requirements.json'];
const digest=value=>createHash('sha256').update(value).digest('hex');
/** Current source clauses are review obligations, never imported pass results. */
export function revision7Authority(source,register){
 const clauses=new Map(revision7Clauses(source).map(row=>[row.id,row]));
 const sourceSha256=digest(source),chapters=[...source.matchAll(/^## (\d+)\. /gm)].map(match=>Number(match[1]));
 if(register?.sourceSha256!==sourceSha256||register.chapters!==56||chapters.length!==56||new Set(chapters).size!==56||!Array.isArray(register.requirements)||register.requirements.length!==573||new Set(register.requirements.map(row=>row.chapter)).size!==56)throw Error('Incomplete or stale Revision7 source/register');
 const ids=new Set();
 const requirements=register.requirements.map(row=>{
  const expected=clauses.get(row.id);
  if(!expected||['chapter','title','priority','requirement','sourceTextSha256'].some(key=>row[key]!==expected[key]))throw Error('Revision7 clause does not match the exact source position: '+row.id);
  if(!/^R7-\d{2}-\d{3}$/.test(row.id)||!row.id.startsWith('R7-'+String(row.chapter).padStart(2,'0')+'-')||ids.has(row.id)||!chapters.includes(row.chapter)||typeof row.requirement!=='string'||!row.requirement.trim()||!source.includes(row.requirement)||digest(row.requirement)!==row.sourceTextSha256)throw Error('Invalid Revision7 clause: '+row.id);
  ids.add(row.id);
  return {id:row.id,description:row.title,routes:['revision7'],componentTypes:['Revision7 acceptance'],expected:row.requirement,owner:'Revision7 chapter '+row.chapter,method:'review',testCase:'TC-'+row.id,priority:row.priority,acceptance:row.requirement,sourceTextSha256:row.sourceTextSha256,sourceSha256,provenance:authorityPaths[0],acceptanceScope:'All obligations in this exact clause require current referenced evidence and explicit independent review; generated implementation status does not grant acceptance.',expectedCases:[{route:'revision7',state:'clause-review',sourceTextSha256:row.sourceTextSha256,sourceSha256}]};
 });
 return {name:'BINSO ONE V25 Complete Master Implementation Revision7',source:authorityPaths[0],sourceSha256,chapters:56,clauseCount:requirements.length,priorities:'P0/P1/P2; P3 excluded',requirements};
}
export function readRevision7Authority(){return revision7Authority(fs.readFileSync(authorityPaths[0],'utf8'),JSON.parse(fs.readFileSync(authorityPaths[1],'utf8')));}
/** Bind normative clauses/case obligations, not mutable result prose. Otherwise
 * recording a test result would invalidate the very unchanged code it proves. */
export function revision7Identity(){
 const authority=readRevision7Authority();
 return JSON.stringify({...authority,requirements:[...authority.requirements].sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0)});
}
export function partitionHistoricalRegistry(registry){
 if(!Array.isArray(registry?.requirements)||!registry.requirements.length)throw Error('Missing technical compliance registry');
 const historical=[],technical=[];
 for(const row of registry.requirements){
  if(/^V22\.[12]-/.test(row.id))historical.push(row);
  else if(/^UX-/.test(row.id))technical.push(row);
  else throw Error('Unclassified compliance requirement: '+row.id);
 }
 return {technical,historical};
}
