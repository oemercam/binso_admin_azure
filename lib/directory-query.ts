/** All filters are encoded; the API retains its tenant/RLS and page-size limits. */
export function directoryQuery(endpoint:string,{query='',page=0,id,customerId}:{query?:string;page?:number;id?:string;customerId?:string|null}={}){
 const url=new URL(endpoint,'https://binso.invalid');
 url.searchParams.set('limit','50');url.searchParams.set('offset',String(Math.max(0,page)*50));
 if(query.trim())url.searchParams.set('q',query.trim());
 if(id)url.searchParams.set('id','eq.'+id);
 if(customerId)url.searchParams.set(url.pathname==='/api/projects'?'customerId':'customer_id',url.pathname==='/api/projects'?customerId:'eq.'+customerId);
 return url.pathname+url.search;
}
