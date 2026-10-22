import {moneyMinor,calculateDocument} from "./money";
export {calculateDocument};
/** Display state is derived; persisted legacy document states remain compatible. */
export type FinancialDocument = {kind?:string;status?:string;total?:unknown;paid_amount?:unknown;credit_amount?:unknown;refund_amount?:unknown;due_date?:string|null;valid_until?:string|null;issue_date?:string|null;currency?:string;number?:string;customer?:{name?:string}|null};
const cents=moneyMinor;
export function openAmount(document:FinancialDocument){return Math.max(0,cents(document.total)-cents(document.credit_amount)-cents(document.paid_amount)+cents(document.refund_amount))/100;}
/** Liability remaining after actual receipts/refunds and effective credits; never revenue. */
export function customerCredit(document:FinancialDocument){return Math.max(0,cents(document.paid_amount)-cents(document.refund_amount)-Math.max(0,cents(document.total)-cents(document.credit_amount)))/100;}
export type PaymentBalanceReview={openAmount:number;paidAmount:number;creditAmount:number;refundAmount:number};
export function paymentBalance(document:FinancialDocument):PaymentBalanceReview{return {openAmount:openAmount(document),paidAmount:cents(document.paid_amount)/100,creditAmount:cents(document.credit_amount)/100,refundAmount:cents(document.refund_amount)/100};}
export function isPaymentBalanceReview(value:unknown):value is PaymentBalanceReview{
 if(!value||typeof value!=='object'||Array.isArray(value))return false;
 const record=value as Record<string,unknown>,keys=['openAmount','paidAmount','creditAmount','refundAmount'];
 return Object.keys(record).length===keys.length&&keys.every(key=>typeof record[key]==='number'&&Number.isFinite(record[key])&&record[key]>=0&&Number.isSafeInteger(Math.round(record[key]*100))&&record[key]===Math.round(record[key]*100)/100);
}
export function samePaymentBalance(review:unknown,current:PaymentBalanceReview){return isPaymentBalanceReview(review)&&Object.keys(current).every(key=>review[key as keyof PaymentBalanceReview]===current[key as keyof PaymentBalanceReview]);}
export const maxRecordedPayment=999999999999.99; // Existing PostgreSQL numeric(14,2), not a business limit.
/** Ordinary payment safety stays unchanged. A real overpayment needs explicit
 * consent bound to the balance the user actually reviewed, under the row lock. */
