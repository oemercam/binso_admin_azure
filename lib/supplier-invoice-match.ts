import {calculateDocument,moneyMinor} from './money';

export type SupplierMatchInput={
 invoice:{id:string;version:number;number:string|null;invoiceDate:string|null;dueDate:string|null;currency:string|null;netAmount:string|null;vatAmount:string|null;totalAmount:string|null};
 period:{start:string;end:string};claimed:{minutes:number;unitPrice:string};
 sources:Array<{priceSourceId:string;timeEntryId:string;timeVersion:number;minutes:number;workDate:string;projectId:string|null;price:{contractId:string;unitPrice:string;currency:string;vatRate:string;taxTreatment:string}}>;receipts:Array<{id:string;sha256:string;scanStatus:string}>;
};
export type SupplierMatchDifference={code:string;expected:string;actual:string|null};
/** The existing document engine owns money/tax/rounding. This only compares facts. */
export function compareSupplierInvoice(input:SupplierMatchInput){
 const differences:SupplierMatchDifference[]=[],first=input.sources[0]?.price;
 const add=(code:string,expected:string,actual:string|null)=>differences.push({code,expected,actual});
 if(!first)return {ready:false,expected:null,differences:[{code:'sources',expected:'approved_purchase_source',actual:null}]};
 const minutes=input.sources.reduce((n,s)=>n+s.minutes,0);
 if(input.sources.some(s=>s.price.currency!==first.currency||s.price.contractId!==first.contractId||moneyMinor(s.price.unitPrice)!==moneyMinor(first.unitPrice)||moneyMinor(s.price.vatRate)!==moneyMinor(first.vatRate)||s.price.taxTreatment!==first.taxTreatment)){
  add('source_groups','one_contract_price_tax_currency','mixed_sources');return {ready:false,expected:null,differences};
 }
 const calculation=calculateDocument(input.sources.map(s=>({quantity:s.minutes,unit_price:s.price.unitPrice,vat_rate:s.price.vatRate,tax_exempt:s.price.taxTreatment!=='taxable',price_base_quantity:60})),first.currency);
 if(input.claimed.minutes!==minutes)add('minutes',String(minutes),String(input.claimed.minutes));
 if(moneyMinor(input.claimed.unitPrice)!==moneyMinor(first.unitPrice))add('unit_price',first.unitPrice,input.claimed.unitPrice);
 if(input.invoice.currency!==first.currency)add('currency',first.currency,input.invoice.currency);
 for(const [field,key,expected] of [['netAmount','net',calculation.subtotal],['vatAmount','tax',calculation.vat],['totalAmount','total',calculation.total]] as const){const actual=input.invoice[field];if(actual===null||moneyMinor(actual)!==moneyMinor(expected))add(key,expected,actual);}
 for(const field of ['number','invoiceDate','dueDate'] as const)if(!input.invoice[field])add(field,'required',null);
 if(!input.receipts.length)add('receipt','clean_receipt',null);
 else if(input.receipts.some(f=>f.scanStatus!=='clean'))add('receipt','clean_receipt','quarantine');
 return {ready:!differences.length,expected:{minutes,unitPrice:first.unitPrice,currency:first.currency,net:calculation.subtotal,tax:calculation.vat,total:calculation.total},differences};
}
