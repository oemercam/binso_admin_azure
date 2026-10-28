export type CommercialContractInput={name:string;side:'purchase'|'sale';partyId:string;projectId:string|null;startsOn:string;endsOn:string|null;noticeDays:number;billingInterval:'none'|'monthly'|'quarterly'|'yearly';notes:string;expectedRevision?:number};
export type ContractConditionInput={resourceId:string|null;startsOn:string;endsOn:string|null;unit:'hour'|'minute'|'day'|'unit'|null;timeUnitMinutes?:number|null;unitPrice:string|null;currency:'CHF'|'EUR'|null;taxTreatment:'taxable'|'exempt'|'out_of_scope'|null;vatRate:string|null;taxReason:string;expensePolicy:'included'|'excluded'|'separate_actual'|null;expectedRevision?:number};
export const commercialUnits={hour:'Stunde',minute:'Minute',day:'Tag',unit:'Einheit'};
export const contractExpensePolicies={included:'Spesen inbegriffen',excluded:'Spesen ausgeschlossen',separate_actual:'Spesen separat nach Nachweis'};
const uuid=(v:unknown)=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const date=(v:unknown)=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
const text=(v:unknown,max:number)=>typeof v==='string'&&v.length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v);
const revision=(v:unknown)=>v===undefined||Number.isSafeInteger(v)&&Number(v)>0;
export function commercialContractIssue(input:unknown):string|null{
 if(!input||typeof input!=='object'||Array.isArray(input))return 'Die Vertragsangaben sind ungültig.';
 const b=input as Record<string,unknown>;
 if(Object.keys(b).some(k=>!['name','side','partyId','projectId','startsOn','endsOn','noticeDays','billingInterval','notes','expectedRevision'].includes(k))||!text(b.name,200)||!String(b.name).trim()||!['purchase','sale'].includes(String(b.side))||!uuid(b.partyId)||(b.projectId!==null&&!uuid(b.projectId))||!date(b.startsOn)||(b.endsOn!==null&&(!date(b.endsOn)||String(b.endsOn)<String(b.startsOn)))||!Number.isInteger(b.noticeDays)||Number(b.noticeDays)<0||Number(b.noticeDays)>3650||!['none','monthly','quarterly','yearly'].includes(String(b.billingInterval))||!text(b.notes,4000)||!revision(b.expectedRevision))return 'Bitte Vertragspartner, Laufzeit, Bezeichnung und Kündigungsfrist prüfen.';
 return null;
}
export function contractConditionIssue(input:unknown):string|null{
 if(!input||typeof input!=='object'||Array.isArray(input))return 'Die Konditionsangaben sind ungültig.';
 const b=input as Record<string,unknown>;
 if(Object.keys(b).some(k=>!['resourceId','startsOn','endsOn','unit','timeUnitMinutes','unitPrice','currency','taxTreatment','vatRate','taxReason','expensePolicy','expectedRevision'].includes(k))||(b.resourceId!==null&&!uuid(b.resourceId))||!date(b.startsOn)||(b.endsOn!==null&&(!date(b.endsOn)||String(b.endsOn)<String(b.startsOn)))||(b.unit!==null&&!Object.hasOwn(commercialUnits,String(b.unit)))||(b.currency!==null&&!['CHF','EUR'].includes(String(b.currency)))||(b.taxTreatment!==null&&!['taxable','exempt','out_of_scope'].includes(String(b.taxTreatment)))||!text(b.taxReason,300)||(b.expensePolicy!==null&&!Object.hasOwn(contractExpensePolicies,String(b.expensePolicy)))||!revision(b.expectedRevision))return 'Bitte Gültigkeit, Ressource, Einheit, Währung und Steuer-/Spesenregel prüfen.';
 if(b.timeUnitMinutes!==undefined&&b.timeUnitMinutes!==null&&(b.unit===null||!Number.isSafeInteger(b.timeUnitMinutes)||Number(b.timeUnitMinutes)<1||Number(b.timeUnitMinutes)>1440||b.unit==='hour'&&b.timeUnitMinutes!==60||b.unit==='minute'&&b.timeUnitMinutes!==1))return 'Bitte eine gültige Minutenbasis für die Preiseinheit angeben.';
 if(b.unitPrice!==null&&(typeof b.unitPrice!=='string'||!/^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/.test(b.unitPrice)))return 'Bitte einen nicht negativen Preis mit höchstens zwei Dezimalstellen erfassen.';
 if(b.vatRate!==null&&(typeof b.vatRate!=='string'||!/^(?:0|[1-9]\d{0,2})(?:\.\d{1,2})?$/.test(b.vatRate)||Number(b.vatRate)>100))return 'Bitte einen gültigen Steuersatz zwischen 0 und 100 erfassen.';
 return null;
}
export function contractConditionReadiness(b:ContractConditionInput){
 const missing:string[]=[];
 if(!b.unit)missing.push('Einheit');if(b.unitPrice===null)missing.push('Vertragspreis');if(!b.currency)missing.push('Währung');if(!b.taxTreatment||b.vatRate===null)missing.push('Steuerregel');
 if(b.taxTreatment&&b.taxTreatment!=='taxable'&&(b.vatRate===null||Number(b.vatRate)!==0||!b.taxReason.trim()))missing.push('Begründung der Steuerbefreiung');if(!b.expensePolicy)missing.push('Spesenregel');
 return missing;
}

/** A day/unit has no implicit duration. Existing hourly sources remain 60 minutes. */
export function contractTimeUnitMinutes(b:Pick<ContractConditionInput,'unit'|'timeUnitMinutes'>):number|null{return b.unit==='hour'?60:b.unit==='minute'?1:Number.isSafeInteger(b.timeUnitMinutes)&&Number(b.timeUnitMinutes)>0&&Number(b.timeUnitMinutes)<=1440?Number(b.timeUnitMinutes):null;}
