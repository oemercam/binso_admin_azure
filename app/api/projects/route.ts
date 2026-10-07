import {NextRequest} from 'next/server';
import {tenantCan} from '@/lib/permissions';
import {randomUUID} from 'node:crypto';
import {requireSession} from '@/lib/server/session';
import {authorize} from '@/lib/server/rbac';
import {withTenant} from '@/lib/server/db';
import {audit} from '@/lib/server/audit';
import {ApiError,apiError,assertSameOrigin,cleanText,json,readJson} from '@/lib/server/http';
export async function GET(){try{const s=await requireSession();authorize(s,'projects:read');return json({items:await withTenant(s.organizationId,s.userId,async c=>(await c.query(`select p.id,p.name,p.customer_id,p.status,p.source_quote_id,c.name customer_name,q.quote_no source_offer,
 coalesce((select sum(t.hours) from time_entries t where t.organization_id=p.organization_id and t.project_id=p.id and t.archived_at is null),0) hours,
 coalesce((select sum(t.hours) from time_entries t where t.organization_id=p.organization_id and t.project_id=p.id and t.archived_at is null and t.invoiced_invoice_id is not null),0) invoiced_hours
  ,${tenantCan(s.role,'invoices:read')?`coalesce((select json_agg(distinct i.invoice_no) from time_entries t join invoices i on i.id=t.invoiced_invoice_id and i.organization_id=t.organization_id where t.organization_id=p.organization_id and t.project_id=p.id and t.archived_at is null),'[]'::json)`:`'[]'::json`} invoice_numbers
 from projects p left join customers c on c.id=p.customer_id and c.organization_id=p.organization_id left join quotes q on q.id=p.source_quote_id and q.organization_id=p.organization_id where p.organization_id=$1 and p.archived_at is null order by p.name`,[s.organizationId])).rows)});}catch(e){return apiError(e)}}
export async function POST(request:NextRequest){try{assertSameOrigin(request);const s=await requireSession();authorize(s,'projects:write');const body=await readJson<Record<string,unknown>>(request,8192);const name=cleanText(body.name,200),customerId=cleanText(body.customerId,80),sourceOffer=cleanText(body.sourceOffer,80);if(name.length<2)throw new ApiError(400,'name_required','Bitte eine Projektbezeichnung eingeben.');
 const item=await withTenant(s.organizationId,s.userId,async c=>{let quoteId=null;
 if(sourceOffer){const q=(await c.query("select id,customer_id from quotes where organization_id=$1 and quote_no=$2 and status='accepted' and archived_at is null for update",[s.organizationId,sourceOffer])).rows[0];if(!q||q.customer_id!==customerId)throw new ApiError(409,'offer_invalid','Bitte ein angenommenes Angebot dieses Kunden auswählen.');quoteId=q.id;const previous=(await c.query('select id,name,customer_id,status from projects where organization_id=$1 and source_quote_id=$2 and archived_at is null',[s.organizationId,quoteId])).rows[0];if(previous)return previous;}
 if(customerId&&!(await c.query('select id from customers where organization_id=$1 and id=$2 and archived_at is null',[s.organizationId,customerId])).rowCount)throw new ApiError(400,'customer_invalid','Kunde wurde nicht gefunden.');
 const result=(await c.query("insert into projects(organization_id,external_id,name,customer_id,status,source_quote_id,created_by_user_id) values($1,$2,$3,$4,'active',$5,$6) returning id,name,customer_id,status",[s.organizationId,randomUUID(),name,customerId||null,quoteId,s.userId])).rows[0];await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'project.created',entityType:'project',entityId:result.id});return result;});return json({item},201);}catch(e){return apiError(e)}}
