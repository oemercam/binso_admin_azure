"use client";
import {SetupGuideView} from "../setup-guide";
import type {SetupGuide} from "@/lib/action-readiness";
import {LocalizedText} from "@/lib/client/locale";
import Link from 'next/link';
import {AppShell} from '../app-shell';
import {QuickCreateAction,ListRow} from '../binso-ux';
import {CashOverview} from '../cash-statistics';
import {hasFinancialHistory,type CashStatisticsData} from '@/lib/cash-statistics';
import {useApiQuery} from '@/lib/client/use-api-query';
import {isProductionBackendEnabled,useBackendMode} from '@/lib/client/backend';
import {financialStatus,formatCurrency} from '@/lib/financial-status';
import {DocumentSummaryRow,type DocumentListItem} from '../document-list';
import {SectionTitle,LoadingState,ErrorState,EmptyState} from '../ui';

type DashboardData={setup?:SetupGuide|null;work?:{hours:number|null;pending:number|null;expenses:number|null;timeReviews?:number|null;expenseReviews?:number|null}|null;cash?:CashStatisticsData|null;canFinance?:boolean;canInvoices?:boolean;canPayments?:boolean;stats?:{customer_count:number|null;project_count?:number|null;employee_count?:number|null};invoices?:DocumentListItem[];attention?:DocumentListItem[];recent?:DocumentListItem[]};
export function DashboardPage(){
 const query=useApiQuery<DashboardData>('/api/dashboard');
 const data=query.data;
 // Attention comes from all authorized overdue invoices, never just the five recent rows.
 const attention=(data?.attention??[]).filter(item=>financialStatus(item)==='overdue');
 const recent=data?.recent??data?.invoices??[];
 const setupVisible=!!data?.setup&&!data.setup.dismissed&&data.setup.tasks.some(task=>!task.complete);
 const showFinancialOverview=!setupVisible||!data?.cash||hasFinancialHistory(data.cash);
 const work=data?.work,snapshot=showFinancialOverview?data?.cash?.financial?.snapshot:undefined;
 const personal=data?.work&&[data.work.hours,data.work.pending,data.work.expenses].some(value=>value!==null)&&<section className="bo-workspace-section"><SectionTitle title="Meine Arbeit"/>{data.work.hours!==null&&<ListRow href="/zeit" title="Erfasste Stunden" meta="Dieser Monat" value={Number(data.work.hours).toLocaleString('de-CH',{maximumFractionDigits:2})+' h'}/>}{data.work.pending!==null&&<ListRow href="/zeit?tab=entries" title="Offene Zeiten" meta="Eigene Einträge" value={String(data.work.pending)}/>}{data.work.expenses!==null&&<ListRow href="/spesen" title="Eingereichte Spesen" meta="Eigene Einträge" value={String(data.work.expenses)}/>}</section>;
 return <AppShell headingPlacement="content" title="Dein Überblick." active="dashboard" actions={<QuickCreateAction/>}>
  {query.loading?<LoadingState><LocalizedText>{"Übersicht wird geladen …"}</LocalizedText></LoadingState>:query.error?<ErrorState onRetry={query.refresh}><LocalizedText>{query.error}</LocalizedText></ErrorState>:<>
   {data?.setup&&<SetupGuideView item={data.setup}/>}
   {showFinancialOverview&&data?.canFinance&&data.cash&&<CashOverview data={data.cash} dashboard/>}
   {!data?.canFinance&&personal}
   {(work?.timeReviews!=null||work?.expenseReviews!=null||snapshot)&&<section className="bo-workspace-section"><SectionTitle title="Entscheidungen"/>{snapshot&&<><ListRow href="/rechnungen?status=Offen" title="Offene Forderungen" meta="Aktueller Bestand einschliesslich überfälliger Beträge" value={formatCurrency(Number(snapshot.open)+Number(snapshot.overdue))}/><ListRow href="/rechnungen?status=Überfällig" title="Überfällige Forderungen" meta="Aktueller Bestand" value={formatCurrency(Number(snapshot.overdue))}/></>}{work?.timeReviews!=null&&<ListRow href="/zeit?tab=entries&review=1" title="Zeiten zur Freigabe" meta="Eingereichte Einträge anderer Mitarbeiter" value={String(work.timeReviews)}/ >}{work?.expenseReviews!=null&&<ListRow href="/spesen?status=Eingereicht&review=1" title="Spesen zur Freigabe" meta="Eingereichte Belege anderer Mitarbeiter" value={String(work.expenseReviews)}/>}</section>}
   {(!setupVisible||[data?.stats?.customer_count,data?.stats?.project_count,data?.stats?.employee_count].some(value=>value!=null&&value>0))&&(data?.stats?.customer_count!=null||data?.stats?.project_count!=null||data?.stats?.employee_count!=null)&&<section className="bo-workspace-section"><SectionTitle title="Unternehmen"/>{data.stats.customer_count!=null&&<ListRow href="/kunden" title="Kunden" meta="Sichtbarer Kundenbestand" value={String(data.stats.customer_count)}/ >}{data.stats.employee_count!=null&&<ListRow href="/mitarbeiter" title="Mitarbeiter" meta="Aktive Mitarbeiter" value={String(data.stats.employee_count)}/ >}{data.stats.project_count!=null&&<ListRow href="/projekte?status=Aktiv" title="Laufende Aufträge" meta="Aktive, berechtigte Aufträge" value={String(data.stats.project_count)}/>}</section>}
   {data?.canFinance&&work&&[work.hours,work.pending,work.expenses].some(value=>value!==null&&value>0)&&personal}
   {attention.length>0&&<section className="bo-workspace-section"><SectionTitle title="Handlungsbedarf"/><div className="recent-invoices">{attention.map(item=><DocumentSummaryRow key={item.id} item={item} customerHeading compact/>)}</div></section>}
   {data?.canInvoices!==false&&(!setupVisible||recent.length>0)&&<section className="bo-workspace-section"><SectionTitle title="Zuletzt bearbeitete Rechnungen" action={<Link href="/rechnungen"><LocalizedText>{"Alle anzeigen"}</LocalizedText></Link>}/>{recent.length?<div className="recent-invoices">{recent.map(item=><DocumentSummaryRow key={item.id} item={item} customerHeading compact/>)}</div>:<EmptyState title="Noch keine Geschäftsvorgänge vorhanden."/>}</section>}
  </>}
 </AppShell>;
}
