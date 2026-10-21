const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const validPair=(sourceId:string,targetId:string)=>uuid.test(sourceId)&&uuid.test(targetId)&&sourceId!==targetId;
export type CustomerMergePreview={revision:string;eligible:boolean;source:{id:string;name:string;number:string};target:{id:string;name:string;number:string};changes:Array<{field:string;label:string;sourceValue:string;targetValue:string;mode:'fill'|'keep'|'same'}>;contactsToMove:number;activitiesToMove:number;blockers:string[]};
export type CustomerMergeReceipt={item:{merged:true;id:string;sourceId:string;contactsMoved:number;activitiesMoved:number}};
export type CustomerMergeCancellation={cancelled:true;id:string;sourceId:string};
export function isCustomerMergeCancellation(value:unknown,sourceId:string,targetId:string):value is CustomerMergeCancellation{return validPair(sourceId,targetId)&&!!value&&typeof value==='object'&&'cancelled' in value&&value.cancelled===true&&'id' in value&&value.id===targetId&&'sourceId' in value&&value.sourceId===sourceId;}
export function isCustomerMergePreview(value:unknown,sourceId:string,targetId:string):value is CustomerMergePreview{
 if(!validPair(sourceId,targetId)||!value||typeof value!=='object')return false;const p=value as Record<string,unknown>,source=p.source as Record<string,unknown>|undefined,target=p.target as Record<string,unknown>|undefined;
 return typeof p.revision==='string'&&/^[a-f0-9]{64}$/.test(p.revision)&&typeof p.eligible==='boolean'&&!!source&&source.id===sourceId&&typeof source.name==='string'&&typeof source.number==='string'&&!!target&&target.id===targetId&&typeof target.name==='string'&&typeof target.number==='string'&&Array.isArray(p.blockers)&&p.blockers.every(v=>typeof v==='string')&&p.eligible===(p.blockers.length===0)&&[p.contactsToMove,p.activitiesToMove].every(n=>typeof n==='number'&&Number.isSafeInteger(n)&&n>=0)&&Array.isArray(p.changes)&&p.changes.every(v=>v&&typeof v==='object'&&['field','label','sourceValue','targetValue'].every(k=>typeof v[k]==='string')&&['fill','keep','same'].includes(v.mode));
}
export function isCustomerMergeReceipt(value:unknown,sourceId:string,targetId:string):value is CustomerMergeReceipt{
 if(!value||typeof value!=='object'||!('item' in value)||!value.item||typeof value.item!=='object')return false;
 const item=value.item as Record<string,unknown>;
 return validPair(sourceId,targetId)&&item.merged===true&&item.id===targetId&&item.sourceId===sourceId&&[item.contactsMoved,item.activitiesMoved].every(n=>typeof n==='number'&&Number.isSafeInteger(n)&&n>=0);
}
