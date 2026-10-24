/** Shared offer/invoice editing. Unit values are preserved, including historic custom values. */
export const documentUnits = ['Stück', 'Stunden', 'Tage', 'Pauschal', 'Meter', 'm²', 'Kilometer'] as const;
export function documentUnitOptions(current?:string){return current&&!documentUnits.some(unit=>unit===current)?[current,...documentUnits]:[...documentUnits];}
export const positionNumber=(index:number)=>String(index+1).padStart(2,'0');
type LinkedLine={id:string;expenseIds?:string[];timeEntryIds?:string[];timeAllocations?:readonly unknown[]};
export function canDuplicateDocumentLine(line:LinkedLine){return !line.expenseIds?.length&&!line.timeEntryIds?.length&&!line.timeAllocations?.length;}
export function moveDocumentLine<T extends LinkedLine>(lines:readonly T[],id:string,direction:-1|1):T[]{
 const index=lines.findIndex(line=>line.id===id),target=index+direction;
 if(index<0||target<0||target>=lines.length)return [...lines];
 const result=[...lines];[result[index],result[target]]=[result[target],result[index]];return result;
}
/** Move the existing line to the target slot without changing its billing links. */
export function reorderDocumentLine<T extends LinkedLine>(lines:readonly T[],id:string,targetId:string):T[]{
 const from=lines.findIndex(line=>line.id===id),to=lines.findIndex(line=>line.id===targetId);
 if(from<0||to<0||from===to)return [...lines];
 const result=[...lines],item=result.splice(from,1)[0];result.splice(to,0,item);return result;
}
export function duplicateDocumentLine<T extends LinkedLine>(lines:readonly T[],id:string,newId:string):T[]{
 const index=lines.findIndex(line=>line.id===id);
 if(index<0)throw new RangeError('Position nicht gefunden.');
 if(!newId||lines.some(line=>line.id===newId))throw new RangeError('Die neue Positionskennung ist nicht eindeutig.');
 if(!canDuplicateDocumentLine(lines[index]))throw new RangeError('Verknüpfte Zeiten und Belege dürfen nicht doppelt verrechnet werden.');
 return [...lines.slice(0,index+1),{...lines[index],id:newId},...lines.slice(index+1)];
}
