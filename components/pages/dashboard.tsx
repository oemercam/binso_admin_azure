"use client";
import Link from 'next/link';
import {AppShell} from '../app-shell';
import {CreateAction} from '../binso-ux';
import {CashStatistics} from '../cash-statistics';
import type {CashStatisticsData} from '@/lib/cash-statistics';
import {useApiQuery} from '@/lib/client/use-api-query';
import {isProductionBackendEnabled,useBackendMode} from '@/lib/client/backend';
import {financialStatus} from '@/lib/financial-status';
import {DocumentSummaryRow,type DocumentListItem} from '../document-list';
import {SectionTitle,LoadingState,ErrorState} from '../ui';

type DashboardData={cash?:CashStatisticsData|null;canFinance?:boolean;canInvoices?:boolean;invoices?:DocumentListItem[];attention?:DocumentListItem[];recent?:DocumentListItem[]};
export function DashboardPage({forceDemo=false}:{forceDemo?:boolean}={}){
 const production=useBackendMode()&&!forceDemo;
 const query=useApiQuery<DashboardData>(isProductionBackendEnabled()&&production?'/api/dashboard':'/api/demo/dashboard');
 const data=query.data;
 // Attention comes from all authorized overdue invoices, never just the five recent rows.
 const attention=(data?.attention??[]).filter(item=>financialStatus(item)==='overdue');
 const recent=data?.recent??data?.invoices??[];
 return <AppShell title="Übersicht" active="dashboard" actions={<CreateAction href="/rechnungen/neu?returnTo=/dashboard" label="Neue Rechnung"/>}>
  {query.loading?<LoadingState>Übersicht wird geladen …</LoadingState>:query.error?<ErrorState onRetry={query.refresh}>{query.error}</ErrorState>:<>
   {data?.canFinance&&data.cash&&<CashStatistics data={data.cash} storageKey="dashboard"/>}
   <div className="dashboard-grid"><section className="surface"><SectionTitle title="Handlungsbedarf"/>{attention.length?<div className="recent-invoices">{attention.map(item=><DocumentSummaryRow key={item.id} item={item} customerHeading compact/>)}</div>:<p role="status">Keine dringenden Vorgänge in den verfügbaren Rechnungen.</p>}</section>
   <section className="surface"><SectionTitle title="Zuletzt bearbeitet" action={<Link href="/rechnungen">Rechnungen anzeigen</Link>}/>{recent.length?<div className="recent-invoices">{recent.map(item=><DocumentSummaryRow key={item.id} item={item} customerHeading compact/>)}</div>:<p role="status">Noch keine Geschäftsvorgänge vorhanden.</p>}</section></div>
  </>}
 </AppShell>;
}
