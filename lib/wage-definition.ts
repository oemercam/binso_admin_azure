export type WageModel='monthly'|'hourly'|'annual';
export type AnnualBasis='including_13th'|'excluding_13th'|'without_13th';
export type WageDefinitionInput={employmentRevisionId:string;startsOn:string;endsOn:string|null;model:WageModel;amount:string;currency:'CHF'|'EUR';annualBasis:AnnualBasis|null;thirteenthEntitled:boolean;payoutDay:number|'last_day';thirteenthPayoutMonth:number|null;expectedRevision?:number};
const date=(value:unknown)=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
/** Exact contract amounts only. No annual/monthly conversion or statutory rates. */
export function wageDefinitionIssue(input:unknown):string|null{
 if(!input||typeof input!=='object'||Array.isArray(input))return 'Die Lohndefinition ist ungültig.';
 const b=input as Record<string,unknown>,keys=['employmentRevisionId','startsOn','endsOn','model','amount','currency','annualBasis','thirteenthEntitled','payoutDay','thirteenthPayoutMonth','expectedRevision'];
 if(Object.keys(b).some(key=>!keys.includes(key))||!['monthly','hourly','annual'].includes(String(b.model))||!['CHF','EUR'].includes(String(b.currency))||typeof b.thirteenthEntitled!=='boolean'||typeof b.employmentRevisionId!=='string'||! /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(b.employmentRevisionId))return 'Die Lohndefinition ist ungültig.';
 if(!date(b.startsOn)||(b.endsOn!==null&&!date(b.endsOn))||(typeof b.endsOn==='string'&&b.endsOn<String(b.startsOn)))return 'Bitte eine gültige Lohngültigkeit erfassen.';
 if(typeof b.amount!=='string'||! /^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/.test(b.amount)||! /[1-9]/.test(b.amount))return 'Bitte einen positiven Vertragsbetrag mit höchstens zwei Dezimalstellen erfassen.';
 if(b.model==='annual'){
  if(!['including_13th','excluding_13th','without_13th'].includes(String(b.annualBasis))||b.thirteenthEntitled!==(b.annualBasis!=='without_13th'))return 'Bitte Jahreslohnbasis und Anspruch auf den 13. Monatslohn ausdrücklich festlegen.';
 }else if(b.annualBasis!==null)return 'Eine Jahreslohnbasis ist nur bei Jahreslohn zulässig.';
 if(b.payoutDay!=='last_day'&&(!Number.isInteger(b.payoutDay)||Number(b.payoutDay)<1||Number(b.payoutDay)>28))return 'Bitte einen Auszahlungstag von 1 bis 28 oder den Monatsletzten wählen.';
 if(b.thirteenthEntitled?(!Number.isInteger(b.thirteenthPayoutMonth)||Number(b.thirteenthPayoutMonth)<1||Number(b.thirteenthPayoutMonth)>12):b.thirteenthPayoutMonth!==null)return 'Bitte den Auszahlungsmonat für den 13. Monatslohn passend zum Anspruch erfassen.';
 if(b.expectedRevision!==undefined&&(!Number.isSafeInteger(b.expectedRevision)||Number(b.expectedRevision)<1))return 'Bitte den aktuellen Revisionsstand angeben.';
 return null;
}
