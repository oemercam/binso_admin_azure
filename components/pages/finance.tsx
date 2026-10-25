"use client";

import {useState,type ReactNode} from "react";
import {usePageAccess} from '@/lib/client/page-access';
import {ReportActions} from '../report-actions';
import {businessDate,formatDate} from '@/lib/financial-status';
import {statisticBounds,type StatisticPeriod} from '@/lib/statistics-period';
import {LocalizedText} from "@/lib/client/locale";
import { DocumentList, DocumentSummaryRow, FinanceTabs, type DocumentListItem } from "../document-list";
import { formatCurrency } from "@/lib/financial-status";
import { AppShell } from "../app-shell";
import {useApiQuery} from "@/lib/client/use-api-query";
import { isProductionBackendEnabled, useBackendMode } from "@/lib/client/backend";
import {CashStatistics,CashOverview} from "../cash-statistics";
import type {CashStatisticsData} from "@/lib/cash-statistics";
import {financialStatus,documentFilters,documentFilterQuery} from "@/lib/financial-status";
import {SectionTitle, LoadingState, ErrorState, EmptyState} from "../ui";
import { RecordsControls, useRecordsController } from "../records";
import { CreateAction,ListRow } from "../binso-ux";

export function FinanceAnalysisPage() {

 const query=useApiQuery<{cash:CashStatisticsData}>("/api/finance?view=cash");
 return <AppShell title="Finanzanalyse" active="finanzen"><FinanceTabs/>{query.loading?<LoadingState><LocalizedText>{"Finanzdaten werden geladen …"}</LocalizedText></LoadingState>:query.error?<ErrorState onRetry={query.refresh}><LocalizedText>{query.error}</LocalizedText></ErrorState>:query.data?.cash?<CashStatistics data={query.data.cash} storageKey="finance-analysis"/>:<ErrorState><LocalizedText>{"Finanzdaten sind nicht verfügbar."}</LocalizedText></ErrorState>}</AppShell>;
}

export function FinancialDocumentsPage({kind}:{kind:"offer"|"invoice"}){

 const invoice=kind==="invoice",title=invoice?"Rechnungen":"Angebote",route=invoice?"rechnungen":"angebote",placeholder=title+" suchen...";
 const chips=documentFilters(kind);
 const columns:NonNullable<Parameters<typeof useRecordsController>[0]['columns']>=[{label:'Nummer',index:0},{label:'Kunde',index:1},{label:'Datum',index:2},{label:'Betrag',index:3,align:'right'},{label:'Status',index:5,status:true}];
 const controller=useRecordsController({placeholder,chips,columns}),pageSize=50;
 const sortFields:Record<number,string>={0:'number',1:'customer_name',2:invoice?'due_date':'issue_date',3:'total',5:'display_status'};
 const params=new URLSearchParams({kind,limit:String(pageSize),offset:String(controller.page*pageSize),order:controller.sort==='default'?'created_at.desc':sortFields[controller.sortIndex]+'.'+controller.sort});
 if(controller.query.trim())params.set('q',controller.query.trim());
 const filter=documentFilterQuery(kind,controller.activeChip);if(filter)params.set(filter.field,filter.value);
 const {data,loading,error}=useApiQuery<{items:DocumentListItem[];total?:number}>(`/api/documents?${params}`);
 const items=data?.items??[],total=data?.total??items.length;
 return <AppShell title={title} subtitle={loading?undefined:`${total} ${title}`} active={route} actions={<RecordsControls controller={controller} placeholder={placeholder} chips={chips} columns={columns}><CreateAction href={`/${route}/neu`} label={invoice?"Neue Rechnung":"Neues Angebot"}/></RecordsControls>}><FinanceTabs/><DocumentList items={items} kind={kind} loading={loading} error={error} controller={controller} remote toolbarActions={false} showCount={false} pagination={{total,page:controller.page,pageSize,onPage:controller.setPage}}/></AppShell>;
}

export function OffersPage(){return <FinancialDocumentsPage kind="offer"/>;}

