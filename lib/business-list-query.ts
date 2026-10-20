/** Public list filters are explicit and normalized once. Route-owned equality
 * constraints win over client input; repositories still authorize and bind SQL. */
export function businessListQuery(table:string,params:URLSearchParams,defaultOrder='created_at.desc',equalFilters:Record<string,string>={}){
 const filters=new URLSearchParams({order:defaultOrder});
 for(const key of ['q','order','limit','offset',...(table==='customers'?['include','outstanding']:[]),...(table==='expenses'?['review']:[])]){const value=params.get(key);if(value)filters.set(key,value)}
 const keys=['id','status',...(['documents','payments','expenses','projects','customer_contacts'].includes(table)?['customer_id']:[]),...(table==='documents'?['number','kind','display_status']:[]),...(table==='products'?['kind']:[]),...(table==='expenses'?['employee_id']:[])];
 for(const key of keys){const value=params.get(key);if(value)filters.set(key,'eq.'+value.replace(/^eq\./,''))}
 for(const [key,value] of Object.entries(equalFilters))if(value)filters.set(key,'eq.'+value.replace(/^eq\./,''));
 return filters;
}
