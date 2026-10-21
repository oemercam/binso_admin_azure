import {moneyMinor} from "./money";
/** Display state is derived; persisted legacy document states remain compatible. */
export type FinancialDocument = {kind?:string;status?:string;total?:unknown;paid_amount?:unknown;credit_amount?:unknown;refund_amount?:unknown;due_date?:string|null;valid_until?:string|null;issue_date?:string|null;currency?:string;number?:string;customer?:{name?:string}|null};
const cents=moneyMinor;
export function openAmount(document:FinancialDocument){return Math.max(0,cents(document.total)-cents(document.credit_amount)-cents(document.paid_amount)+cents(document.refund_amount))/100;}
export function businessDate(){return new Date().toLocaleDateString("en-CA",{timeZone:"Europe/Zurich"});}
export function paymentStatus(document:FinancialDocument){return cents(document.total)>0&&openAmount(document)===0?"paid":cents(document.paid_amount)>cents(document.refund_amount)?"partial":"open";}
export function financialStatus(document:FinancialDocument,today=businessDate()){
 const status=document.status??'draft';
 if(document.kind==='offer')return status==='sent'&&document.valid_until&&document.valid_until.slice(0,10)<today?'expired':status;
 if(['draft','cancelled'].includes(status))return status;
 if(paymentStatus(document)==='paid')return 'paid';
 if(document.due_date&&document.due_date.slice(0,10)<today&&openAmount(document)>0)return 'overdue';
 return paymentStatus(document);
}
export const financialStatusLabels:Record<string,string>={draft:'Entwurf',sent:'Versendet',accepted:'Angenommen',declined:'Abgelehnt',revised:'Überarbeitet',expired:'Abgelaufen',open:'Offen',partial:'Teilweise bezahlt',paid:'Bezahlt',overdue:'Überfällig',cancelled:'Storniert'};
/** One tone contract for document list, detail and compact summaries. */
export function financialStatusTone(document:FinancialDocument,state=financialStatus(document)):'neutral'|'info'|'success'|'warning'|'danger'{
 if(state==='accepted'||state==='paid')return 'success';
 if(state==='declined'||state==='overdue'||state==='cancelled')return 'danger';
 if(state==='sent'&&document.kind==='offer')return 'info';
 if(['open','partial','in_progress'].includes(state))return 'warning';
 return 'neutral';
}
export function formatCurrency(value:unknown,currency='CHF',locale='de-CH'){return `${currency} ${Number(value??0).toLocaleString(locale,{minimumFractionDigits:2,maximumFractionDigits:2}).replaceAll('’',"'")}`;}
export function formatDate(value:unknown,locale='de-CH'){
 const date=String(value??'').slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return '';
 const instant=new Date(date+'T00:00:00Z');if(!Number.isFinite(instant.getTime())||instant.toISOString().slice(0,10)!==date)return '';
 return new Intl.DateTimeFormat(locale,{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'UTC'}).format(instant);
}
export function documentDateLabel(document:FinancialDocument,today=businessDate()){
 const state=financialStatus(document,today);
 if(state==='overdue'&&document.due_date){const days=Math.round((Date.parse(today+'T00:00:00Z')-Date.parse(document.due_date.slice(0,10)+'T00:00:00Z'))/86400000);return `${days} ${days===1?'Tag':'Tage'} überfällig`;}
 if(['open','partial'].includes(state)&&document.due_date)return `fällig ${formatDate(document.due_date)}`;
 return formatDate(document.issue_date);
}
