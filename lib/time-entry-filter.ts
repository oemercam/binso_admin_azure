export type TimeEntryFilter={query:string;from:string;to:string;status:string;projectId?:string|null;customerId?:string|null};
export const timeStatusFilters:Record<string,string>={'Alle':'all','Verrechnet':'invoiced','Freigegeben':'approved','Erfasst':'recorded','Eingereicht':'submitted','Zur Prüfung':'submitted','Zurückgewiesen':'rejected','Zu prüfen':'unapproved','Intern':'internal'};
export function timeEntryQuery(filter:TimeEntryFilter,{page=0,employeeId,review=false,own=false,internal=false,projectLabel}:{page?:number;employeeId?:string|null;review?:boolean;own?:boolean;internal?:boolean;projectLabel?:string}={}){
 const params=new URLSearchParams({limit:'50',offset:String(Math.max(0,page)*50),status:timeStatusFilters[filter.status]??'all'});
 for(const [key,value] of Object.entries({q:filter.query.trim(),from:filter.from,to:filter.to,projectId:filter.projectId,customerId:filter.customerId,employeeId,projectLabel}))if(value)params.set(key,value);
 if(review)params.set('review','1');if(own)params.set('own','1');if(internal)params.set('internal','1');
 return params;
}
export function filterTimeEntries<T extends {project_id?:string|null;customer_id?:string|null;customer_name?:string|null;project_name?:string|null;employee_name?:string|null;description?:string|null;started_at?:string|null;billable?:boolean;approved?:boolean;submitted_at?:string|null;review_note?:string|null;invoiced_invoice_id?:string|null}>(items:T[],filter:TimeEntryFilter):T[]{
 const query=filter.query.trim().toLocaleLowerCase("de-CH");
 return items.filter(item=>{
  if(filter.projectId&&item.project_id!==filter.projectId||filter.customerId&&item.customer_id!==filter.customerId)return false;
  const date=String(item.started_at??"").slice(0,10);
  if(filter.from&&date<filter.from||filter.to&&date>filter.to)return false;
  if(query&&![item.customer_name,item.project_name,item.employee_name,item.description].filter(Boolean).join(" ").toLocaleLowerCase("de-CH").includes(query))return false;
  if(filter.status==="Verrechnet")return !!item.invoiced_invoice_id;
  if(filter.status==="Freigegeben")return !!item.billable&&!!item.approved&&!item.invoiced_invoice_id;
  if(filter.status==="Erfasst")return !item.approved&&!item.submitted_at&&!item.invoiced_invoice_id&&!item.review_note?.trim();
  if(filter.status==="Zurückgewiesen")return !item.approved&&!item.submitted_at&&!item.invoiced_invoice_id&&!!item.review_note?.trim();
  if(filter.status==="Zur Prüfung"||filter.status==="Eingereicht")return !item.approved&&!!item.submitted_at&&!item.invoiced_invoice_id;
  if(filter.status==="Zu prüfen")return !!item.billable&&!item.approved&&!item.invoiced_invoice_id;
  if(filter.status==="Intern")return !item.billable;
  return true;
 });
}
