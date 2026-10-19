import "server-only";
import type {PoolClient} from "pg";
import {randomUUID} from "node:crypto";
import {withTenant} from "@/lib/server/db";
import {audit} from "@/lib/server/audit";
import {ApiError} from "@/lib/server/http";
import {idempotentBusiness} from "../business-idempotency";
import {listApiBusiness} from "./business-api";
import type {SessionUser} from "@/lib/server/session";

export type CustomerInput={name:string;contact?:string;contactFirstName?:string;contactLastName?:string;email?:string;phone?:string;address?:string;street?:string;buildingNumber?:string;zipCity?:string;postalCode?:string;city?:string;sector?:string;uid?:string;language?:string;paymentDays?:number;discount?:number;status?:string;notes?:string;allowDuplicate?:boolean};
const columns=`id,customer_no,name,coalesce((select cc.name from customer_contacts cc where cc.organization_id=customers.organization_id and cc.customer_id=customers.id and cc.is_primary=true and cc.archived_at is null limit 1),contact_name) as contact,email,phone,address,coalesce(street,address) as street,building_number,zip as postal_code,city,sector,trim(concat_ws(' ',zip,city)) as "zipCity",uid,language,payment_days as "paymentDays",discount,status,notes,created_at as "createdAt",updated_at as "updatedAt"`;
export function customerInput(body:Record<string,unknown>,partial=false):Partial<CustomerInput>{
 const out:Partial<CustomerInput>={};
 if(body.allowDuplicate!==undefined){if(typeof body.allowDuplicate!=="boolean")throw new ApiError(400,"invalid_field","Ungültiges Kundenfeld: allowDuplicate");out.allowDuplicate=body.allowDuplicate;}
 for(const key of ['name','contact','contactFirstName','contactLastName','email','phone','address','street','buildingNumber','zipCity','postalCode','city','sector','uid','language','status','notes'] as const){
  if(body[key]===undefined)continue;
  if(typeof body[key]!=="string"||body[key].length>320)throw new ApiError(400,'invalid_field','Ungültiges Kundenfeld: '+key);
  out[key]=body[key].trim();
 }
 if((!partial||out.name!==undefined)&&(!out.name||out.name.length<2))throw new ApiError(400,'name_required','Bitte einen Kundennamen eingeben.');
 if(!partial){if(!out.contactFirstName||!out.contactLastName)throw new ApiError(400,'contact_required','Bitte Vorname und Nachname der Kontaktperson eingeben.');out.contact=out.contactFirstName+' '+out.contactLastName;}
 if([out.contactFirstName,out.contactLastName].some(value=>value&&value.length>120))throw new ApiError(400,'invalid_field','Kontaktname ist zu lang.');
 if(partial&&out.contact!==undefined&&!out.contact)throw new ApiError(400,'contact_required','Bitte eine Kontaktperson eingeben.');
 if(out.buildingNumber&&out.buildingNumber.length>40)throw new ApiError(400,'invalid_field','Hausnummer ist zu lang.');
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
/** Exact identifiers only; candidate review never exposes another tenant. */
export async function customerDuplicates(client:PoolClient,organizationId:string,input:Partial<CustomerInput>,excludeId=''){
 const uid=(input.uid??'').toUpperCase().replace(/[^A-Z0-9]/g,'').replace(/(MWST|TVA|IVA)$/,''),email=(input.email??'').trim().toLowerCase(),name=(input.name??'').trim().replace(/\s+/g,' ').toLowerCase();
 if(!uid&&!email&&name.length<2)return [];
 return (await client.query(`select id,customer_no,name,email from customers c where organization_id=$1 and archived_at is null and id::text<>$5 and (
  ($2<>'' and regexp_replace(regexp_replace(upper(coalesce(c.uid,'')),'[^A-Z0-9]','','g'),'(MWST|TVA|IVA)$','')=$2)
  or ($3<>'' and lower(trim(coalesce(c.email,'')))=$3)
  or (length($4)>=2 and regexp_replace(lower(trim(c.name)),'[[:space:]]+',' ','g')=$4)) order by customer_no,id limit 5`,[organizationId,uid,email,name,excludeId])).rows;
}
export async function findCustomerDuplicates(session:SessionUser,input:Partial<CustomerInput>,excludeId=''){return withTenant(session.organizationId,session.userId,c=>customerDuplicates(c,session.organizationId,input,excludeId))}
export async function createCustomer(organizationId:string,userId:string,input:CustomerInput,requestKey=""){input=customerInput(input as unknown as Record<string,unknown>) as CustomerInput;return withTenant(organizationId,userId,async client=>{const write=async()=>{
 await client.query('select pg_advisory_xact_lock(hashtextextended($1,0))',[organizationId+':customer-create']);
 if(!input.allowDuplicate&&(await customerDuplicates(client,organizationId,input)).length)throw new ApiError(409,'customer_duplicate','Mögliche Dublette gefunden. Bitte bestehende Kunden prüfen oder die separate Erfassung bestätigen.');
 const id=randomUUID(),{zip,city}=addressParts(input);
 const sequence=await client.query(`insert into business_document_counters(organization_id,kind,period,next_value) values($1,'customer','',2) on conflict(organization_id,kind,period) do update set next_value=business_document_counters.next_value+1 returning next_value-1 number`,[organizationId]);
 const customerNo='K-'+String(sequence.rows[0].number).padStart(6,'0');
 await client.query(`insert into customers(id,organization_id,external_id,customer_no,name,legal_name,contact_name,email,phone,address,zip,city,sector,country,uid,language,payment_days,discount,status,created_by_user_id,notes) values($1,$2,$1::uuid::text,$3,$4,$4,$5,$6,$7,$8,$9,$10,$11,'Schweiz',$12,$13,$14,$15,$16,$17,$18) returning ${columns}`,[id,organizationId,customerNo,input.name,input.contact||null,input.email||null,input.phone||null,input.address||null,zip,city,input.sector||null,input.uid||null,input.language||'de',input.paymentDays??30,input.discount??0,statusToDb(input.status??'active'),userId,input.notes||null]);
 await client.query('update customers set street=$3,building_number=$4,address=coalesce(nullif(concat_ws(\' \',nullif($3,\'\'),nullif($4,\'\')),\'\'),address) where organization_id=$1 and id=$2',[organizationId,id,input.street??null,input.buildingNumber??null]);
 await client.query(`insert into customer_contacts(organization_id,customer_id,first_name,last_name,name,email,phone,is_primary,external_id) values($1,$2::uuid,$3,$4,$5,$6,$7,true,$8)`,[organizationId,id,input.contactFirstName,input.contactLastName,input.contact,input.email||null,input.phone||null,randomUUID()]);
 await audit(client,{organizationId,userId,action:'customer.created',entityType:'customer',entityId:id});return (await client.query(`select ${columns} from customers where organization_id=$1 and id=$2`,[organizationId,id])).rows[0];
};return requestKey?idempotentBusiness(client,{organizationId,userId,operation:'customer.create',key:requestKey,body:input},write):write();
})}
export async function updateCustomer(organizationId:string,userId:string,id:string,input:Partial<CustomerInput>){return withTenant(organizationId,userId,async client=>{
 const current=(await client.query('select * from customers where id=$1 and organization_id=$2 and archived_at is null for update',[id,organizationId])).rows[0];if(!current)return null;
 const {zip,city}=addressParts(input,current);
 await client.query(`update customers set name=$1,legal_name=$1,contact_name=$2,email=$3,phone=$4,address=$5,zip=$6,city=$7,sector=$8,uid=$9,language=$10,payment_days=$11,discount=$12,status=$13,notes=$16,updated_at=now() where id=$14 and organization_id=$15 returning ${columns}`,[input.name??current.name,input.contact??current.contact_name,input.email??current.email,input.phone??current.phone,input.address??current.address,zip,city,input.sector??current.sector,input.uid??current.uid,input.language??current.language,input.paymentDays??current.payment_days,input.discount??current.discount,input.status?statusToDb(input.status):current.status,id,organizationId,input.notes??current.notes]);
 if(input.street!==undefined||input.buildingNumber!==undefined)await client.query("update customers set street=$3,building_number=$4,address=concat_ws(' ',nullif($3,''),nullif($4,'')) where organization_id=$1 and id=$2",[organizationId,id,input.street??current.street??current.address,input.buildingNumber??current.building_number??null]);
 await audit(client,{organizationId,userId,action:'customer.updated',entityType:'customer',entityId:id});return (await client.query(`select ${columns} from customers where organization_id=$1 and id=$2`,[organizationId,id])).rows[0];
})}
export async function deleteCustomer(organizationId:string,userId:string,id:string){return withTenant(organizationId,userId,async client=>{const used=(await client.query('select id from customers c where c.organization_id=$1 and c.id=$2 and (exists(select 1 from invoices i where i.organization_id=c.organization_id and i.customer_id=c.id) or exists(select 1 from quotes q where q.organization_id=c.organization_id and q.customer_id=c.id) or exists(select 1 from projects p where p.organization_id=c.organization_id and p.customer_id=c.id) or exists(select 1 from time_entries t where t.organization_id=c.organization_id and t.customer_id=c.id)) for update',[organizationId,id])).rowCount;const result=await client.query(used?"update customers set status='inactive',updated_at=now() where id=$1 and organization_id=$2 and archived_at is null returning id":'update customers set archived_at=now(),updated_at=now() where id=$1 and organization_id=$2 and archived_at is null returning id',[id,organizationId]);if(result.rowCount)await audit(client,{organizationId,userId,action:used?'customer.deactivated':'customer.archived',entityType:'customer',entityId:id});return Boolean(result.rowCount)})}
