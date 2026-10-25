"use client";
import {LocalizedText} from "@/lib/client/locale";
import {usePageAccess} from "@/lib/client/page-access";
import {usePathname} from "next/navigation";
import Link from "next/link";
import type {ReactNode} from 'react';
import {ListRow,DetailTabs} from "./binso-ux";

import {financialStatus,financialStatusTone,financialStatusText,documentFilters,documentMatchesFilter,documentDateLabel,openAmount,formatCurrency,formatDate,type FinancialDocument} from '@/lib/financial-status';
import {RecordsView, type RecordsController} from './records';
export type DocumentListItem=FinancialDocument&{id?:string};
export function DocumentList({items,kind,loading=false,error=null,outstanding=false,context='default',returnTo,controller,remote=false,pagination,toolbarActions=true,showCount=true}:{items:DocumentListItem[];kind?:'offer'|'invoice';loading?:boolean;error?:string|null;outstanding?:boolean;context?:'default'|'customer';returnTo?:string;controller?:RecordsController;remote?:boolean;pagination?:Parameters<typeof RecordsView>[0]['pagination'];toolbarActions?:boolean;showCount?:boolean}){
 const byNumber=new Map<string,DocumentListItem>(items.map(item=>[(item.kind==='offer'?'Angebot':'Rechnung')+':'+(item.number??''),item]));
 const rows=items.filter(item=>!kind||item.kind===kind).map(item=>[item.number??'',item.customer?.name??'',documentDateLabel(item),formatCurrency(outstanding||item.kind==='invoice'&&['open','partial','overdue'].includes(financialStatus(item))?openAmount(item):item.total,item.currency),item.kind==='offer'?'Angebot':'Rechnung',financialStatusText(financialStatus(item),item.kind),(['open','partial','overdue'].includes(financialStatus(item))?item.due_date:item.issue_date)??'']);
 const href=(row:string[])=>`${row[4]==='Angebot'?'/angebote/':'/rechnungen/'}${encodeURIComponent(row[0])}${returnTo?'?returnTo='+encodeURIComponent(returnTo):''}`;
 const label=kind==='invoice'?'Rechnungen':kind==='offer'?'Angebote':context==='customer'?'Einträge':'Finanzen';
 const placeholder=context==='customer'?'Angebote und Rechnungen suchen...':`${label} suchen...`;
 return <RecordsView controller={controller} remote={remote} pagination={pagination} toolbarActions={toolbarActions} showCount={showCount} items={rows} typeIndex={4} loading={loading} error={error} placeholder={placeholder} countLabel={label} sortValue={(row,index)=>index===2?row[6]:row[index]} matchesStatus={(row,label)=>{const item=byNumber.get(row[4]+':'+row[0]);return item?documentMatchesFilter(item,label):false;}} chips={outstanding?['Alle','Überfällig']:kind?documentFilters(kind):['Alle','Angebote','Rechnungen']} statusGroups={{Offen:['Teilweise bezahlt','Überfällig']}} emptyLabel={chip=>chip==='Alle'&&outstanding?'Keine offenen Rechnungen':chip==='Alle'?`Keine ${context==='customer'?'Angebote oder Rechnungen':label} erfasst`:kind==='invoice'?`Keine ${({'Entwurf':'Rechnungsentwürfe','Offen':'offenen Rechnungen','Überfällig':'überfälligen Rechnungen','Bezahlt':'bezahlten Rechnungen','Teilweise bezahlt':'teilweise bezahlten Rechnungen','Heute fällig':'heute fälligen Rechnungen','Überbezahlt':'überbezahlten Rechnungen','Gutgeschrieben':'gutgeschriebenen Rechnungen'} as Record<string,string>)[chip]??'Rechnungen'}`:kind==='offer'?({'Entwurf':'Keine Angebotsentwürfe','Versendet':'Keine versendeten Angebote','Angenommen':'Keine angenommenen Angebote','Abgelehnt':'Keine abgelehnten Angebote','Abgelaufen':'Keine abgelaufenen Angebote','Überarbeitet':'Keine überarbeiteten Angebote','Zurückgezogen':'Keine zurückgezogenen Angebote'} as Record<string,string>)[chip]??'Keine Angebote':`Keine ${chip} erfasst`} columns={[{label:'Nummer',index:0},{label:'Kunde',index:1},{label:'Datum',index:2},{label:'Betrag',index:3,align:'right'},{label:'Status',index:5,status:true}]} rowHref={href}>{row=><DocumentSummaryRow returnTo={returnTo} item={byNumber.get(row[4]+':'+row[0])!}/>}</RecordsView>;
}
export function FinanceTabs(){
 const path=usePathname(),access=usePageAccess();
 const items=[{href:"/finanzen",label:"Übersicht"},{href:"/finanzen/analyse",label:"Analyse"}];
 return <DetailTabs label="Finanzen">{items.filter(item=>access.canOpen(item.href)).map(item=><Link key={item.href} href={item.href} className={path===item.href?"active":""} aria-current={path===item.href?"page":undefined}><LocalizedText>{item.label}</LocalizedText></Link>)}</DetailTabs>;
}

/** One document row, compact in summaries and with a labelled balance in lists. */
export function DocumentSummaryRow({item,customerHeading=false,compact=false,returnTo}:{item:DocumentListItem;customerHeading?:boolean;compact?:boolean;returnTo?:string}){
 const state=financialStatus(item),open=item.kind==='invoice'&&['open','partial','overdue'].includes(state);
 const label=financialStatusText(state,item.kind);
 const tone=financialStatusTone(item);
 const amount=formatCurrency(open?openAmount(item):item.total,item.currency);
 return <FinancialSummaryRow title={item.number??''} status={label} tone={tone} meta={<span className="document-summary-meta"><span>{item.customer?.name??''}</span><time dateTime={item.issue_date??undefined}>{formatDate(item.issue_date)}</time></span>} amount={amount} compact={compact} href={(item.kind==='offer'?'/angebote/':'/rechnungen/')+encodeURIComponent(item.number??'')+(returnTo?'?returnTo='+encodeURIComponent(returnTo):'')}/>;
}

export function FinancialSummaryRow({href,title,status,tone='neutral',meta,amount,compact=false}:{href:string;title:string;status:string;tone?:'neutral'|'success'|'warning'|'danger'|'info';meta:ReactNode;amount:string;amountLabel?:string;compact?:boolean}){
 return <ListRow translateTitle={false} href={href} title={title} meta={meta} status={status} tone={tone} value={amount} valuePlacement="metadata" compact={compact}/>;
}
