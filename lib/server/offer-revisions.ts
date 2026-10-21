import 'server-only';
import type {PoolClient} from 'pg';
import type {SessionUser} from './session';
import {ApiError} from './http';
import {authorize} from './rbac';
import {requireModuleEntitlement} from './plan-access';
import {idempotentBusiness} from './business-idempotency';
import {audit} from './audit';
import {listApiBusiness} from './repositories/business-api';
import {sealOfferVersion} from './offer-versions';
import {businessDate} from '@/lib/financial-status';
import {addDays,domainConfig} from '@/config/domain';
export async function createOfferRevision(c:PoolClient,s:SessionUser,number:string,key:string){
 authorize(s,'sales:write');await requireModuleEntitlement(s.organizationId,'offerten');
 return idempotentBusiness(c,{organizationId:s.organizationId,userId:s.userId,operation:'offer.revision',key,body:{number}},async()=>{
  const source=(await c.query('select * from quotes where organization_id=$1 and quote_no=$2 and archived_at is null for update',[s.organizationId,number])).rows[0];
  if(!source)throw new ApiError(404,'not_found','Dokument wurde nicht gefunden.');
  if(source.status==='draft')throw new ApiError(409,'revision_exists','Dieses Angebot wird bereits als Entwurf überarbeitet.');
  if(!['sent','declined','expired'].includes(source.status))throw new ApiError(409,'revision_invalid','Nur versendete, abgelaufene oder abgelehnte Angebote können überarbeitet werden.');
  if((await c.query("select id from document_deliveries where organization_id=$1 and document_id=$2 and status='sending'",[s.organizationId,source.id])).rowCount)throw new ApiError(409,'delivery_pending','Der Versand wird noch geprüft.');
  if((await c.query("select id from quotes where organization_id=$1 and revises_quote_id=$2 and status='draft' and archived_at is null",[s.organizationId,source.id])).rowCount)throw new ApiError(409,'revision_exists','Zu diesem Angebot besteht bereits ein überarbeiteter Entwurf.');
  const historical=await sealOfferVersion(c,s,source);
  const today=businessDate();
  await c.query("update offer_public_links set revoked_at=now() where organization_id=$1 and version_id=$2 and revoked_at is null",[s.organizationId,historical.id]);
  await c.query("update quotes set status='draft',offer_version=offer_version+1,issue_date=$3,valid_until=$4,decision_at=null,decision_by_user_id=null,decision_note=null,updated_at=now() where organization_id=$1 and id=$2",[s.organizationId,source.id,today,addDays(new Date(today+'T12:00:00Z'),domainConfig.defaultOfferValidityDays).toISOString().slice(0,10)]);
  await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'offer.revision.created',entityType:'quote',entityId:source.id,metadata:{number,previousVersion:source.offer_version,version:source.offer_version+1,archivedVersionId:historical.id}});
  return (await listApiBusiness(c,s,'documents','kind=eq.offer&id=eq.'+source.id))[0];
 });
}
