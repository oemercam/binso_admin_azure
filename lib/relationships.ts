"use client";

import { getModule, type ModuleKey } from "@/lib/modules";
import { listLocalRecords, parseMoney, type LocalRecord } from "@/lib/local-store";
import { listAppRecords } from "@/lib/client/data-service";
import { isProductionMode } from "@/lib/client/runtime";
import {getDemoModuleSeed} from "@/lib/demo/module-seeds";
import {domainConfig} from "@/config/domain";

export type EntityOption = {
  id: string;
  module: ModuleKey;
  label: string;
  sub?: string;
  record?: LocalRecord;
  seedIndex?: number;
  fields: Record<string,string>;
};

function seedOptions(module:ModuleKey):EntityOption[]{
  const config=getModule(module);
  return getDemoModuleSeed(module).rows.map((row,index)=>({
    id:`seed:${module}:${index+1}`,
    module,
    label:row[0]||`${config.label} ${index+1}`,
    sub:[row[1],row[2]].filter(Boolean).join(" · "),
    seedIndex:index+1,
    fields:Object.fromEntries((config.columns||[]).map((c,i)=>[c,row[i]||""]))
  }));
}

function localOptions(module:ModuleKey):EntityOption[]{
  return listLocalRecords(module).map(record=>({
    id:record.id,
    module,
    label:record.row[0]||Object.values(record.fields)[0]||record.id,
    sub:[record.row[1],record.row[2]].filter(Boolean).join(" · "),
    record,
    fields:record.fields
  }));
}

export function entityOptions(module:ModuleKey):EntityOption[]{
  const locals=localOptions(module);
  const localSeedRefs=new Set(locals.map(x=>String(x.record?.meta?.sourceSeed||"")));
  const seeds=seedOptions(module).filter(x=>!localSeedRefs.has(`${module}:${x.seedIndex}`));
  return [...locals,...seeds];
}

export function findEntity(module:ModuleKey,idOrLabel?:string):EntityOption|undefined{
  if(!idOrLabel) return;
  const normalized=decodeURIComponent(idOrLabel).trim().toLowerCase();
  return entityOptions(module).find(x=>
    x.id===idOrLabel ||
    x.label.toLowerCase()===normalized ||
    Object.values(x.fields).some(v=>String(v).toLowerCase()===normalized)
  );
}

export async function loadEntityOptions(module:ModuleKey):Promise<EntityOption[]>{
  if(!isProductionMode()) return entityOptions(module);
  const records=await listAppRecords(module);
  return records.map(record=>({id:record.id,module,label:record.row[0]||Object.values(record.fields)[0]||record.id,sub:[record.row[1],record.row[2]].filter(Boolean).join(" · "),record,fields:record.fields}));
}

export async function loadEntity(module:ModuleKey,idOrLabel?:string):Promise<EntityOption|undefined>{
  if(!idOrLabel)return;
  const normalized=decodeURIComponent(idOrLabel).trim().toLowerCase();
  const options=await loadEntityOptions(module);
  return options.find(x=>x.id===idOrLabel||x.label.toLowerCase()===normalized||Object.values(x.fields).some(v=>String(v).toLowerCase()===normalized));
}

export function customerDefaults(option?:EntityOption){
  if(!option) return {};
  const f=option.fields;
  return {
    customerId:option.id,
    customerName:option.label,
    contact:f["Kontakt"]||f["Kontaktperson"]||"",
    email:f["E-Mail"]||"",
    address:f["Strasse und Nr."]||f["Adresse"]||"",
    zipCity:f["PLZ / Ort"]||"",
    uid:f["UID"]||"",
    paymentDays:f["Zahlungsfrist"]||String(domainConfig.defaultPaymentDays),
    language:f["Sprache"]||"Deutsch",
    discount:f["Rabatt %"]||"0"
  };
}

export function supplierDefaults(option?:EntityOption){
  if(!option) return {};
  const f=option.fields;
  return {
    supplierId:option.id,
    supplierName:option.label,
    contact:f["Kontakt"]||f["Kontaktperson"]||"",
    email:f["E-Mail"]||"",
    address:f["Adresse"]||"",
    iban:f["IBAN"]||"",
    paymentDays:f["Zahlungsfrist"]||String(domainConfig.defaultPaymentDays)
  };
}

export function productDefaults(option?:EntityOption){
  if(!option) return {};
  const f=option.fields;
  return {
    productId:option.id,
    description:option.label,
    unit:f["Einheit"]||"Stunde",
    unitPrice:parseMoney(f["Preis CHF"]||f["Preis"]||option.record?.row[3]||"0"),
    vatRate:Number(String(f["MWST %"]||domainConfig.defaultVatRate).replace(",", "."))||domainConfig.defaultVatRate
  };
}

export function relationId(record:LocalRecord|undefined,key:string){
  const relations=(record?.meta?.relations as Record<string,string>|undefined)||{};
  return relations[key]||"";
}

export function recordsRelatedTo(key:string,id:string,module?:ModuleKey){
  return listLocalRecords(module).filter(r=>{
    const relations=(r.meta?.relations as Record<string,string>|undefined)||{};
    return relations[key]===id;
  });
}

export function billableProjectEntries(projectId:string){
  const times=recordsRelatedTo("projectId",projectId,"zeiterfassung").filter(r=>
    (r.fields["Verrechenbar"]||"Ja")==="Ja" && !Boolean(r.meta?.invoicedBy)
  );
  const expenses=recordsRelatedTo("projectId",projectId,"spesen").filter(r=>
    (r.fields["Weiterverrechenbar"]||"Nein")==="Ja" && !Boolean(r.meta?.invoicedBy)
  );
  return {times,expenses};
}
