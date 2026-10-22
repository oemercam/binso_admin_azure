import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {authorize} from '@/lib/server/rbac';
import {requireModuleEntitlement} from '@/lib/server/plan-access';
import {withTenant} from '@/lib/server/db';
import {requireFreshAuthentication} from '@/lib/server/fresh-authentication';
import {ApiError,apiError,assertSameOrigin,json,readJson} from '@/lib/server/http';
import {normalizeIban,validSwissIban} from '@/lib/qr-bill';
import {idempotentBusiness} from '@/lib/server/business-idempotency';
import {audit} from '@/lib/server/audit';

export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const s=await requireSession();authorize(s,'purchasing:read');authorize(s,'bank:read');
  await requireModuleEntitlement(s.organizationId,'lieferanten');const {id}=await params;
  const item=await withTenant(s.organizationId,s.userId,async c=>(await c.query('select id,iban,updated_at::text revision from suppliers where organization_id=$1 and id::text=$2 and archived_at is null',[s.organizationId,id])).rows[0]);
  if(!item)throw new ApiError(404,'not_found','Lieferant wurde nicht gefunden.');return json({item});
 }catch(error){return apiError(error);}
}
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 try{
  assertSameOrigin(request);const s=await requireSession();authorize(s,'purchasing:write');authorize(s,'bank:write');
  await requireModuleEntitlement(s.organizationId,'lieferanten');const {id}=await params;
  const body=await readJson<Record<string,unknown>>(request,2048);
  if(Object.keys(body).some(key=>!['iban','expectedRevision'].includes(key))||typeof body.iban!=='string'||body.iban.length>50||typeof body.expectedRevision!=='string'||body.expectedRevision.length>100)throw new ApiError(400,'supplier_bank_invalid','Bitte die Bankverbindung und den aktuellen Stand prüfen.');
  const iban=normalizeIban(body.iban);
  if(iban&&!validSwissIban(iban))throw new ApiError(400,'supplier_iban_invalid','Bitte eine gültige Schweizer oder Liechtensteiner IBAN eingeben.');
  const result=await withTenant(s.organizationId,s.userId,async c=>{
   await requireFreshAuthentication(s,c);
   return idempotentBusiness(c,{organizationId:s.organizationId,userId:s.userId,operation:'supplier.bank.update',key:request.headers.get('idempotency-key')??'',body:{id,...body,iban}},async()=>{
    const current=(await c.query('select id,iban,updated_at::text revision from suppliers where organization_id=$1 and id::text=$2 and archived_at is null for update',[s.organizationId,id])).rows[0];
    if(!current)throw new ApiError(404,'not_found','Lieferant wurde nicht gefunden.');
    if(current.revision!==body.expectedRevision)throw new ApiError(409,'supplier_changed','Der Lieferant wurde geändert. Bitte die Ansicht aktualisieren.');
    const item=(await c.query('update suppliers set iban=$3,updated_at=clock_timestamp() where organization_id=$1 and id=$2 returning id,updated_at::text revision',[s.organizationId,current.id,iban||null])).rows[0];
    await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'supplier.bank_changed',entityType:'supplier',entityId:current.id,metadata:{cleared:!iban}});
    return {item};
   });
  });return json(result);
 }catch(error){return apiError(error);}
}
