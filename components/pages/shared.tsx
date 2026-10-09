"use client";

import { formatCurrency } from "@/lib/financial-status";
import { formatQuantity, withPriceUnit } from "@/lib/display-format";
import { useEffect, useState } from "react";
import { type DemoCollection } from "@/lib/demo-storage";
import { apiGet, isProductionBackendEnabled } from "@/lib/client/backend";

export function moneyChf(value:unknown){
  const amount=Number(value);
  return `CHF ${Number.isFinite(amount)?amount.toLocaleString("de-CH",{minimumFractionDigits:2,maximumFractionDigits:2}):"0.00"}`;
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

export function mapRemoteRows(collection:DemoCollection,items:Record<string,unknown>[]):string[][]{
  if(collection==="customers") return items.map(item=>[
    String(item.name??""),String(item.contact??item.contact_name??""),String(item.city??""),String(item.id??""),item.status==="inactive"?"Inaktiv":"Aktiv"
  ]);
  if(collection==="products") return items.map(item=>[
    String(item.name??""),item.kind==="product"?"Produkt":"Dienstleistung",withPriceUnit(moneyChf(item.unit_price),item.unit),String(item.id??""),item.status==="inactive"?"Inaktiv":"Aktiv"
  ]);
  if(collection==="employees") return items.map(item=>[
    [item.first_name,item.last_name].filter(Boolean).join(" "),String(item.job_title??"—"),formatQuantity(item.workload_percent??0,"%"),String(item.id??""),item.status==="inactive"?"Inaktiv":"Aktiv"
  ]);
  if(collection==="expenses") return items.map(item=>{
    const employee=item.employee as {first_name?:string;last_name?:string}|null|undefined;
    const person=employee?[employee.first_name,employee.last_name].filter(Boolean).join(" "):"Nicht zugewiesen";
    const statusMap:Record<string,string>={draft:"Entwurf",submitted:"Eingereicht",approved:"Genehmigt",posted:"Verbucht",rejected:"Abgelehnt"};
    return [String(item.merchant??""),person,moneyChf(item.amount),String(item.id??""),statusMap[String(item.status)]??String(item.status??"")];
  });
  if(collection==="payments") return items.map(item=>{
    const customer=item.customer as {name?:string}|null|undefined;
    const invoice=item.invoice as {number?:string;currency?:string}|null|undefined;
    const statusMap:Record<string,string>={pending:"Ausstehend",booked:"Verbucht",reversed:"Storniert"};
    return [String(item.id??""),swissDate(item.paid_on),String(customer?.name??"Kunde"),[invoice?.number,paymentMethodLabel(item.method)].filter(Boolean).join(" · "),formatCurrency(item.amount,String(item.currency??invoice?.currency??"CHF")),statusMap[String(item.status)]??String(item.status??"")];
  });
  return [];
}

export function useDemoRows(collection:DemoCollection, defaults:string[][]) {
  const [rows,setRows]=useState<string[][]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  useEffect(()=>{
    let active=true;
    const sync=()=>{
      const path=isProductionBackendEnabled()?`/api/${collection}`:`/api/demo/data?collection=${collection}`;
      apiGet<{items:Record<string,unknown>[]}>(path)
        .then(payload=>{if(active){setRows(mapRemoteRows(collection,payload.items));setError(null);}})
        .catch(reason=>{if(active)setError(reason instanceof Error?reason.message:"Einträge konnten nicht geladen werden.");})
        .finally(()=>{if(active)setLoading(false);});
    };
    sync();
    const listener=(event:Event)=>{
      const detail=(event as CustomEvent<{collection?:string}>).detail;
      if(!detail?.collection||detail.collection===collection)sync();
    };
    window.addEventListener("binso-demo-data",listener);
    window.addEventListener("storage",sync);
    return()=>{active=false;window.removeEventListener("binso-demo-data",listener);window.removeEventListener("storage",sync);};
  },[collection,defaults]);
  return {rows,loading,error};
}
