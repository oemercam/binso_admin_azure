import {createHash} from 'node:crypto';

/** Exact owner-supplied Revision7, not a mutable generated acceptance result. */
export const revision7SourceSha256='23bc8bffd954cabb0b265a723e9fde2a713ad42d4e7150a5cb2765c7c367a363';
export function revision7Clauses(source){
 if(createHash('sha256').update(source).digest('hex')!==revision7SourceSha256)throw Error('Revision7 original source changed');
 const headers=[...source.matchAll(/^## (\d+)\. (.+)$/gm)],clauses=[];
 if(headers.length!==56||headers.some((header,index)=>Number(header[1])!==index+1))throw Error('Expected all56 ordered Revision7 chapters');
 for(let index=0;index<headers.length;index++){
  const match=headers[index],chapter=Number(match[1]),body=source.slice(match.index+match[0].length,headers[index+1]?.index??source.length);let sequence=0;
  for(const block of body.split(/\r?\n\s*\r?\n/)){
   const paragraph=block.trim();if(!paragraph||/^---$/.test(paragraph)||/^# REVISION/.test(paragraph))continue;
   for(const clause of paragraph.split(/\r?\n(?=[-*]|\d+\.)/).flatMap(part=>part.split(/(?<=[.!?])\s+(?=[A-ZÄÖÜ*«„])/u))){
    if(/^###/.test(clause)||/^\d+\.$/.test(clause.trim()))continue;
    const requirement=clause.trim();
    clauses.push({id:`R7-${String(chapter).padStart(2,'0')}-${String(++sequence).padStart(3,'0')}`,chapter,title:match[2],priority:match[2].match(/\[(P[^\]]+)\]/)?.[1]??'P0–P2',requirement,sourceTextSha256:createHash('sha256').update(requirement).digest('hex'),sourceParagraph:paragraph});
   }
  }
 }
 if(clauses.length!==573)throw Error('Expected all573 Revision7 clauses');
 return clauses;
}
