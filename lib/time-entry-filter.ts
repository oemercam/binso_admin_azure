export type TimeEntryFilter={query:string;from:string;to:string;status:string};
export function filterTimeEntries<T extends {customer_name?:string|null;project_name?:string|null;employee_name?:string|null;description?:string|null;started_at?:string|null;billable?:boolean;approved?:boolean;invoiced_invoice_id?:string|null}>(items:T[],filter:TimeEntryFilter):T[]{
 const query=filter.query.trim().toLocaleLowerCase("de-CH");
 return items.filter(item=>{
  const date=String(item.started_at??"").slice(0,10);
  if(filter.from&&date<filter.from||filter.to&&date>filter.to)return false;
  if(query&&![item.customer_name,item.project_name,item.employee_name,item.description].filter(Boolean).join(" ").toLocaleLowerCase("de-CH").includes(query))return false;
  if(filter.status==="Verrechnet")return !!item.invoiced_invoice_id;
  if(filter.status==="Freigegeben")return !!item.approved&&!item.invoiced_invoice_id;
  if(filter.status==="Zu prüfen")return !!item.billable&&!item.approved&&!item.invoiced_invoice_id;
  if(filter.status==="Intern")return !item.billable;
  return true;
 });
}
