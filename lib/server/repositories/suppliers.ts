import 'server-only';
import type {PoolClient} from 'pg';
import type {SessionUser} from '../session';
import {ApiError} from '../http';
import {authorize} from '../rbac';
import {audit} from '../audit';
import {idempotentBusiness} from '../business-idempotency';
import {domainConfig} from '@/config/domain';

const columns='id,supplier_no,name,contact_name,email,phone,address,uid,payment_days,status,created_at,updated_at,updated_at::text revision';
type SupplierInput={name:string;contactName:string;email:string;phone:string;address:string;uid:string;paymentDays:number;status:'active'|'inactive';expectedRevision?:string};
export function supplierInput(body:Record<string,unknown>):SupplierInput{
 const allowed=new Set(['name','contactName','email','phone','address','uid','paymentDays','status','expectedRevision']);
 if(Object.keys(body).some(key=>!allowed.has(key)))throw new ApiError(400,'supplier_fields_invalid','Diese Lieferantenangaben können hier nicht geändert werden.');
 const text=(key:string,max:number)=>{const value=body[key]??'';if(typeof value!=='string'||value.length>max)throw new ApiError(400,'supplier_invalid','Die Lieferantenangaben sind ungültig.');return value.trim();};
 const name=text('name',200),email=text('email',320),payment=body.paymentDays??domainConfig.defaultPaymentDays;
 if(!name)throw new ApiError(400,'supplier_name_required','Bitte einen Lieferantennamen eingeben.');
 if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new ApiError(400,'invalid_email','Ungültige E-Mail-Adresse.');
 if(typeof payment!=='number'||!Number.isInteger(payment)||payment<0||payment>180)throw new ApiError(400,'supplier_payment_days_invalid','Bitte eine Zahlungsfrist zwischen 0 und 180 Tagen erfassen.');
 if(body.status!==undefined&&!['active','inactive'].includes(String(body.status)))throw new ApiError(400,'supplier_invalid','Die Lieferantenangaben sind ungültig.');
 return {name,email,contactName:text('contactName',200),phone:text('phone',80),address:text('address',500),uid:text('uid',80),paymentDays:payment,status:body.status==='inactive'?'inactive':'active',...(body.expectedRevision!==undefined?{expectedRevision:text('expectedRevision',100)}:{})};
}
export async function listSuppliers(c:PoolClient,s:SessionUser,params:URLSearchParams){
 authorize(s,'purchasing:read');
 const q=(params.get('q')??'').trim(),status=(params.get('status')??'').replace(/^eq\./,''),limit=Number(params.get('limit')??50),offset=Number(params.get('offset')??0);
 if(q.length>200||!['','active','inactive'].includes(status)||!Number.isInteger(limit)||limit<1||limit>100||!Number.isInteger(offset)||offset<0||offset>100000)throw new ApiError(400,'invalid_filter','Ungültiger Filter.');
 const values=[s.organizationId,q?'%'+q.replace(/[\\%_]/g,'\\$&')+'%':'',status],where="organization_id=$1 and archived_at is null and ($2='' or concat_ws(' ',name,supplier_no,contact_name,email,uid) ilike $2) and ($3='' or status=$3)";
 const total=Number((await c.query('select count(*)::int total from suppliers where '+where,values)).rows[0].total);
 const items=(await c.query(`select ${columns} from suppliers where ${where} order by name,id limit $4 offset $5`,[...values,limit,offset])).rows;
 return {items,total};
}
export async function getSupplier(c:PoolClient,s:SessionUser,id:string){
 authorize(s,'purchasing:read');const item=(await c.query(`select ${columns} from suppliers where organization_id=$1 and id::text=$2 and archived_at is null`,[s.organizationId,id])).rows[0];
 if(!item)throw new ApiError(404,'not_found','Lieferant wurde nicht gefunden.');return {item};
}
export async function writeSupplier(c:PoolClient,s:SessionUser,id:string|null,input:SupplierInput,key:string){
 authorize(s,'purchasing:write');
 return idempotentBusiness(c,{organizationId:s.organizationId,userId:s.userId,operation:id?'supplier.update':'supplier.create',key,body:{id,input}},async()=>{
  await c.query('select pg_advisory_xact_lock(hashtextextended($1,0))',[s.organizationId+':suppliers']);
  if(id){
   const current=(await c.query('select id,updated_at::text revision from suppliers where organization_id=$1 and id::text=$2 and archived_at is null for update',[s.organizationId,id])).rows[0];
   if(!current)throw new ApiError(404,'not_found','Lieferant wurde nicht gefunden.');
   if(!input.expectedRevision||current.revision!==input.expectedRevision)throw new ApiError(409,'supplier_changed','Der Lieferant wurde geändert. Bitte die Ansicht aktualisieren.');
  }
  const duplicate=(await c.query("select id from suppliers where organization_id=$1 and archived_at is null and ($2::text is null or id::text<>$2) and (lower(trim(name))=lower($3) or ($4<>'' and regexp_replace(upper(coalesce(uid,'')),'[^A-Z0-9]','','g')=$4)) limit 1",[s.organizationId,id,input.name,input.uid.toUpperCase().replace(/[^A-Z0-9]/g,'')])).rows[0];
  if(duplicate)throw new ApiError(409,'supplier_duplicate','Eine mögliche Lieferantendublette ist vorhanden. Bitte die Stammdaten zuerst prüfen.');
  const values=[input.name,input.contactName||null,input.email||null,input.phone||null,input.address||null,input.uid||null,input.paymentDays,input.status];
  let item;
  if(id)item=(await c.query(`update suppliers set name=$3,contact_name=$4,email=$5,phone=$6,address=$7,uid=$8,payment_days=$9,status=$10,updated_at=clock_timestamp() where organization_id=$1 and id::text=$2 returning ${columns}`,[s.organizationId,id,...values])).rows[0];
  else{
   // Honour legacy L-numbers as well as the central counter, including archived records.
   const sequence=(await c.query(`insert into business_document_counters(organization_id,kind,period,next_value)
    select $1,'supplier','',coalesce(max(substring(supplier_no from 3)::bigint),0)+2 from suppliers where organization_id=$1 and supplier_no ~ '^L-[0-9]{1,12}$'
    on conflict(organization_id,kind,period) do update set next_value=greatest(business_document_counters.next_value,excluded.next_value-1)+1 returning next_value-1 number`,[s.organizationId])).rows[0];
   const number='L-'+String(sequence.number).padStart(6,'0');
   item=(await c.query(`insert into suppliers(organization_id,external_id,supplier_no,name,contact_name,email,phone,address,uid,payment_days,status,created_by_user_id)
    values($1,gen_random_uuid()::text,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning ${columns}`,[s.organizationId,number,...values,s.userId])).rows[0];
  }
  await audit(c,{organizationId:s.organizationId,userId:s.userId,action:id?'supplier.updated':'supplier.created',entityType:'suppliers',entityId:item.id});
  return {item};
 });
}
