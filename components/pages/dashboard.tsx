"use client";
import {formatTimeDuration} from '@/lib/display-format';
import {useDashboardGreeting} from '@/lib/client/user-profile';
import {SetupGuideView} from '../setup-guide';
import type {SetupGuide} from '@/lib/action-readiness';
import {LocalizedText,useTranslation} from '@/lib/client/locale';
import Link from 'next/link';
import {AppShell} from '../app-shell';
import {QuickCreateAction,ListRow} from '../binso-ux';
import {CashOverview} from '../cash-statistics';
import type {CashStatisticsData} from '@/lib/cash-statistics';
import {useApiQuery} from '@/lib/client/use-api-query';
import {financialStatus,formatCurrency} from '@/lib/financial-status';
import {DocumentSummaryRow,type DocumentListItem} from '../document-list';
import {SectionTitle,LoadingState,ErrorState,EmptyState} from '../ui';
export type DashboardData={setup?:SetupGuide|null;work?:{hours:number|null;pending:number|null;expenses:number|null;timeReviews?:number|null;expenseReviews?:number|null}|null;cash?:CashStatisticsData|null;canFinance?:boolean;canInvoices?:boolean;canPayments?:boolean;stats?:{customer_count:number|null;project_count?:number|null;employee_count?:number|null};invoices?:DocumentListItem[];attention?:DocumentListItem[];recent?:DocumentListItem[]};
export function DashboardPage(){
 const query=useApiQuery<DashboardData>('/api/dashboard');
 const greeting=useDashboardGreeting(),translate=useTranslation();
 const pending=query.loading||!greeting;
 return <AppShell loading={pending} headingPlacement="content" title={pending?'':greeting} titleIsUserContent subtitle={!pending?translate('Dein Unternehmen auf einen Blick'):undefined} active="dashboard" actions={<QuickCreateAction/>}>{pending?<LoadingState/>:query.error?<ErrorState onRetry={query.refresh}><LocalizedText>{query.error}</LocalizedText></ErrorState>:<DashboardOverview data={query.data}/>}</AppShell>;
}
export function DashboardOverview({data}:{data:DashboardData|undefined}){
 const translate=useTranslation();
 const attention=(data?.attention??[]).filter(item=>financialStatus(item)==='overdue');
 const recent=(data?.recent??data?.invoices??[]).slice(0,3);
 const work=data?.work,snapshot=data?.canFinance?data.cash?.financial?.snapshot:undefined;
 const taskRows=[
  ...(snapshot&&Number(snapshot.open)+Number(snapshot.overdue)>0?[{href:'/rechnungen?status=Offen',title:'Forderungen',value:formatCurrency(Number(snapshot.open)+Number(snapshot.overdue))}]:[]),
  ...(snapshot&&Number(snapshot.overdue)>0?[{href:'/rechnungen?status=Überfällig',title:'Überfällig',value:formatCurrency(Number(snapshot.overdue))}]:[]),
  ...(Number(work?.timeReviews)>0?[{href:'/zeit?tab=entries&review=1',title:'Zeitfreigaben',value:String(work!.timeReviews)}]:[]),
  ...(Number(work?.expenseReviews)>0?[{href:'/spesen?status=Eingereicht&review=1',title:'Spesenfreigaben',value:String(work!.expenseReviews)}]:[])
 ];
 const tasks=<div className="bo-overview-task-grid">
  {(work?.timeReviews!=null||work?.expenseReviews!=null||snapshot)&&<section className="bo-workspace-section"><SectionTitle title="Offene Aufgaben"/>{taskRows.length?taskRows.map(row=><ListRow information key={row.title} {...row} meta=""/>):<ListRow information title="Keine offenen Aufgaben" meta=""/>}</section>}
  {attention.length>0&&<section className="bo-workspace-section"><SectionTitle title="Handlungsbedarf"/><div className="recent-invoices">{attention.map(item=><DocumentSummaryRow key={item.id} item={item} customerHeading compact/>)}</div></section>}
 </div>;
 return <div className="bo-dashboard-overview">
  {data?.setup&&<SetupGuideView item={data.setup}/>}
  {data?.canFinance&&data.cash?<CashOverview data={data.cash} dashboard afterMetrics={tasks}/>:tasks}
  <div className="bo-overview-secondary">
   {(data?.stats?.customer_count!=null||data?.stats?.project_count!=null||data?.stats?.employee_count!=null)&&<section className="bo-workspace-section"><SectionTitle title="Unternehmen"/>{data.stats.customer_count!=null&&<ListRow information href="/kunden" title="Kunden" meta="Sichtbarer Kundenbestand" value={String(data.stats.customer_count)}/ >}{data.stats.employee_count!=null&&<ListRow information href="/mitarbeiter" title="Mitarbeiter" meta="Aktive Mitarbeiter" value={String(data.stats.employee_count)}/ >}{data.stats.project_count!=null&&<ListRow information href="/projekte?status=Aktiv" title="Aufträge" meta="Aktive, berechtigte Aufträge" value={String(data.stats.project_count)}/>}</section>}
   {work&&[work.hours,work.pending,work.expenses].some(value=>value!==null)&&<section className="bo-workspace-section"><SectionTitle title="Meine Arbeit"/>{work.hours!==null&&<ListRow information href="/zeit" title="Stunden" meta="Dieser Monat" value={formatTimeDuration(Number(work.hours)*60,translate)}/>}{work.pending!==null&&<ListRow information href="/zeit?tab=entries" title="Offene Zeiten" meta="Eigene Einträge" value={String(work.pending)}/>}{work.expenses!==null&&<ListRow information href="/spesen" title="Spesen" meta="Eigene Einträge" value={String(work.expenses)}/>}</section>}
  </div>
  {data?.canInvoices!==false&&recent.length>0&&<section className="bo-workspace-section"><SectionTitle title="Zuletzt bearbeitete Rechnungen" action={<Link href="/rechnungen"><LocalizedText>{'Alle anzeigen'}</LocalizedText></Link>}/>{recent.length?<div className="recent-invoices">{recent.map(item=><DocumentSummaryRow key={item.id} item={item} customerHeading compact/>)}</div>:<EmptyState title="Noch keine Geschäftsvorgänge vorhanden."/>}</section>}
 </div>;
}
