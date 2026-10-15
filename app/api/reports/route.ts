import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {authorize} from '@/lib/server/rbac';
import {withTenant} from '@/lib/server/db';
import {ApiError,apiError,json,jsonHeaders} from '@/lib/server/http';
import {businessDate} from '@/lib/financial-status';
import {statisticBounds,type StatisticPeriod} from '@/lib/statistics-period';
import {getOrganizationPlan} from '@/lib/server/plan-access';
import {reportSummary} from '@/lib/server/repositories/reports';
import {reportRows,reportCsv} from '@/lib/report-export';
import {asLocale,localeCookie,translateMessage} from '@/lib/locales';
export const runtime='nodejs';
export async function GET(request:NextRequest){try{
 const s=await requireSession();authorize(s,'reports:read');
 const query=request.nextUrl.searchParams,raw=query.get('months')??'1';
 const period=statisticBounds({months:(raw==='custom'?'custom':Number(raw)) as StatisticPeriod['months'],from:query.get('from')??'',to:query.get('to')??''},businessDate());
 if(!period||Date.parse(period.to)-Date.parse(period.from)>365*86400000)throw new ApiError(400,'invalid_report_period','Bitte einen gültigen Berichtszeitraum von höchstens einem Jahr wählen.');
 const plan=await getOrganizationPlan(s.organizationId);
 const result=await withTenant(s.organizationId,s.userId,c=>reportSummary(c,s,period,plan),{snapshot:true});
 if(query.get('format')==='csv'){
  const locale=asLocale(query.get('lang')??request.cookies.get(localeCookie)?.value);
  const rows=reportRows(result).map((row,index)=>index===0?row.map(value=>translateMessage(value,locale)):[row[0].startsWith('Projekte · ')?translateMessage('Projekte',locale)+' · '+translateMessage(row[0].slice('Projekte · '.length),locale):translateMessage(row[0],locale),...row.slice(1)]);
  return new Response(reportCsv(rows),{headers:{...jsonHeaders,'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="binso-reports-${period.from}-${period.to}.csv"`}});
 }
 return json(result);
}catch(error){return apiError(error)}}
