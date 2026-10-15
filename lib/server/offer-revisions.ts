import 'server-only';
import type {PoolClient} from 'pg';
import type {SessionUser} from './session';
import {ApiError} from './http';
import {authorize} from './rbac';
import {requireModuleEntitlement} from './plan-access';
import {idempotentBusiness} from './business-idempotency';
import {audit} from './audit';
import {listApiBusiness,mutateApiBusiness} from './repositories/business-api';
import {businessDate} from '@/lib/financial-status';
import {addDays,domainConfig} from '@/config/domain';
export async function createOfferRevision(c:PoolClient,s:SessionUser,number:string,key:string){
 authorize(s,'sales:write');await requireModuleEntitlement(s.organizationId,'offerten');
 return idempotentBusiness(c,{organizationId:s.organizationId,userId:s.userId,operation:'offer.revision',key,body:{number}},async()=>{
  const source=(await c.query('select * from quotes where organization_id=$1 and quote_no=$2 and archived_at is null for update',[s.organizationId,number])).rows[0];
  if(!source)throw new ApiError(404,'not_found','Dokument wurde nicht gefunden.');
  if(!['sent','declined','expired'].includes(source.status))throw new ApiError(409,'revision_invalid','Nur versendete, abgelaufene oder abgelehnte Angebote können überarbeitet werden.');
  if((await c.query("select id from document_deliveries where organization_id=$1 and document_id=$2 and status='sending'",[s.organizationId,source.id])).rowCount)throw new ApiError(409,'delivery_pending','Der Versand wird noch geprüft.');
  if((await c.query("select id from quotes where organization_id=$1 and revises_quote_id=$2 and status='draft' and archived_at is null",[s.organizationId,source.id])).rowCount)throw new ApiError(409,'revision_exists','Zu diesem Angebot besteht bereits ein überarbeiteter Entwurf.');
  const items=(await c.query('select description,quantity,unit,unit_price,vat_rate from quote_lines where organization_id=$1 and quote_id=$2 order by sort_order,id',[s.organizationId,source.id])).rows;
  const today=businessDate();
  const item=await mutateApiBusiness(c,s,'create_document_atomic',{p_kind:'offer',p_customer_id:source.customer_id,p_number:'',p_issue_date:today,p_valid_until:addDays(new Date(today+'T12:00:00Z'),domainConfig.defaultOfferValidityDays).toISOString().slice(0,10),p_currency:source.currency,p_vat_rate:Math.max(0,...items.map(item=>Number(item.vat_rate))),p_note:source.document_snapshot?.intro??source.note,p_items:items,p_idempotency_key:key} ) as {id:string;number:string};
  await c.query('update quotes set revises_quote_id=$3,title=$4,document_snapshot=jsonb_set(document_snapshot,\'{closing}\',to_jsonb($5::text)) where organization_id=$1 and id=$2',[s.organizationId,item.id,source.id,source.title,String(source.document_snapshot?.closing??'')]);
  await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'offer.revision.created',entityType:'quote',entityId:item.id,metadata:{previousId:source.id,previousNumber:number}});
  return (await listApiBusiness(c,s,'documents','kind=eq.offer&id=eq.'+item.id))[0];
 });
}
