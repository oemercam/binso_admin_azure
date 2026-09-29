"use client";

import {apiFetch,isProductionMode} from "@/lib/client/runtime";
import {modules,type ModuleKey} from "@/lib/modules";
import {deleteLocalRecord,getLocalRecord,listLocalRecords,saveLocalRecord,updateLocalRecord,type LocalRecord} from "@/lib/local-store";

export type AppRecordInput={id?:string;module:ModuleKey;status:string;row:string[];fields:Record<string,string>;positions?:LocalRecord["positions"];meta?:Record<string,unknown>};
type ServerRecord={id:string;module:ModuleKey;status:string;row:string[];fields:Record<string,string>;positions?:LocalRecord["positions"];metadata?:Record<string,unknown>;createdAt?:string;updatedAt?:string};
const normalize=(x:ServerRecord):LocalRecord=>({id:x.id,module:x.module,status:x.status,row:x.row||[],fields:x.fields||{},positions:x.positions,meta:x.metadata||{},createdAt:x.createdAt||new Date().toISOString(),updatedAt:x.updatedAt||new Date().toISOString(),activities:[]});

export async function listAppRecords(module?:ModuleKey):Promise<LocalRecord[]>{
 if(!isProductionMode())return listLocalRecords(module);
 if(module){try{const r=await apiFetch<{items:ServerRecord[]}>(`/api/records?module=${encodeURIComponent(module)}`);return r.items.map(normalize)}catch{return []}}
 const results=await Promise.all(modules.map(async m=>{try{return await listAppRecords(m.key)}catch{return []}}));
 return results.flat();
}
export async function getAppRecord(id:string):Promise<LocalRecord|undefined>{if(!isProductionMode())return getLocalRecord(id);try{return normalize((await apiFetch<{item:ServerRecord}>(`/api/records/${encodeURIComponent(id)}`)).item)}catch{return undefined}}
export async function createAppRecord(input:AppRecordInput):Promise<LocalRecord>{if(!isProductionMode())return saveLocalRecord(input);const r=await apiFetch<{item:ServerRecord}>("/api/records",{method:"POST",body:JSON.stringify({...input,metadata:input.meta})});return normalize(r.item)}
export async function updateAppRecord(id:string,patch:Partial<Omit<AppRecordInput,"id"|"module">>):Promise<LocalRecord|undefined>{if(!isProductionMode())return updateLocalRecord(id,patch as Parameters<typeof updateLocalRecord>[1]);try{const r=await apiFetch<{item:ServerRecord}>(`/api/records/${encodeURIComponent(id)}`,{method:"PATCH",body:JSON.stringify({...patch,metadata:patch.meta})});return normalize(r.item)}catch{return undefined}}
export async function deleteAppRecord(id:string):Promise<boolean>{if(!isProductionMode()){deleteLocalRecord(id);return true}await apiFetch(`/api/records/${encodeURIComponent(id)}`,{method:"DELETE",body:"{}"});return true}
