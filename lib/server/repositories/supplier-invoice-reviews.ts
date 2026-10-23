import 'server-only';
import type {PoolClient} from 'pg';import type {SessionUser} from '../session';
import {authorize} from '../rbac';import {ApiError} from '../http';import {requireFreshAuthentication} from '../fresh-authentication';import {audit} from '../audit';import {idempotentBusiness} from '../business-idempotency';
import {compareSupplierInvoice,type SupplierMatchInput} from '@/lib/supplier-invoice-match';import {apApprovalPolicyAllows,type APApprovalPolicy} from '@/lib/supplier-approval-policy';
async function access(c:PoolClient,s:SessionUser,supplierId:string,id:string,write=false){
 authorize(s,write?'purchasing:write':'purchasing:read');
 if(!(await c.query('select app_ap_match_access($1) allowed',[write])).rows[0]?.allowed||s.moduleProfile==='time_only'||s.isDemo)throw new ApiError(403,'ap_review_access','Für diese Rechnungsprüfung fehlt die Berechtigung.');
 if(write){await requireFreshAuthentication(s,c);await c.query('select user_id from organization_memberships where organization_id=$1 and user_id=$2 for share',[s.organizationId,s.userId]);}
 const i=(await c.query(`select id,version,status,created_by_user_id,currency,total_amount,v26_review_id from supplier_invoices where organization_id=$1 and supplier_id::text=$2 and id::text=$3 and archived_at is null${write?' for update':''}`,[s.organizationId,supplierId,id])).rows[0];if(!i)throw new ApiError(404,'not_found','Eingangsrechnung wurde nicht gefunden.');return i;
}
async function policy(c:PoolClient,s:SessionUser,write=false){
 const row=(await c.query(`select ap_policy_revision revision,ap_approval_policy policy from organizations where id=$1${write?' for update':''}`,[s.organizationId])).rows[0];
 const users=Number((await c.query("select count(*) n from organization_memberships m where m.organization_id=$1 and m.status='active'",[s.organizationId])).rows[0].n);return {...row,activeUsers:users} as {revision:number;policy:APApprovalPolicy;activeUsers:number};
}
async function comparison(c:PoolClient,s:SessionUser,id:string,matchId?:string){
 const m=(await c.query(`select m.id,m.created_by_user_id,m.invoice_version,m.input_snapshot,m.input_snapshot is distinct from supplier_invoice_match_input(m.invoice_id,m.invoice_version,m.period_start,m.period_end,m.reported_minutes,m.reported_unit_price,m.price_source_ids) stale from supplier_invoice_matches m where m.organization_id=$1 and m.invoice_id=$2${matchId?' and m.id::text=$3':''} order by m.created_at desc,m.id desc limit 1`,matchId?[s.organizationId,id,matchId]:[s.organizationId,id])).rows[0];return m?{...m,result:compareSupplierInvoice(m.input_snapshot as SupplierMatchInput)}:null;
}
export async function supplierInvoiceReviews(c:PoolClient,s:SessionUser,supplierId:string,id:string){
 const invoice=await access(c,s,supplierId,id),rules=await policy(c,s),match=await comparison(c,s,invoice.id);
 const canReview=s.organizationStatus!=='read_only'&&(await c.query('select app_ap_match_access(true) allowed')).rows[0]?.allowed===true;
 const mayApprove=canReview&&invoice.status==='draft'&&!!match&&!match.stale&&match.result.ready&&apApprovalPolicyAllows(rules.policy,{role:s.role,actor:s.userId,invoiceCreator:invoice.created_by_user_id,matchCreator:match.created_by_user_id,activeUsers:rules.activeUsers,currency:invoice.currency??'',amount:invoice.total_amount??''});
 const reviews=(await c.query('select id,decision,note,invoice_version,policy_revision,created_by_user_id,created_at from supplier_invoice_reviews where organization_id=$1 and invoice_id=$2 order by created_at desc,id desc limit 20',[s.organizationId,invoice.id])).rows;
 const queryUnresolved=!!(await c.query("select 1 from supplier_invoice_reviews where organization_id=$1 and invoice_id=$2 and invoice_version=$3 and decision='query' limit 1",[s.organizationId,invoice.id,invoice.version])).rowCount;
 const alreadyAllocated=!!match&&!!(await c.query("select 1 from supplier_invoice_review_sources x where x.organization_id=$1 and x.time_entry_id in(select (s->>'timeEntryId')::uuid from jsonb_array_elements($2::jsonb) s) limit 1",[s.organizationId,JSON.stringify(match.input_snapshot.sources)])).rowCount;
 return {invoice,policyRevision:rules.revision,match,canReview,mayApprove:mayApprove&&!queryUnresolved&&!alreadyAllocated,queryUnresolved,alreadyAllocated,reviews};
}
export async function reviewSupplierInvoice(c:PoolClient,s:SessionUser,supplierId:string,id:string,input:Record<string,unknown>,key:string){
 if(Object.keys(input).some(k=>!['expectedRevision','expectedPolicyRevision','matchId','decision','note'].includes(k))||!['approve','query'].includes(String(input.decision))||!Number.isSafeInteger(input.expectedRevision)||Number(input.expectedRevision)<1||!Number.isSafeInteger(input.expectedPolicyRevision)||Number(input.expectedPolicyRevision)<1||typeof input.note!=='string'||input.note.length>2000||input.decision==='query'&&input.note.trim().length<10||input.decision==='approve'&&(typeof input.matchId!=='string'||!/^[0-9a-f-]{36}$/i.test(input.matchId))||input.decision==='query'&&input.matchId!==null)throw new ApiError(400,'ap_review_invalid','Bitte Entscheidung, Revisionsstand und eine verständliche Rückfrage erfassen.');
 const note=String(input.note).trim();
 // Serialize policy and approval before the invoice/source locks.
 authorize(s,'purchasing:write');const rules=await policy(c,s,true),invoice=await access(c,s,supplierId,id,true);
 await c.query("select set_config('app.ap_review_session',$1,true)",[s.sessionId]);
 return idempotentBusiness(c,{organizationId:s.organizationId,userId:s.userId,operation:'supplier_invoice.review',key,body:{supplierId,id,...input}},async()=>{
  if(invoice.status!=='draft'||invoice.version!==input.expectedRevision||rules.revision!==input.expectedPolicyRevision)throw new ApiError(409,'ap_review_changed','Rechnung oder Freigaberegel wurde geändert. Bitte erneut prüfen.');
  if(input.decision==='approve'){
   if((await c.query("select 1 from supplier_invoice_reviews where organization_id=$1 and invoice_id=$2 and invoice_version=$3 and decision='query' limit 1",[s.organizationId,invoice.id,invoice.version])).rowCount)throw new ApiError(409,'ap_query_unresolved','Eine Rückfrage ist offen. Bitte den Entwurf überarbeiten und erneut abgleichen.');
   const match=await comparison(c,s,invoice.id,String(input.matchId));
   if(!match||match.stale||!match.result.ready)throw new ApiError(409,'ap_review_unresolved','Ein aktueller Abgleich ohne ungeklärte Abweichungen ist erforderlich.');
   if(!apApprovalPolicyAllows(rules.policy,{role:s.role,actor:s.userId,invoiceCreator:invoice.created_by_user_id,matchCreator:match.created_by_user_id,activeUsers:rules.activeUsers,currency:invoice.currency??'',amount:invoice.total_amount??''}))throw new ApiError(403,'ap_review_policy','Vier-Augen-Regel oder Betragsgrenze verhindert diese Freigabe.');
  }
  const item=(await c.query('insert into supplier_invoice_reviews(organization_id,invoice_id,invoice_version,policy_revision,match_id,decision,note,created_by_user_id) values($1,$2,$3,$4,$5,$6,$7,$8) returning id,decision,note,invoice_version,policy_revision,created_by_user_id,created_at',[s.organizationId,invoice.id,invoice.version,rules.revision,input.matchId,input.decision,note,s.userId])).rows[0];
  if(input.decision==='approve'){
   await c.query("insert into supplier_invoice_review_sources(organization_id,review_id,time_entry_id,price_source_id) select m.organization_id,$2,(source->>'timeEntryId')::uuid,(source->>'priceSourceId')::uuid from supplier_invoice_matches m,jsonb_array_elements(m.input_snapshot->'sources') source where m.organization_id=$1 and m.id=$3",[s.organizationId,item.id,input.matchId]);
   await c.query("update supplier_invoices set status='open',v26_review_id=$3,updated_at=clock_timestamp() where organization_id=$1 and id=$2",[s.organizationId,invoice.id,item.id]);
  }
  await audit(c,{organizationId:s.organizationId,userId:s.userId,action:input.decision==='approve'?'supplier_invoice.approved':'supplier_invoice.queried',entityType:'supplier_invoice',entityId:invoice.id,metadata:{reviewId:item.id,revision:invoice.version,policyRevision:rules.revision}});return {item};
 });
}
