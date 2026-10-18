import {formatCurrency} from "./financial-status";
/** Display-only helpers: never normalize persisted numeric values. */
export function formatQuantity(value:unknown,unit:string){
 const number=Number(value);
 return `${Number.isFinite(number)?number.toLocaleString("de-CH",{maximumFractionDigits:6}):String(value??"—")} ${unit}`;
}
export function priceUnit(unit:unknown){
 const raw=String(unit??"");
 return ({hour:"Std.",piece:"Stück",flat:"Pauschal",day:"Tag",month:"Monat",year:"Jahr",kg:"kg",m:"m",m2:"m²"} as Record<string,string>)[raw]??raw;
}
export function withPriceUnit(price:string,unit:unknown){const label=priceUnit(unit);return label?`${price} / ${label}`:price}
export function timeMetadata(description:unknown,project:unknown,person:unknown,date:string){
 return [...new Set([project,person,date].map(v=>String(v??"").trim()).filter(v=>v&&v!==String(description??"").trim()))].join(" · ");
}

/** Human-readable Swiss business time and timestamp formatting. */
export function formatHours(value:unknown){
 const hours=Number(value);return Number.isFinite(hours)?hours.toLocaleString("de-DE",{maximumFractionDigits:2})+" h":"—";
}
export function formatDateTime(value:unknown){
 const date=new Date(String(value??""));if(!Number.isFinite(date.getTime()))return "";
 return new Intl.DateTimeFormat("de-CH",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"Europe/Zurich"}).format(date);
}
/** Chat day boundaries use the same Swiss business timezone as other timestamps. */
export function messageDay(value:string){
 const date=new Date(value);if(!Number.isFinite(date.getTime()))return "";
 return new Intl.DateTimeFormat("de-CH",{day:"2-digit",month:"2-digit",year:"numeric",timeZone:"Europe/Zurich"}).format(date);
}
/** Presentation of legacy activity text; persisted values are never rewritten. */
export function formatActivityDetail(title:string,detail:string){
 if(title==="Arbeitszeit erfasst")return detail.replace(/^([0-9]+(?:\.[0-9]+)?) h/,(_,hours)=>formatHours(hours));
 if(title==="Zahlung erhalten")return detail.replace(/([0-9]+(?:\.[0-9]+)?) ([A-Z]{3})$/,(_,amount,currency)=>formatCurrency(amount,currency));
 return detail;
}
