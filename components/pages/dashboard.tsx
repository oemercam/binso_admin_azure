"use client";
import {LocalizedText} from "@/lib/client/locale";
import Link from 'next/link';
import {AppShell} from '../app-shell';
import {QuickCreateAction} from '../binso-ux';
import {CashStatistics} from '../cash-statistics';
import type {CashStatisticsData} from '@/lib/cash-statistics';
import {useApiQuery} from '@/lib/client/use-api-query';
import {isProductionBackendEnabled,useBackendMode} from '@/lib/client/backend';
import {financialStatus} from '@/lib/financial-status';
import {DocumentSummaryRow,type DocumentListItem} from '../document-list';
import {SectionTitle,LoadingState,ErrorState} from '../ui';
import {FlowWelcome,FlowQuickActions,FlowMonthSummary} from '../flow-home';

type DashboardData={cash?:CashStatisticsData|null;canFinance?:boolean;canInvoices?:boolean;invoices?:DocumentListItem[];attention?:DocumentListItem[];recent?:DocumentListItem[]};
export function DashboardPage({forceDemo=false}:{forceDemo?:boolean}={}){
 const production=useBackendMode()&&!forceDemo;
 const query=useApiQuery<DashboardData>(isProductionBackendEnabled()&&production?'/api/dashboard':'/api/demo/dashboard');
 const data=query.data;
 // Attention comes from all authorized overdue invoices, never just the five recent rows.
 const attention=(data?.attention??[]).filter(item=>financialStatus(item)==='overdue');
 const recent=data?.recent??data?.invoices??[];
 return <AppShell title="Übersicht" active="dashboard" actions={<QuickCreateAction/>}>
  <FlowWelcome/>
  <FlowQuickActions/>
  {query.loading?<LoadingState><LocalizedText>{"Übersicht wird geladen …"}</LocalizedText></LoadingState>:query.error?<ErrorState onRetry={query.refresh}><LocalizedText>{query.error}</LocalizedText></ErrorState>:<>
   <div className="dashboard-grid"><section className="surface"><SectionTitle title="Ihr nächster Schritt"/>{attention.length?<div className="recent-invoices">{attention.map(item=><DocumentSummaryRow key={item.id} item={item} customerHeading compact/>)}</div>:<p role="status"><LocalizedText>{"Keine dringenden Vorgänge in den verfügbaren Rechnungen."}</LocalizedText></p>}</section>
   <section className="surface"><SectionTitle title="Zuletzt bearbeitet" action={<Link href="/rechnungen"><LocalizedText>{"Rechnungen anzeigen"}</LocalizedText></Link>}/>{recent.length?<div className="recent-invoices">{recent.map(item=><DocumentSummaryRow key={item.id} item={item} customerHeading compact/>)}</div>:<p role="status"><LocalizedText>{"Noch keine Geschäftsvorgänge vorhanden."}</LocalizedText></p>}</section></div>
   {data?.canFinance&&data.cash&&<><FlowMonthSummary data={data.cash}/><details className="flow-finance-details"><summary><LocalizedText>{"Finanzentwicklung anzeigen"}</LocalizedText></summary><CashStatistics data={data.cash} storageKey="dashboard"/></details></>}
  </>}
 </AppShell>;
}
