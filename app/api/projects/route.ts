import {NextRequest} from 'next/server';
import {listProjects} from '@/lib/server/repositories/project-workspace';
import {randomUUID} from 'node:crypto';
import {requireSession} from '@/lib/server/session';
import {authorize} from '@/lib/server/rbac';
import {withTenant} from '@/lib/server/db';
import {audit} from '@/lib/server/audit';
import {idempotentBusiness} from '@/lib/server/business-idempotency';
import {ApiError,apiError,assertSameOrigin,cleanText,json,readJson} from '@/lib/server/http';
export async function GET(request:NextRequest){try{const s=await requireSession();authorize(s,'projects:read');return json(await withTenant(s.organizationId,s.userId,c=>listProjects(c,s,request.nextUrl.searchParams),{snapshot:true}));}catch(error){return apiError(error)}}
export async function POST(request:NextRequest){try{assertSameOrigin(request);const s=await requireSession();authorize(s,'projects:write');const body=await readJson<Record<string,unknown>>(request,8192);const name=cleanText(body.name,200),customerId=cleanText(body.customerId,80),sourceOffer=cleanText(body.sourceOffer,80);if(name.length<2)throw new ApiError(400,'name_required','Bitte eine Projektbezeichnung eingeben.');
 const requestKey=request.headers?.get('idempotency-key')?.trim()??'';
 const item=await withTenant(s.organizationId,s.userId,async c=>{const write=async()=>{let quoteId=null;
 if(sourceOffer){const q=(await c.query("select id,customer_id from quotes where organization_id=$1 and quote_no=$2 and status='accepted' and archived_at is null for update",[s.organizationId,sourceOffer])).rows[0];if(!q||q.customer_id!==customerId)throw new ApiError(409,'offer_invalid','Bitte ein angenommenes Angebot dieses Kunden auswählen.');quoteId=q.id;const previous=(await c.query('select id,name,customer_id,status from projects where organization_id=$1 and source_quote_id=$2 and archived_at is null',[s.organizationId,quoteId])).rows[0];if(previous)return previous;}
 if(customerId&&!(await c.query('select id from customers where organization_id=$1 and id=$2 and archived_at is null',[s.organizationId,customerId])).rowCount)throw new ApiError(400,'customer_invalid','Kunde wurde nicht gefunden.');
 const result=(await c.query("insert into projects(organization_id,external_id,name,customer_id,status,source_quote_id,created_by_user_id) values($1,$2,$3,$4,'active',$5,$6) returning id,name,customer_id,status",[s.organizationId,randomUUID(),name,customerId||null,quoteId,s.userId])).rows[0];await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'project.created',entityType:'project',entityId:result.id});return result;};return requestKey?idempotentBusiness(c,{organizationId:s.organizationId,userId:s.userId,operation:'project.create',key:requestKey,body:{name,customerId,sourceOffer}},write):write();});return json({item},201);}catch(e){return apiError(e)}}
