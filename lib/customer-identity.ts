export type CustomerChoice={id?:string;name?:string;sector:string;city:string;address:string;zip:string;paymentDays?:number};
export type CustomerDirectory=Record<string,CustomerChoice>;
export function customerDirectory(rows:readonly {id:string;name:string;sector?:string;city?:string;street?:string;building_number?:string;postal_code?:string;paymentDays?:number}[]):CustomerDirectory{
 return Object.fromEntries(rows.map(item=>[item.id,{id:item.id,name:item.name,sector:item.sector??'',city:item.city??'',address:[item.street,item.building_number].filter(Boolean).join(' '),zip:item.postal_code??'',...(item.paymentDays!=null?{paymentDays:item.paymentDays}:{})}]));
}
/** A persisted ID always wins. Never select another customer after rename/archive.
 * Legacy name-only drafts resolve only when the name is unambiguous. */
export function resolveCustomer(draft:{customer:string;customerId?:string},directory:CustomerDirectory):CustomerChoice|undefined{
 if(draft.customerId)return Object.values(directory).find(item=>item.id===draft.customerId);
 const matches=Object.entries(directory).filter(([key,item])=>(item.name??key)===draft.customer);
 return matches.length===1?matches[0][1]:undefined;
}
