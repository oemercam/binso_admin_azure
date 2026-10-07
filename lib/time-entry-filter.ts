export type TimeEntryFilter={query:string;from:string;to:string;status:string;projectId?:string|null;customerId?:string|null};
export function filterTimeEntries<T extends {project_id?:string|null;customer_id?:string|null;customer_name?:string|null;project_name?:string|null;employee_name?:string|null;description?:string|null;started_at?:string|null;billable?:boolean;approved?:boolean;submitted_at?:string|null;invoiced_invoice_id?:string|null}>(items:T[],filter:TimeEntryFilter):T[]{
 const query=filter.query.trim().toLocaleLowerCase("de-CH");
 return items.filter(item=>{
  if(filter.projectId&&item.project_id!==filter.projectId||filter.customerId&&item.customer_id!==filter.customerId)return false;
  const date=String(item.started_at??"").slice(0,10);
  if(filter.from&&date<filter.from||filter.to&&date>filter.to)return false;
  if(query&&![item.customer_name,item.project_name,item.employee_name,item.description].filter(Boolean).join(" ").toLocaleLowerCase("de-CH").includes(query))return false;
  if(filter.status==="Verrechnet")return !!item.invoiced_invoice_id;
  if(filter.status==="Freigegeben")return !!item.billable&&!!item.approved&&!item.invoiced_invoice_id;
  if(filter.status==="Erfasst")return !!item.billable&&!item.approved&&!item.submitted_at&&!item.invoiced_invoice_id;
  if(filter.status==="Zur Prüfung")return !!item.billable&&!item.approved&&!!item.submitted_at&&!item.invoiced_invoice_id;
  if(filter.status==="Zu prüfen")return !!item.billable&&!item.approved&&!item.invoiced_invoice_id;
  if(filter.status==="Intern")return !item.billable;
  return true;
 });
}
