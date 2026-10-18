"use client";
import {LocalizedText} from "@/lib/client/locale";
import Link from 'next/link';
import {AppShell} from '../app-shell';
import {QuickCreateAction,QuickCreateLinks} from '../binso-ux';
import {CashOverview} from '../cash-statistics';
import type {CashStatisticsData} from '@/lib/cash-statistics';
import {useApiQuery} from '@/lib/client/use-api-query';
import {isProductionBackendEnabled,useBackendMode} from '@/lib/client/backend';
import {financialStatus,businessDate} from '@/lib/financial-status';
import {DocumentSummaryRow,type DocumentListItem} from '../document-list';
import {SectionTitle,LoadingState,ErrorState} from '../ui';

type DashboardData={cash?:CashStatisticsData|null;canFinance?:boolean;canInvoices?:boolean;canPayments?:boolean;stats?:{customer_count:number};analyticsInvoices?:Array<{issue_date:string;invoice_count:number}>;invoices?:DocumentListItem[];attention?:DocumentListItem[];recent?:DocumentListItem[]};
export function DashboardPage({forceDemo=false}:{forceDemo?:boolean}={}){
 const production=useBackendMode()&&!forceDemo;
 const query=useApiQuery<DashboardData>(isProductionBackendEnabled()&&production?'/api/dashboard':'/api/demo/dashboard');
 const data=query.data;
 // Attention comes from all authorized overdue invoices, never just the five recent rows.
 const attention=(data?.attention??[]).filter(item=>financialStatus(item)==='overdue');
 const recent=data?.recent??data?.invoices??[];
 const invoiceCount=data?.analyticsInvoices?.filter(row=>row.issue_date.slice(0,7)===businessDate().slice(0,7)).reduce((total,row)=>total+Number(row.invoice_count),0);
 const countsAllowed=data?.canInvoices!==false&&data?.canPayments!==false;
 return <AppShell title="Dein Überblick." active="dashboard" actions={<QuickCreateAction/>}>
  {query.loading?<LoadingState><LocalizedText>{"Übersicht wird geladen …"}</LocalizedText></LoadingState>:query.error?<ErrorState onRetry={query.refresh}><LocalizedText>{query.error}</LocalizedText></ErrorState>:<>
   {data?.canFinance&&data.cash&&<CashOverview data={data.cash} dashboard invoiceCount={countsAllowed?invoiceCount:undefined} customerCount={countsAllowed?data.stats?.customer_count:undefined}/>}
   <QuickCreateLinks/>
   {attention.length>0&&<section className="bo-workspace-section"><SectionTitle title="Handlungsbedarf"/><div className="recent-invoices">{attention.map(item=><DocumentSummaryRow key={item.id} item={item} customerHeading compact/>)}</div></section>}
   <section className="bo-workspace-section"><SectionTitle title="Zuletzt bearbeitete Rechnungen" action={<Link href="/rechnungen"><LocalizedText>{"Alle anzeigen"}</LocalizedText></Link>}/>{recent.length?<div className="recent-invoices">{recent.map(item=><DocumentSummaryRow key={item.id} item={item} customerHeading compact/>)}</div>:<p role="status"><LocalizedText>{"Noch keine Geschäftsvorgänge vorhanden."}</LocalizedText></p>}</section>
  </>}
 </AppShell>;
}
