import 'server-only';
import type {PoolClient} from 'pg';
import type {SessionUser} from '../session';
import {ApiError} from '../http';
import {customerInput,customerDuplicates,createCustomer,type CustomerInput} from './customers';
import {contactInput,saveCustomerContact} from './contacts';
import {idempotentBusiness} from '../business-idempotency';
import {customerImportFields,contactImportFields,importLimits} from '@/lib/import-table';
import {audit} from '../audit';
export type ImportTarget='customers'|'contacts';
export async function inspectCustomerImport(c:PoolClient,s:SessionUser,target:ImportTarget,rows:Record<string,unknown>[],customerId:string){
 if(!rows.length||rows.length>importLimits.rows)throw new ApiError(400,'import_limit','Bitte höchstens 500 Datenzeilen importieren.');
 if(target==='contacts'&&!(await c.query('select id from customers where organization_id=$1 and id::text=$2 and archived_at is null',[s.organizationId,customerId])).rowCount)throw new ApiError(404,'not_found','Kunde wurde nicht gefunden.');
 const seen=new Set<string>(),fields=target==='customers'?customerImportFields:contactImportFields;
 const output:Array<{row:number;input:Record<string,unknown>;issues:string[];duplicate:boolean}>=[];
 for(let index=0;index<rows.length;index++){
  let input:Record<string,unknown>={};const issues:string[]=[];let duplicate=false;
  try{
   const original=rows[index];if(!original||Array.isArray(original)||typeof original!=='object')throw new ApiError(400,'invalid_row','Ungültige Datenzeile.');
   for(const [key] of fields)if(original[key]!==undefined)input[key]=original[key];
   input=target==='customers'?customerInput(input):contactInput(input);
   const normalized=(value:unknown)=>String(value??'').trim().toLowerCase().replace(/\s+/g,' ');
   const keys=[target==='customers'?'name:'+normalized(input.name):'name:'+normalized(input.firstName)+' '+normalized(input.lastName),...(input.email?['email:'+normalized(input.email)]:[]),...(input.uid?['uid:'+normalized(input.uid).replace(/[^a-z0-9]/g,'').replace(/(mwst|tva|iva)$/,'')]:[])];
   duplicate=keys.some(key=>seen.has(key));keys.forEach(key=>seen.add(key));
   if(target==='customers')duplicate=duplicate||(await customerDuplicates(c,s.organizationId,input)).length>0;
   else duplicate=duplicate||(await c.query("select id from customer_contacts where organization_id=$1 and customer_id::text=$2 and archived_at is null and ((lower(trim(first_name))=$3 and lower(trim(last_name))=$4) or ($5<>'' and lower(trim(email))=$5)) limit 1",[s.organizationId,customerId,normalized(input.firstName),normalized(input.lastName),normalized(input.email)])).rowCount!>0;
   if(duplicate)issues.push('Mögliche Dublette. Diese Zeile wird nicht importiert.');
  }catch(error){issues.push(error instanceof ApiError?error.message:'Ungültige Datenzeile.');}
  const sourceRow=Number.isInteger(rows[index]?._sourceRow)&&Number(rows[index]._sourceRow)>=2&&Number(rows[index]._sourceRow)<=importLimits.bytes?Number(rows[index]._sourceRow):index+2;
  output.push({row:sourceRow,input:{...input,_sourceRow:sourceRow},issues,duplicate});
 }
 return output;
}
/** One transaction, no updates/merge of existing records. Recheck under the same creation lock. */
export async function commitCustomerImport(c:PoolClient,s:SessionUser,target:ImportTarget,rows:Record<string,unknown>[],customerId:string,key:string){
 return idempotentBusiness(c,{organizationId:s.organizationId,userId:s.userId,operation:'customer.import',key,body:{target,rows,customerId}},async()=>{
  await c.query('select pg_advisory_xact_lock(hashtextextended($1,0))',[s.organizationId+':customer-create']);
  const review=await inspectCustomerImport(c,s,target,rows,customerId);
  if(review.some(row=>row.issues.length))throw new ApiError(409,'import_changed','Die Daten sind ungültig oder bereits vorhanden. Bitte die Vorschau erneut prüfen.');
  const created=[];
  for(const row of review){const item=target==='customers'?await createCustomer(s.organizationId,s.userId,customerInput(row.input) as CustomerInput,'',c):await saveCustomerContact(s,customerId,null,contactInput(row.input),c);created.push({row:row.row,id:item.id});}
  await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'customer.import',entityType:target,metadata:{count:created.length}});
  return {created,count:created.length};
 });
}
