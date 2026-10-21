import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {authorize} from '@/lib/server/rbac';
import {withTenant} from '@/lib/server/db';
import {ApiError,apiError,json,jsonHeaders} from '@/lib/server/http';
import {businessDate} from '@/lib/financial-status';
import {statisticBounds,type StatisticPeriod} from '@/lib/statistics-period';
import {getOrganizationPlan} from '@/lib/server/plan-access';
import {reportSummary,timeReport} from '@/lib/server/repositories/reports';
import {reportPdf} from '@/lib/server/document-pdf';
import {documentLogo} from '@/lib/server/document-logo';
import {audit} from '@/lib/server/audit';
import {reportRows,reportCsv,timeReportRows,timeReportPdfRows,type ReportSummary,type TimeReport} from '@/lib/report-export';
import {asLocale,localeCookie,translateMessage} from '@/lib/locales';
export const runtime='nodejs';
export async function GET(request:NextRequest){try{
 const s=await requireSession();authorize(s,'reports:read');
 const query=request.nextUrl.searchParams,raw=query.get('months')??'1';
 const kind=query.get('kind')??'summary';if(!['summary','time'].includes(kind))throw new ApiError(400,'invalid_report_kind','Ungültiger Bericht.');
 const period=statisticBounds({months:(raw==='custom'?'custom':Number(raw)) as StatisticPeriod['months'],from:query.get('from')??'',to:query.get('to')??''},businessDate());
 if(!period||Date.parse(period.to)-Date.parse(period.from)>365*86400000)throw new ApiError(400,'invalid_report_period','Bitte einen gültigen Berichtszeitraum von höchstens einem Jahr wählen.');
 const plan=await getOrganizationPlan(s.organizationId);
 const result=await withTenant<TimeReport|ReportSummary>(s.organizationId,s.userId,c=>kind==='time'?timeReport(c,s,period,plan,query):reportSummary(c,s,period,plan),{snapshot:true});
 if(['csv','pdf'].includes(query.get('format')??'')){
  const locale=asLocale(query.get('lang')??request.cookies.get(localeCookie)?.value);
  const rawRows=kind==='time'?(query.get('format')==='pdf'?timeReportPdfRows(result as TimeReport):timeReportRows(result as TimeReport)):reportRows(result as ReportSummary);
  const rows=rawRows.map((row,index)=>index===0?row.map(value=>translateMessage(value,locale)):kind==='time'?(query.get('format')==='csv'?row.map((value,column)=>column===6?translateMessage(value,locale):value):index<=2||index===rawRows.length-1?[translateMessage(row[0],locale),...row.slice(1)]:row):[row[0].startsWith('Genehmigte Spesen nach Kategorie · ')?translateMessage('Genehmigte Spesen nach Kategorie',locale)+' · '+row[0].slice('Genehmigte Spesen nach Kategorie · '.length):row[0].startsWith('Aufträge · ')?translateMessage('Aufträge',locale)+' · '+translateMessage(row[0].slice('Aufträge · '.length),locale):translateMessage(row[0],locale),...row.slice(1)]);
  const branding=await withTenant(s.organizationId,s.userId,async c=>{const company=(await c.query('select name,legal_name,logo_url from organizations where id=$1',[s.organizationId])).rows[0]??{};await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'report.export',entityType:'report',metadata:{format:query.get('format'),from:period.from,to:period.to}});return {company,logo:query.get('format')==='pdf'?await documentLogo(c,s.organizationId,{},company):undefined};});
  if(query.get('format')==='pdf'){const bytes=await reportPdf(rows,{title:translateMessage('Berichte',locale),company:String(branding.company.legal_name||branding.company.name||''),locale,logo:branding.logo,variant:kind==='time'?'time':undefined});return new Response(new Uint8Array(bytes),{headers:{...jsonHeaders,'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="binso-reports-${period.from}-${period.to}.pdf"`}});}
  return new Response(reportCsv(rows),{headers:{...jsonHeaders,'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="binso-reports-${period.from}-${period.to}.csv"`}});
 }
 return json(result);
}catch(error){return apiError(error)}}
