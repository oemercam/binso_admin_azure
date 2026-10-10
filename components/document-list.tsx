"use client";
import {usePathname} from "next/navigation";
import Link from "next/link";
import {ListRow,DetailTabs} from "./binso-ux";

import {financialStatus,financialStatusLabels,documentDateLabel,openAmount,formatCurrency,formatDate,type FinancialDocument} from '@/lib/financial-status';
import {RecordsView, type RecordsController} from './records';
export type DocumentListItem=FinancialDocument&{id?:string};
export function DocumentList({items,kind,loading=false,error=null,outstanding=false,context='default',controller,remote=false,pagination,toolbarActions=true,showCount=true}:{items:DocumentListItem[];kind?:'offer'|'invoice';loading?:boolean;error?:string|null;outstanding?:boolean;context?:'default'|'customer';controller?:RecordsController;remote?:boolean;pagination?:Parameters<typeof RecordsView>[0]['pagination'];toolbarActions?:boolean;showCount?:boolean}){
 const rows=items.filter(item=>!kind||item.kind===kind).map(item=>[item.number??'',item.customer?.name??'',documentDateLabel(item),formatCurrency(outstanding||item.kind==='invoice'&&['open','partial','overdue'].includes(financialStatus(item))?openAmount(item):item.total,item.currency),item.kind==='offer'?'Angebot':'Rechnung',financialStatusLabels[financialStatus(item)]??item.status??'',(['open','partial','overdue'].includes(financialStatus(item))?item.due_date:item.issue_date)??'']);
 const href=(row:string[])=>`${row[4]==='Angebot'?'/angebote/':'/rechnungen/'}${encodeURIComponent(row[0])}`;
 const label=kind==='invoice'?'Rechnungen':kind==='offer'?'Angebote':context==='customer'?'Einträge':'Finanzen';
 const placeholder=context==='customer'?'Angebote und Rechnungen suchen...':`${label} suchen...`;
 return <RecordsView controller={controller} remote={remote} pagination={pagination} toolbarActions={toolbarActions} showCount={showCount} items={rows} typeIndex={4} loading={loading} error={error} placeholder={placeholder} countLabel={label} sortValue={(row,index)=>index===2?row[6]:row[index]} chips={outstanding?['Alle','Überfällig']:kind==='invoice'?['Alle','Entwurf','Offen','Überfällig','Bezahlt','Storniert']:kind==='offer'?['Alle','Entwurf','Versendet','Angenommen','Abgelehnt','Abgelaufen','Storniert']:['Alle','Angebote','Rechnungen']} statusGroups={{Offen:['Teilweise bezahlt','Überfällig']}} emptyLabel={chip=>chip==='Alle'&&outstanding?'Keine offenen Rechnungen':chip==='Alle'?`Keine ${context==='customer'?'Angebote oder Rechnungen':label} erfasst`:kind==='invoice'?`Keine ${({'Entwurf':'Rechnungsentwürfe','Offen':'offenen Rechnungen','Überfällig':'überfälligen Rechnungen','Bezahlt':'bezahlten Rechnungen'} as Record<string,string>)[chip]??'Rechnungen'}`:kind==='offer'?({'Entwurf':'Keine Angebotsentwürfe','Versendet':'Keine versendeten Angebote','Angenommen':'Keine angenommenen Angebote','Abgelehnt':'Keine abgelehnten Angebote','Abgelaufen':'Keine abgelaufenen Angebote'} as Record<string,string>)[chip]??'Keine Angebote':`Keine ${chip} erfasst`} columns={[{label:'Nummer',index:0},{label:'Kunde',index:1},{label:'Datum / Fälligkeit',index:2},{label:'Betrag',index:3,align:'right'},{label:'Status',index:5,status:true}]} rowHref={href}>{row=><DocumentSummaryRow item={items.find(item=>item.number===row[0]&&item.kind===(row[4]==='Rechnung'?'invoice':'offer'))!}/>}</RecordsView>;
}
export function FinanceTabs(){const path=usePathname();return <DetailTabs label="Finanzen"><Link href="/finanzen" className={path==="/finanzen"?"active":""} aria-current={path==="/finanzen"?"page":undefined}>Übersicht</Link><Link href="/angebote" className={path==="/angebote"?"active":""} aria-current={path==="/angebote"?"page":undefined}>Angebote</Link><Link href="/rechnungen" className={path==="/rechnungen"?"active":""} aria-current={path==="/rechnungen"?"page":undefined}>Rechnungen</Link><Link href="/zahlungen" className={path==="/zahlungen"?"active":""} aria-current={path==="/zahlungen"?"page":undefined}>Zahlungen</Link></DetailTabs>;}

/** One document row, compact in summaries and with a labelled balance in lists. */
export function DocumentSummaryRow({item,customerHeading=false,compact=false}:{item:DocumentListItem;customerHeading?:boolean;compact?:boolean}){
 const state=financialStatus(item),open=item.kind==='invoice'&&['open','partial','overdue'].includes(state);
 const label=financialStatusLabels[state]??item.status??'';
 const tone=state==='paid'||state==='accepted'?'success':state==='overdue'||state==='cancelled'?'danger':open?'warning':'neutral';
 const amount=formatCurrency(open?openAmount(item):item.total,item.currency);
 return <FinancialSummaryRow title={customerHeading?item.customer?.name||'Kunde':item.number??''} status={label} tone={tone} meta={[customerHeading?item.number:item.customer?.name,formatDate(item.issue_date)].filter(Boolean).join(' · ')} amount={amount} amountLabel={open?'Offen':compact&&state!=='draft'?undefined:'Total'} compact={compact} href={(item.kind==='offer'?'/angebote/':'/rechnungen/')+encodeURIComponent(item.number??'')}/>;
}

export function FinancialSummaryRow({href,title,status,tone='neutral',meta,amount,amountLabel,compact=false}:{href:string;title:string;status:string;tone?:'neutral'|'success'|'warning'|'danger'|'info';meta:string;amount:string;amountLabel?:string;compact?:boolean}){
 return <ListRow href={href} title={title} meta={meta} status={status} tone={tone} value={amount} valueLabel={amountLabel} compact={compact}/>;
}
