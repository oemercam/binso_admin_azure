import 'server-only';
import type {PoolClient} from 'pg';
import type {SessionUser} from './session';
import type {PlanId} from '@/config/plan-access';
import {ApiError} from './http';
import {businessDate} from '@/lib/financial-status';
import {statisticBounds,type StatisticPeriod} from '@/lib/statistics-period';
import {reportSummary,timeReport} from './repositories/reports';
import {reportRows,timeReportRows,timeReportPdfRows,type ReportSummary,type TimeReport} from '@/lib/report-export';
import {translateMessage,type Locale} from '@/lib/locales';

/** One period, permission-projected dataset and localization owner for preview,
 * download and the forthcoming immutable outbound report snapshot. */
export function parseReportInput(query:URLSearchParams){
 const raw=query.get('months')??'1',kind=query.get('kind')??'summary';
 if(kind!=='summary'&&kind!=='time')throw new ApiError(400,'invalid_report_kind','Ungültiger Bericht.');
 const period=statisticBounds({months:(raw==='custom'?'custom':Number(raw)) as StatisticPeriod['months'],from:query.get('from')??'',to:query.get('to')??''},businessDate());
 if(!period||Date.parse(period.to)-Date.parse(period.from)>365*86400000)throw new ApiError(400,'invalid_report_period','Bitte einen gültigen Berichtszeitraum von höchstens einem Jahr wählen.');
 return {kind,period,query};
}
export type ReportInput=ReturnType<typeof parseReportInput>;
export async function readReport(c:PoolClient,s:SessionUser,input:ReportInput,plan:PlanId):Promise<TimeReport|ReportSummary>{
 return input.kind==='time'?timeReport(c,s,input.period,plan,input.query):reportSummary(c,s,input.period,plan);
}
export function localizedReportRows(kind:ReportInput['kind'],result:TimeReport|ReportSummary,locale:Locale,format:'csv'|'pdf'){
 const rows=kind==='time'?(format==='pdf'?timeReportPdfRows(result as TimeReport):timeReportRows(result as TimeReport)):reportRows(result as ReportSummary);
 const translate=(value:string)=>translateMessage(value,locale);
 return rows.map((row,index)=>{
  if(index===0)return row.map(translate);
  if(kind==='time'){
   if(format==='csv')return row.map((value,column)=>column===6?translate(value):value);
   return index<=2||index===rows.length-1?[translate(row[0]),...row.slice(1)]:row;
  }
  let label=row[0];
  if(label.startsWith('Genehmigte Spesen nach Kategorie · '))label=translate('Genehmigte Spesen nach Kategorie')+' · '+label.slice('Genehmigte Spesen nach Kategorie · '.length);
  else if(label.startsWith('Aufträge · '))label=translate('Aufträge')+' · '+translate(label.slice('Aufträge · '.length));
  else if(label.startsWith('Rechnungen · ')||label.startsWith('Nicht zugeordnete Gutschriften · ')){const [name,currency]=label.split(' · ');label=translate(name)+' · '+currency;}
  else if(label.startsWith('Angebote · ')||label.startsWith('Angebotsvolumen · ')){const [name,status,currency]=label.split(' · ');label=[translate(name),translate(status),currency].filter(Boolean).join(' · ');}
  else label=translate(label);
  return [label,...(row[0]==='MwSt.-Datenbasis'?[translate(row[1]),...row.slice(2)]:row.slice(1))];
 });
}
