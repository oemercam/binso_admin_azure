import {domainConfig} from "@/config/domain";
/** Defaults only seed new drafts. Persisted document snapshots always win. */
export function documentDefaults(company:Record<string,unknown>,customer:{paymentDays?:number}|undefined,kind:"Rechnung"|"Angebot",issueDate?:string){
 const days=Number(customer?.paymentDays??company.payment_terms_days??domainConfig.defaultPaymentDays);
 const vat=Number(company.vat_rate??domainConfig.defaultVatRate);
 const date=issueDate&&/^\d{4}-\d{2}-\d{2}$/.test(issueDate)?new Date(issueDate+"T12:00:00Z"):null;
 const valid=date&&Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===issueDate;
 if(valid)date.setUTCDate(date.getUTCDate()+domainConfig.defaultOfferValidityDays);
 return {due:kind==="Rechnung"?String(Number.isInteger(days)&&days>=0&&days<=365?days:domainConfig.defaultPaymentDays):valid?date.toISOString().slice(0,10):"",vatRate:String(Number.isFinite(vat)&&vat>=0&&vat<=100?vat:domainConfig.defaultVatRate),note:String((kind==="Rechnung"?company.invoice_intro_text:company.quote_intro_text)??"")};
}

/** Conversion preserves negotiated positions/text, but uses the invoice's own
 * identity/date and central customer/company payment terms, never a literal 30. */
export function invoiceDraftFromOffer<T extends {number:string;date:string}>(source:T,current:{number:string;date:string},company:Record<string,unknown>,customer:{paymentDays?:number}|undefined){
 return {...source,sourceOffer:source.number,id:undefined,status:'draft',paidAmount:0,creditAmount:0,refundAmount:0,refunds:[],revisesOffer:undefined,revisions:[],credits:[],reminders:[],paidOn:undefined,number:current.number,date:current.date,due:documentDefaults(company,customer,'Rechnung',current.date).due};
}