export function InvoicesPage(){return <FinancialDocumentsPage kind="invoice"/>;}

export type FinancialSummary={invoices:Array<{currency:string;open_count:number;overdue_count:number;draft_count:number;open_amount:number;revenue:number}>;offers:{draft_count:number;actionable_count:number}|null;time:{hours:number;ready_hours:number;invoiced_hours:number}|null};

function FinanceWorkspace({compact,children}:{compact:boolean;children:ReactNode}){return compact?<div className="bo-finance-workspace">{children}</div>:<>{children}</>;}

export function FinancePage({compactMobile=true}:{compactMobile?:boolean}={}){
 const [period,setPeriod]=useState<StatisticPeriod>({months:1,from:'',to:''}),access=usePageAccess();
 const bounds=statisticBounds(period,businessDate())!;
 const reportQuery=new URLSearchParams({months:'custom',from:bounds.from,to:bounds.to}).toString();
 const query=useApiQuery<FinancialSummary&{documents:DocumentListItem[];cash:CashStatisticsData|null}>("/api/finance/overview?include=workspace&view=cash");
 const summary=query.data,items=summary?.documents??[];
 const overdue=items.filter(item=>item.kind==='invoice'&&financialStatus(item)==='overdue');
 return <AppShell title="Finanzen" active="finanzen"><FinanceWorkspace compact={compactMobile}><FinanceTabs/>{query.loading?<LoadingState><LocalizedText>{"Finanzen werden geladen …"}</LocalizedText></LoadingState>:query.error?<ErrorState onRetry={query.refresh}><LocalizedText>{query.error}</LocalizedText></ErrorState>:<>
  {summary?.cash&&<CashOverview data={summary.cash} compact={compactMobile} tools={access.hasPermission?.("reports:read")?<ReportActions tools label="Listenwerkzeuge" query={reportQuery} caption={formatDate(bounds.from)+" – "+formatDate(bounds.to)}/>:undefined} onPeriodChange={setPeriod}/>}
  {!summary?.cash&&summary?.invoices.map(item=><section className="bo-workspace-section" key={item.currency}><SectionTitle title="Forderungen"/><ListRow information={compactMobile} href="/rechnungen?status=Offen" title="Offene Forderungen" meta={item.currency} value={formatCurrency(item.open_amount,item.currency)}/></section>)}
  {summary?.offers&&<section className="bo-workspace-section"><SectionTitle title="Angebote"/><ListRow information={compactMobile} href="/angebote?status=Entwurf" title="Entwürfe" meta="Noch nicht versendet" value={String(summary.offers.draft_count)}/><ListRow information={compactMobile} href="/angebote" title="Aktive Vorgänge" meta="Angebote mit nächstem Schritt" value={String(summary.offers.actionable_count)}/></section>}
  {summary?.time&&<section className="bo-workspace-section"><SectionTitle title="Arbeitszeit"/><ListRow information={compactMobile} href="/zeit?tab=entries" title="Zur Abrechnung bereit" meta="Freigegeben und noch nicht verrechnet" value={Number(summary.time.ready_hours).toLocaleString('de-CH',{maximumFractionDigits:2})+' h'}/></section>}
  {!summary?.cash&&!summary?.invoices.length&&!summary?.offers&&!summary?.time&&<EmptyState title="Keine Finanzinformationen für diesen Zugriff verfügbar"/>}
  {summary?.cash&&!!summary.invoices.filter(item=>item.currency!=='CHF').length&&<section className="bo-workspace-section"><SectionTitle title="Offene Forderungen"/>{summary.invoices.filter(item=>item.currency!=='CHF').map(item=><p key={item.currency}>{formatCurrency(item.open_amount,item.currency)}</p>)}</section>}
  {overdue.length>0&&<section className="bo-workspace-section"><SectionTitle title="Handlungsbedarf"/>{overdue.slice(0,5).map(item=><DocumentSummaryRow key={item.id} item={item} compact/>)}</section>}
 </>}</FinanceWorkspace></AppShell>;
}

export function DocumentsHubPage(){return <FinancePage compactMobile={false}/>;}
