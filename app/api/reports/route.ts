import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {authorize} from '@/lib/server/rbac';
import {withTenant} from '@/lib/server/db';
import {apiError,json,jsonHeaders} from '@/lib/server/http';
import {getOrganizationPlan} from '@/lib/server/plan-access';
import {parseReportInput,readReport,localizedReportRows} from '@/lib/server/report-document';
import {reportPdf} from '@/lib/server/document-pdf';
import {documentLogo} from '@/lib/server/document-logo';
import {audit} from '@/lib/server/audit';
import {reportCsv} from '@/lib/report-export';
import {asLocale,localeCookie,translateMessage} from '@/lib/locales';
export const runtime='nodejs';
export async function GET(request:NextRequest){try{
 const s=await requireSession();authorize(s,'reports:read');
 const query=request.nextUrl.searchParams,input=parseReportInput(query),{period,kind}=input;
 const plan=await getOrganizationPlan(s.organizationId);
 const result=await withTenant(s.organizationId,s.userId,c=>readReport(c,s,input,plan),{snapshot:true});
 if(['csv','pdf'].includes(query.get('format')??'')){
  const locale=asLocale(query.get('lang')??request.cookies.get(localeCookie)?.value);
  const rows=localizedReportRows(kind,result,locale,query.get('format') as 'csv'|'pdf');
  const branding=await withTenant(s.organizationId,s.userId,async c=>{const company=(await c.query('select name,legal_name,logo_url from organizations where id=$1',[s.organizationId])).rows[0]??{};await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'report.export',entityType:'report',metadata:{format:query.get('format'),from:period.from,to:period.to}});return {company,logo:query.get('format')==='pdf'?await documentLogo(c,s.organizationId,{},company):undefined};});
  if(query.get('format')==='pdf'){const bytes=await reportPdf(rows,{title:translateMessage('Berichte',locale),company:String(branding.company.legal_name||branding.company.name||''),locale,logo:branding.logo,variant:kind==='time'?'time':undefined});return new Response(new Uint8Array(bytes),{headers:{...jsonHeaders,'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="binso-reports-${period.from}-${period.to}.pdf"`}});}
  return new Response(reportCsv(rows),{headers:{...jsonHeaders,'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="binso-reports-${period.from}-${period.to}.csv"`}});
 }
 return json(result);
}catch(error){return apiError(error)}}
