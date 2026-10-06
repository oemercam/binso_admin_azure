import "server-only";
import {randomUUID} from "node:crypto";
import {withTenant} from "../db";
import {ApiError,cleanText,validEmail} from "../http";
import {audit} from "../audit";
import type {SessionUser} from "../session";

type ContactInput={firstName?:unknown;lastName?:unknown;email?:unknown;phone?:unknown;jobTitle?:unknown;isPrimary?:unknown};
const columns="id,customer_id,first_name,last_name,email,phone,role_label as job_title,is_primary,created_at,updated_at";
export async function saveCustomerContact(s:SessionUser,customerId:string,contactId:string|null,input:ContactInput){
 const first=cleanText(input.firstName,120),last=cleanText(input.lastName,120),email=cleanText(input.email,320);
 if(!first||!last)throw new ApiError(400,"name_required","Vorname und Nachname sind erforderlich.");
 if(email&&!validEmail(email))throw new ApiError(400,"email_invalid","Bitte eine gültige E-Mail-Adresse eingeben.");
 return withTenant(s.organizationId,s.userId,async c=>{
  const customer=await c.query("select id from customers where organization_id=$1 and id::text=$2 and archived_at is null for update",[s.organizationId,customerId]);
  if(!customer.rowCount)throw new ApiError(404,"not_found","Kunde wurde nicht gefunden.");
  const current=contactId?(await c.query("select id from customer_contacts where organization_id=$1 and customer_id::text=$2 and id::text=$3 and archived_at is null",[s.organizationId,customerId,contactId])).rows[0]:null;
  if(contactId&&!current)throw new ApiError(404,"not_found","Kontakt wurde nicht gefunden.");
  const primary=input.isPrimary===true;
  if(primary)await c.query("update customer_contacts set is_primary=false,updated_at=now() where organization_id=$1 and customer_id::text=$2 and archived_at is null and is_primary=true",[s.organizationId,customerId]);
  const values=[s.organizationId,customerId,first,last,email||null,cleanText(input.phone,80)||null,cleanText(input.jobTitle,160)||null,primary];
  const result=contactId?await c.query(`update customer_contacts set first_name=$3,last_name=$4,name=concat_ws(' ',$3::text,$4::text),email=$5,phone=$6,role_label=$7,is_primary=$8,updated_at=now() where organization_id=$1 and customer_id::text=$2 and id::text=$9 returning ${columns}`,[...values,contactId]):await c.query(`insert into customer_contacts(organization_id,customer_id,first_name,last_name,name,email,phone,role_label,is_primary,external_id) values($1,$2::uuid,$3,$4,concat_ws(' ',$3::text,$4::text),$5,$6,$7,$8,$9) returning ${columns}`,[...values,randomUUID()]);
  await audit(c,{organizationId:s.organizationId,userId:s.userId,action:contactId?"contact.updated":"contact.created",entityType:"customer_contact",entityId:result.rows[0].id});
  return result.rows[0];
 });
}
export async function archiveCustomerContact(s:SessionUser,customerId:string,contactId:string){
 return withTenant(s.organizationId,s.userId,async c=>{
  await c.query("select id from customers where organization_id=$1 and id::text=$2 and archived_at is null for update",[s.organizationId,customerId]);
  const result=await c.query("update customer_contacts set archived_at=now(),is_primary=false,updated_at=now() where organization_id=$1 and customer_id::text=$2 and id::text=$3 and archived_at is null returning id",[s.organizationId,customerId,contactId]);
  if(!result.rowCount)throw new ApiError(404,"not_found","Kontakt wurde nicht gefunden.");
  await audit(c,{organizationId:s.organizationId,userId:s.userId,action:"contact.archived",entityType:"customer_contact",entityId:contactId});
  return result.rows[0];
 });
}
