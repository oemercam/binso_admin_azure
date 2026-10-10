import "server-only";
import {randomUUID} from "node:crypto";
import {withTenant} from "@/lib/server/db";
import {audit} from "@/lib/server/audit";
import {ApiError} from "@/lib/server/http";
import {listApiBusiness} from "./business-api";
import type {SessionUser} from "@/lib/server/session";

export type CustomerInput={name:string;contact?:string;email?:string;phone?:string;address?:string;zipCity?:string;postalCode?:string;city?:string;sector?:string;uid?:string;language?:string;paymentDays?:number;discount?:number;status?:string;notes?:string};
const columns=`id,name,coalesce((select cc.name from customer_contacts cc where cc.organization_id=customers.organization_id and cc.customer_id=customers.id and cc.is_primary=true and cc.archived_at is null limit 1),contact_name) as contact,email,phone,address,address as street,zip as postal_code,city,sector,trim(concat_ws(' ',zip,city)) as "zipCity",uid,language,payment_days as "paymentDays",discount,status,notes,created_at as "createdAt",updated_at as "updatedAt"`;
export function customerInput(body:Record<string,unknown>,partial=false):Partial<CustomerInput>{
 const out:Partial<CustomerInput>={};
 for(const key of ['name','contact','email','phone','address','zipCity','postalCode','city','sector','uid','language','status','notes'] as const){
  if(body[key]===undefined)continue;
  if(typeof body[key]!=="string"||body[key].length>320)throw new ApiError(400,'invalid_field','Ungültiges Kundenfeld: '+key);
  out[key]=body[key].trim();
 }
 if((!partial||out.name!==undefined)&&(!out.name||out.name.length<2))throw new ApiError(400,'name_required','Bitte einen Kundennamen eingeben.');
 if(out.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email))throw new ApiError(400,'invalid_email','Ungültige E-Mail-Adresse.');
 if(out.status&&!['active','inactive','Aktiv','Inaktiv'].includes(out.status))throw new ApiError(400,'invalid_status','Ungültiger Kundenstatus.');
 for(const [key,max] of [['paymentDays',180],['discount',100]] as const){
  if(body[key]===undefined)continue;const value=Number(body[key]);
  if(!Number.isFinite(value)||value<0||value>max||(key==='paymentDays'&&!Number.isInteger(value)))throw new ApiError(400,'invalid_field','Ungültiges Kundenfeld: '+key);
  out[key]=value;
 }
 return out;
}
function addressParts(input:Partial<CustomerInput>,current:Record<string,unknown>={}){
 let zip=input.postalCode??current.zip??null,city=input.city??current.city??null;
 if(input.zipCity!==undefined){const match=input.zipCity.trim().match(/^(\d{4,5})\s+(.*)$/);zip=match?.[1]??null;city=match?.[2]??input.zipCity;}
 return {zip,city};
}
const statusToDb=(value:string)=>/inaktiv|inactive/i.test(value)?'inactive':'active';
export async function listCustomers(session:SessionUser,filters="order=name.asc"){return withTenant(session.organizationId,session.userId,client=>listApiBusiness(client,session,'customers',filters))}
export async function createCustomer(organizationId:string,userId:string,input:CustomerInput){return withTenant(organizationId,userId,async client=>{
 const id=randomUUID(),{zip,city}=addressParts(input);
 const sequence=await client.query(`insert into business_document_counters(organization_id,kind,period,next_value) values($1,'customer','',2) on conflict(organization_id,kind,period) do update set next_value=business_document_counters.next_value+1 returning next_value-1 number`,[organizationId]);
 const customerNo='K-'+String(sequence.rows[0].number).padStart(6,'0');
 const result=await client.query(`insert into customers(id,organization_id,external_id,customer_no,name,legal_name,contact_name,email,phone,address,zip,city,sector,country,uid,language,payment_days,discount,status,created_by_user_id,notes) values($1,$2,$1::uuid::text,$3,$4,$4,$5,$6,$7,$8,$9,$10,$11,'Schweiz',$12,$13,$14,$15,$16,$17,$18) returning ${columns}`,[id,organizationId,customerNo,input.name,input.contact||null,input.email||null,input.phone||null,input.address||null,zip,city,input.sector||null,input.uid||null,input.language||'de',input.paymentDays??30,input.discount??0,statusToDb(input.status??'active'),userId,input.notes||null]);
 await audit(client,{organizationId,userId,action:'customer.created',entityType:'customer',entityId:id});return result.rows[0];
})}
export async function updateCustomer(organizationId:string,userId:string,id:string,input:Partial<CustomerInput>){return withTenant(organizationId,userId,async client=>{
 const current=(await client.query('select * from customers where id=$1 and organization_id=$2 and archived_at is null for update',[id,organizationId])).rows[0];if(!current)return null;
 const {zip,city}=addressParts(input,current);
 const result=await client.query(`update customers set name=$1,legal_name=$1,contact_name=$2,email=$3,phone=$4,address=$5,zip=$6,city=$7,sector=$8,uid=$9,language=$10,payment_days=$11,discount=$12,status=$13,notes=$16,updated_at=now() where id=$14 and organization_id=$15 returning ${columns}`,[input.name??current.name,input.contact??current.contact_name,input.email??current.email,input.phone??current.phone,input.address??current.address,zip,city,input.sector??current.sector,input.uid??current.uid,input.language??current.language,input.paymentDays??current.payment_days,input.discount??current.discount,input.status?statusToDb(input.status):current.status,id,organizationId,input.notes??current.notes]);
 await audit(client,{organizationId,userId,action:'customer.updated',entityType:'customer',entityId:id});return result.rows[0];
})}
export async function deleteCustomer(organizationId:string,userId:string,id:string){return withTenant(organizationId,userId,async client=>{const used=(await client.query('select id from customers c where c.organization_id=$1 and c.id=$2 and (exists(select 1 from invoices i where i.organization_id=c.organization_id and i.customer_id=c.id) or exists(select 1 from quotes q where q.organization_id=c.organization_id and q.customer_id=c.id) or exists(select 1 from projects p where p.organization_id=c.organization_id and p.customer_id=c.id) or exists(select 1 from time_entries t where t.organization_id=c.organization_id and t.customer_id=c.id)) for update',[organizationId,id])).rowCount;const result=await client.query(used?"update customers set status='inactive',updated_at=now() where id=$1 and organization_id=$2 and archived_at is null returning id":'update customers set archived_at=now(),updated_at=now() where id=$1 and organization_id=$2 and archived_at is null returning id',[id,organizationId]);if(result.rowCount)await audit(client,{organizationId,userId,action:used?'customer.deactivated':'customer.archived',entityType:'customer',entityId:id});return Boolean(result.rowCount)})}
