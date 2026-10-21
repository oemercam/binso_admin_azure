"use client";

import { formatCurrency } from "@/lib/financial-status";
import { formatQuantity, withPriceUnit } from "@/lib/display-format";
import {useApiQuery} from "@/lib/client/use-api-query";
import {useLocale,useTranslation} from "@/lib/client/locale";
import {localeTags} from "@/lib/locales/config";
type DataCollection = "customers" | "products" | "employees" | "expenses" | "payments";
import { isProductionBackendEnabled } from "@/lib/client/backend";
import {useRecordsController} from "../records";

export function moneyChf(value:unknown,locale='de-CH'){
  const amount=Number(value);
  return `CHF ${Number.isFinite(amount)?amount.toLocaleString(locale,{minimumFractionDigits:2,maximumFractionDigits:2}):"0.00"}`;
}

export function formatMinutes(value:number){const minutes=Math.round(value);return `${Math.floor(minutes/60)}:${String(minutes%60).padStart(2,"0")}`}

export function paymentMethodLabel(value:unknown){
  const labels:Record<string,string>={bank:"Banküberweisung",bank_transfer:"Banküberweisung",card:"Kreditkarte",cash:"Bar",twint:"TWINT"};
  const raw=String(value??"—");return labels[raw.toLowerCase()]??raw;
}

export function swissDate(value:unknown){
  if(typeof value!=="string") return "";
  const parts=value.slice(0,10).split("-");
  return parts.length===3?`${parts[2]}.${parts[1]}.${parts[0]}`:value;
}

export function mapRemoteRows(collection:DataCollection,items:Record<string,unknown>[],{locale='de-CH',translateUnit=label=>label}:{locale?:string;translateUnit?:(label:string)=>string}={}):string[][]{
  if(collection==="customers") return items.map(item=>[
    String(item.name??""),String(item.contact??item.contact_name??""),String(item.city??""),String(item.id??""),item.status==="inactive"?"Inaktiv":"Aktiv",String(item.customer_no??""),customerAmounts(item.financials,'revenue',locale),customerAmounts(item.financials,'open_amount',locale)
  ]);
  if(collection==="products") return items.map(item=>[
    String(item.name??""),item.kind==="product"?"Produkt":"Dienstleistung",withPriceUnit(moneyChf(item.unit_price,locale),item.unit,translateUnit),String(item.id??""),item.status==="inactive"?"Inaktiv":"Aktiv"
  ]);
  if(collection==="employees") return items.map(item=>[
    [item.first_name,item.last_name].filter(Boolean).join(" "),String(item.job_title??"—"),formatQuantity(item.workload_percent??0,"%",locale),String(item.id??""),item.status==="inactive"?"Inaktiv":"Aktiv"
  ]);
  if(collection==="expenses") return items.map(item=>{
    const employee=item.employee as {first_name?:string;last_name?:string}|null|undefined;
    const person=employee?[employee.first_name,employee.last_name].filter(Boolean).join(" "):"Nicht zugewiesen";
    const statusMap:Record<string,string>={draft:"Entwurf",submitted:"Eingereicht",approved:"Genehmigt",posted:"Verbucht",rejected:"Abgelehnt"};
    return [String(item.merchant??""),person,formatCurrency(Number(item.amount),String(item.currency??"CHF"),locale),String(item.id??""),statusMap[String(item.status)]??String(item.status??""),swissDate(item.expense_date)];
  });
  if(collection==="payments") return items.map(item=>{
    const customer=item.customer as {name?:string}|null|undefined;
    const invoice=item.invoice as {number?:string;currency?:string}|null|undefined;
    const statusMap:Record<string,string>={pending:"Ausstehend",booked:"Verbucht",reversed:"Storniert"};
    return [String(item.id??""),swissDate(item.paid_on),String(customer?.name??"Kunde"),[invoice?.number,paymentMethodLabel(item.method)].filter(Boolean).join(" · "),formatCurrency(item.amount,String(item.currency??invoice?.currency??"CHF"),locale),statusMap[String(item.status)]??String(item.status??"")];
  });
  return [];
}

/** No financial permission/response is an em dash, never an invented zero. */
function customerAmounts(value:unknown,key:'revenue'|'open_amount',locale:string){
 if(!Array.isArray(value)||!value.length)return '—';
 return value.filter(item=>item&&typeof item.currency==='string'&&Number.isFinite(Number(item[key]))).map(item=>formatCurrency(item[key],item.currency,locale)).join(' · ')||'—';
}

export function useRemoteRows(collection:DataCollection,filters="") {
  const {locale}=useLocale(),translateUnit=useTranslation();
  const base=`/api/${collection}`;
  const path=base+(filters?(base.includes('?')?'&':'?')+filters:'');
  const {data,loading,error}=useApiQuery<{items:Record<string,unknown>[];total?:number}>(path);
  return {rows:mapRemoteRows(collection,data?.items??[],{locale:localeTags[locale],translateUnit}),total:data?.total??Number(data?.items?.[0]?.total_count??data?.items?.length??0),loading,error};
}

/** Module configuration changes domain fields, never the committed list state owner. */
export function useRecordList(collection:DataCollection,options:Parameters<typeof useRecordsController>[0]&{sortFields:Record<number,string>;defaultOrder?:string;scope?:{customerId?:string|null;employeeId?:string|null;review?:boolean};filterValues:Record<string,{field:'status'|'kind';value:string}>}){
 const controller=useRecordsController(options),pageSize=50;
 const {sortFields,defaultOrder='created_at.desc',filterValues}=options;
 const field=sortFields[controller.sortIndex];
 const filters=new URLSearchParams({limit:String(pageSize),offset:String(controller.page*pageSize),order:controller.sort==='default'||!field?defaultOrder:field+'.'+controller.sort});
 if(controller.query.trim())filters.set('q',controller.query.trim());
 if(options.scope?.customerId)filters.set('customer_id','eq.'+options.scope.customerId);
 if(options.scope?.review)filters.set('review','1');
 if(options.scope?.employeeId)filters.set('employee_id','eq.'+options.scope.employeeId);
 const selected=filterValues[controller.activeChip];if(selected)filters.set(selected.field,selected.value);
 const data=useRemoteRows(collection,filters.toString());
 return {...data,controller,pagination:{total:data.total,page:controller.page,pageSize,onPage:controller.setPage}};
}