export function paymentEntryIssue(amount:number,remaining:number,confirmed=false,expectedRemaining?:number){
 if(!Number.isFinite(amount)||amount<=0||amount>maxRecordedPayment||!Number.isSafeInteger(Math.round(amount*100))||amount!==Math.round(amount*100)/100)return 'amount_invalid';
 if(amount<=remaining&&remaining>0)return confirmed?'payment_balance_changed':null;
 if(!confirmed)return 'payment_exceeds_balance';
 if(typeof expectedRemaining!=='number'||!Number.isFinite(expectedRemaining)||expectedRemaining<0||expectedRemaining!==Math.round(expectedRemaining*100)/100||cents(expectedRemaining)!==cents(remaining))return 'payment_balance_changed';
 return null;
}
export function businessDate(){return new Date().toLocaleDateString("en-CA",{timeZone:"Europe/Zurich"});}
export function paymentStatus(document:FinancialDocument){
 if(customerCredit(document)>0)return 'overpaid';
 if(cents(document.total)>0&&cents(document.credit_amount)>=cents(document.total)&&cents(document.paid_amount)===cents(document.refund_amount))return 'credited';
 return cents(document.total)>0&&openAmount(document)===0?'paid':cents(document.paid_amount)>cents(document.refund_amount)?'partial':'open';
}
/** Independent axes: a partial payment may be overdue at the same time. */
export function invoiceStatusAxes(document:FinancialDocument,today=businessDate()){
 const raw=document.status??'draft',state=raw==='draft'?'draft':raw==='cancelled'?'cancelled':['sent','open','partial','paid','overdue','issued'].includes(raw)?'issued':'unknown';
 const payment=state==='issued'?paymentStatus(document):null;
 const date=document.due_date?.slice(0,10),parsed=date?new Date(date+'T12:00:00Z'):null;
 const valid=!!date&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&!!parsed&&Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===date;
 const due=state!=='issued'||openAmount(document)===0?null:!valid?'unknown':date! < today?'overdue':date===today?'due_today':'not_due';
 return {document:state,payment:payment==='open'?'unpaid':payment,due};
}
export function financialStatus(document:FinancialDocument,today=businessDate()){
 const status=document.status??'draft';
 if(document.kind==='offer')return status==='sent'&&document.valid_until&&document.valid_until.slice(0,10)<today?'expired':status;
 if(['draft','cancelled'].includes(status))return status;
 const payment=paymentStatus(document);if(['paid','overpaid','credited'].includes(payment))return payment;
 if(document.due_date&&document.due_date.slice(0,10)<today&&openAmount(document)>0)return 'overdue';
 return paymentStatus(document);
}
export const financialStatusLabels:Record<string,string>={draft:'Entwurf',sent:'Versendet',accepted:'Angenommen',declined:'Abgelehnt',revised:'Überarbeitet',expired:'Abgelaufen',open:'Offen',partial:'Teilweise bezahlt',paid:'Bezahlt',overpaid:'Überbezahlt',credited:'Gutgeschrieben',overdue:'Überfällig',cancelled:'Storniert',issued:'Ausgestellt',unpaid:'Unbezahlt',due_today:'Heute fällig',not_due:'Nicht fällig',unknown:'Zu prüfen'};
export function financialStatusText(state:string,kind?:string){return kind==='offer'&&state==='cancelled'?'Zurückgezogen':financialStatusLabels[state]??(state==='rejected'?'Abgelehnt':'Zu prüfen');}
const documentFilterStates={invoice:['draft','open','partial','overdue','due_today','paid','overpaid','credited','cancelled'],offer:['draft','sent','accepted','declined','expired','revised','cancelled']};
export function documentFilters(kind:'invoice'|'offer'){return ['Alle',...documentFilterStates[kind].map(state=>financialStatusText(state,kind))];}
export function documentFilterStatus(kind:'invoice'|'offer',label:string){return documentFilterStates[kind].find(state=>financialStatusText(state,kind)===label);}
export function documentFilterQuery(kind:'invoice'|'offer',label:string){const value=documentFilterStatus(kind,label);if(!value)return null;return {field:kind==='invoice'&&['partial','paid','overpaid','credited'].includes(value)?'payment_status':kind==='invoice'&&['overdue','due_today'].includes(value)?'due_status':'display_status',value};}
export function documentMatchesFilter(document:FinancialDocument,label:string){
 const filter=documentFilterQuery(document.kind==='offer'?'offer':'invoice',label);if(!filter)return undefined;
 const axes=invoiceStatusAxes(document);
 if(filter.field==='payment_status')return axes.payment===filter.value;
 if(filter.field==='due_status')return axes.due===filter.value;
 const status=financialStatus(document);return filter.value==='open'?['open','partial','overdue'].includes(status):status===filter.value;
}
/** One tone contract for document list, detail and compact summaries. */
export function financialStatusTone(document:FinancialDocument,state=financialStatus(document)):'neutral'|'info'|'success'|'warning'|'danger'{
 if(state==='accepted'||state==='paid')return 'success';
 if(state==='declined'||state==='overdue'||state==='cancelled')return 'danger';
 if(state==='sent'&&document.kind==='offer')return 'info';
 if(state==='overpaid')return 'info';
 if(['open','unpaid','partial','in_progress','due_today','unknown'].includes(state))return 'warning';
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
