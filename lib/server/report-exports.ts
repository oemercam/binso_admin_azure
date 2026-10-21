import 'server-only';
import {createHash} from 'node:crypto';
import type {PoolClient} from 'pg';
import type {SessionUser} from './session';
import {withTenant} from './db';
import {authorize} from './rbac';
import {ApiError} from './http';
import {audit} from './audit';
import {idempotentBusiness} from './business-idempotency';
import {getOrganizationPlan} from './plan-access';
import {tenantCan} from '@/lib/permissions';
import {planAllowsModule,type PlanId} from '@/config/plan-access';
import {translateMessage,type Locale} from '@/lib/locales';
import {parseReportInput,readReport,localizedReportRows,type ReportInput} from './report-document';
import {reportPdf} from './document-pdf';
import {documentLogo} from './document-logo';

const hash=(value:string|Buffer)=>createHash('sha256').update(value).digest('hex');
export function authorizeReportDelivery(s:SessionUser){authorize(s,'reports:read');authorize(s,'documents:write');if(s.isDemo)throw new ApiError(403,'demo_send_disabled','Versand ist für diese Testumgebung nicht verfügbar.');}
/** Includes effective policy and currently active assignment scope, not changing
 * business values. Historical reports stay immutable after a payment/correction;
 * lost rights, assignments or entitlements require a newly authorized preview. */
export async function reportAccessScope(c:PoolClient,s:SessionUser,plan:PlanId){
 authorize(s,'reports:read');
 const capabilities=[['customers:read','kunden'],['projects:read','projekte'],['time:read','zeiterfassung'],['payments:read','zahlungen'],['expenses:read','spesen'],['employees:read','personal'],['invoices:read','rechnungen']] as const;
 const grants=capabilities.map(([permission,module])=>[permission,tenantCan(s.role,permission,s.moduleProfile)&&planAllowsModule(plan,module)]);
 const assignments=['project_manager','manager'].includes(s.role)?(await c.query(`select a.customer_id,a.project_id,a.starts_on::text,a.ends_on::text from workforce_assignments a join employees e on e.id=a.employee_id and e.organization_id=a.organization_id where a.organization_id=$1 and a.user_id=$2 and e.user_id=$2 and e.active and e.archived_at is null and a.revoked_at is null and current_date>=a.starts_on and (a.ends_on is null or current_date<=a.ends_on) order by a.customer_id,a.project_id,a.starts_on,a.ends_on`,[s.organizationId,s.userId])).rows:[];
 return hash(JSON.stringify({policy:1,user:s.userId,organization:s.organizationId,role:s.role,profile:s.moduleProfile??'standard',plan,grants,assignments}));
}
function canonicalQuery(input:ReportInput){
 const query=new URLSearchParams({kind:input.kind,months:'custom',from:input.period.from,to:input.period.to});
 if(input.kind==='time')for(const key of ['q','status','groupBy','employeeId','customerId','projectId'])if(input.query.has(key))query.set(key,input.query.get(key)!);
 query.sort();return query.toString();
}
type ExportRow={id:string;kind:'summary'|'time';locale:Locale;query_text:string;scope_hash:string;data_as_of:string|Date;pdf:Buffer;pdf_sha256:string;created_at:string|Date;expires_at:string|Date};
function metadata(row:ExportRow){return {id:row.id,kind:row.kind,locale:row.locale,asOf:new Date(row.data_as_of).toISOString(),expiresAt:new Date(row.expires_at).toISOString(),fileName:'binso-report-'+new Date(row.data_as_of).toISOString().slice(0,10)+'.pdf'};}
export async function prepareReportExport(s:SessionUser,query:URLSearchParams,locale:Locale,key:string){
 authorize(s,'reports:read');const input=parseReportInput(query),plan=await getOrganizationPlan(s.organizationId),queryText=canonicalQuery(input);
 if(queryText.length>4096)throw new ApiError(400,'invalid_report_filter','Bitte die Berichtsfilter eingrenzen.');
 const prepared=await withTenant(s.organizationId,s.userId,async c=>{
  const result=await readReport(c,s,input,plan),rows=localizedReportRows(input.kind,result,locale,'pdf');
  const company=(await c.query('select name,legal_name,logo_url from organizations where id=$1',[s.organizationId])).rows[0]??{};
  const pdf=await reportPdf(rows,{title:translateMessage('Berichte',locale),company:String(company.legal_name||company.name||''),locale,logo:await documentLogo(c,s.organizationId,{},company),variant:input.kind==='time'?'time':undefined});
  if(pdf.length>10000000)throw new ApiError(413,'report_too_large','Bitte den Zeitraum oder die Filter weiter eingrenzen.');
  return {pdf,asOf:result.asOf,scope:await reportAccessScope(c,s,plan)};
 },{snapshot:true});
 const currentPlan=await getOrganizationPlan(s.organizationId);
 return withTenant(s.organizationId,s.userId,async c=>{
  if(await reportAccessScope(c,s,currentPlan)!==prepared.scope)throw new ApiError(409,'report_scope_changed','Die Berechtigung oder Zuordnung hat sich geändert. Bitte den Bericht neu erstellen.');
  const result=await idempotentBusiness(c,{organizationId:s.organizationId,userId:s.userId,operation:'report.export.prepare',key,body:{query:queryText,locale,scope:prepared.scope}},async()=>{
   const row=(await c.query<ExportRow>('insert into report_exports(organization_id,created_by_user_id,kind,locale,query_text,scope_hash,data_as_of,pdf,pdf_sha256) values($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *',[s.organizationId,s.userId,input.kind,locale,queryText,prepared.scope,prepared.asOf,prepared.pdf,hash(prepared.pdf)])).rows[0];
   await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'report.export.prepared',entityType:'report_export',entityId:row.id,metadata:{kind:input.kind,from:input.period.from,to:input.period.to}});
   return metadata(row);
  });
  if(new Date(result.expiresAt).getTime()<=Date.now())throw new ApiError(410,'report_export_expired','Diese Berichtsvorschau ist abgelaufen. Bitte den Bericht neu erstellen.');
  return result;
 });
}
export async function readReportExport(c:PoolClient,s:SessionUser,id:string,plan:PlanId){
 authorize(s,'reports:read');
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))throw new ApiError(404,'not_found','Bericht wurde nicht gefunden.');
 const row=(await c.query<ExportRow>('select * from report_exports where organization_id=$1 and created_by_user_id=$2 and id=$3',[s.organizationId,s.userId,id])).rows[0];
 if(!row)throw new ApiError(404,'not_found','Bericht wurde nicht gefunden.');
 if(new Date(row.expires_at).getTime()<=Date.now())throw new ApiError(410,'report_export_expired','Diese Berichtsvorschau ist abgelaufen. Bitte den Bericht neu erstellen.');
 if(await reportAccessScope(c,s,plan)!==row.scope_hash)throw new ApiError(409,'report_scope_changed','Die Berechtigung oder Zuordnung hat sich geändert. Bitte den Bericht neu erstellen.');
 const pdf=Buffer.from(row.pdf);if(hash(pdf)!==row.pdf_sha256)throw new ApiError(500,'report_integrity_failed','Bericht konnte nicht sicher geladen werden.');
 return {...metadata(row),pdf};
}
