"use client";

import { DocumentList, DocumentSummaryRow, FinanceTabs, type DocumentListItem } from "../document-list";
import { formatCurrency } from "@/lib/financial-status";
import Link from "next/link";
import { AppShell } from "../app-shell";
import {useApiQuery} from "@/lib/client/use-api-query";
import { isProductionBackendEnabled, useBackendMode } from "@/lib/client/backend";
import {CashStatistics} from "../cash-statistics";
import type {CashStatisticsData} from "@/lib/cash-statistics";
import {financialStatus} from "@/lib/financial-status";
import {SectionTitle, LoadingState, ErrorState} from "../ui";
import { CreateAction } from "../binso-ux";

export function FinanceAnalysisPage() {
 const production=useBackendMode();
 const query=useApiQuery<{cash:CashStatisticsData}>(isProductionBackendEnabled()&&production?"/api/finance":"/api/demo/finance");
 return <AppShell title="Finanzanalyse" active="finanzen"><FinanceTabs/>{query.loading?<LoadingState>Finanzdaten werden geladen …</LoadingState>:query.error?<ErrorState onRetry={query.refresh}>{query.error}</ErrorState>:query.data?.cash?<CashStatistics data={query.data.cash} storageKey="finance-analysis"/>:<ErrorState>Finanzdaten sind nicht verfügbar.</ErrorState>}</AppShell>;
}

export function FinancialDocumentsPage({kind,forceDemo=false}:{kind:"offer"|"invoice";forceDemo?:boolean}){
 const production=useBackendMode()&&!forceDemo;
 const {data,loading,error}=useApiQuery<{items:DocumentListItem[]}>(isProductionBackendEnabled()&&production?`/api/documents?kind=${kind}`:`/api/demo/data?collection=documents&kind=${kind}`);
 const items=data?.items??[];
 const invoice=kind==="invoice",title=invoice?"Rechnungen":"Angebote",route=invoice?"rechnungen":"angebote";
 return <AppShell title={title} active={route} actions={<CreateAction href={`/${route}/neu`} label={invoice?"Neue Rechnung":"Neues Angebot"}/>}><FinanceTabs/><DocumentList items={items} kind={kind} loading={loading} error={error}/></AppShell>;
}

export function OffersPage({forceDemo=false}:{forceDemo?:boolean}={}){return <FinancialDocumentsPage kind="offer" forceDemo={forceDemo}/>;}

export function InvoicesPage({forceDemo=false}:{forceDemo?:boolean}={}){return <FinancialDocumentsPage kind="invoice" forceDemo={forceDemo}/>;}

export type FinancialSummary={invoices:Array<{currency:string;open_count:number;overdue_count:number;draft_count:number;open_amount:number;revenue:number}>;offers:{draft_count:number;actionable_count:number}|null;time:{hours:number;ready_hours:number;invoiced_hours:number}|null};

export function FinancePage(){
 const query=useApiQuery<FinancialSummary&{documents:DocumentListItem[];cash:CashStatisticsData|null}>("/api/finance/overview?include=workspace");
 const summary=query.data,items=summary?.documents??[];
 const overdue=items.filter(item=>item.kind==='invoice'&&financialStatus(item)==='overdue');
 return <AppShell title="Finanzen" active="finanzen"><FinanceTabs/>{query.loading?<LoadingState>Finanzen werden geladen …</LoadingState>:query.error?<ErrorState onRetry={query.refresh}>{query.error}</ErrorState>:<>
  {summary?.cash&&<CashStatistics data={summary.cash} storageKey="finance"/>}
  <section className="surface"><SectionTitle title="Offene Forderungen"/><p>Aktueller Bestand · unabhängig vom Statistikzeitraum</p>{summary?.invoices.length?summary.invoices.map(item=><p key={item.currency}>{formatCurrency(item.open_amount,item.currency)}</p>):<p>{formatCurrency(0)}</p>}</section>
  <SectionTitle title="Rechnungen" action={<Link href="/rechnungen">Alle anzeigen</Link>}/><DocumentList items={items.filter(item=>item.kind==='invoice')} kind="invoice"/>
  <section className="surface"><SectionTitle title="Handlungsbedarf"/>{overdue.length?overdue.slice(0,5).map(item=><DocumentSummaryRow key={item.id} item={item} compact/>):<p role="status">Keine überfälligen Rechnungen.</p>}</section>
 </>}</AppShell>;
}

export function DocumentsHubPage(){return <FinancePage/>;}
