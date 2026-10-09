import {moneyMinor} from "./money";
/** Display state is derived; persisted legacy document states remain compatible. */
export type FinancialDocument = {kind?:string;status?:string;total?:unknown;paid_amount?:unknown;due_date?:string|null;valid_until?:string|null;issue_date?:string|null;currency?:string;number?:string;customer?:{name?:string}|null};
const cents=moneyMinor;
export function openAmount(document:FinancialDocument){return Math.max(0,cents(document.total)-cents(document.paid_amount))/100;}
export function businessDate(){return new Date().toLocaleDateString("en-CA",{timeZone:"Europe/Zurich"});}
export function paymentStatus(document:FinancialDocument){return cents(document.total)>0&&openAmount(document)===0?"paid":cents(document.paid_amount)>0?"partial":"open";}
export function financialStatus(document:FinancialDocument,today=businessDate()){
 const status=document.status??'draft';
 if(document.kind==='offer')return status==='sent'&&document.valid_until&&document.valid_until.slice(0,10)<today?'expired':status;
 if(['draft','cancelled'].includes(status))return status;
 if(paymentStatus(document)==='paid')return 'paid';
 if(document.due_date&&document.due_date.slice(0,10)<today&&openAmount(document)>0)return 'overdue';
 return paymentStatus(document);
}
export const financialStatusLabels:Record<string,string>={draft:'Entwurf',sent:'Versendet',accepted:'Angenommen',declined:'Abgelehnt',expired:'Abgelaufen',open:'Offen',partial:'Teilweise bezahlt',paid:'Bezahlt',overdue:'Überfällig',cancelled:'Storniert'};
export function formatCurrency(value:unknown,currency='CHF'){return `${currency} ${Number(value??0).toLocaleString('de-CH',{minimumFractionDigits:2,maximumFractionDigits:2})}`;}
export function formatDate(value:unknown){const date=String(value??'').slice(0,10);return /^\d{4}-\d{2}-\d{2}$/.test(date)?date.split('-').reverse().join('.'):'';}
export function documentDateLabel(document:FinancialDocument,today=businessDate()){
 const state=financialStatus(document,today);
 if(state==='overdue'&&document.due_date){const days=Math.round((Date.parse(today+'T00:00:00Z')-Date.parse(document.due_date.slice(0,10)+'T00:00:00Z'))/86400000);return `${days} ${days===1?'Tag':'Tage'} überfällig`;}
 if(['open','partial'].includes(state)&&document.due_date)return `fällig ${formatDate(document.due_date)}`;
 return formatDate(document.issue_date);
}
