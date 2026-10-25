import {formatCurrency} from "./financial-status";
/** Display-only helpers: never normalize persisted numeric values. */
export function formatQuantity(value:unknown,unit:string,locale='de-CH'){
 const number=Number(value);
 return `${Number.isFinite(number)?number.toLocaleString(locale,{maximumFractionDigits:6}):String(value??"—")} ${unit}`;
}
const priceUnits:Record<string,string>={hour:"Std.",piece:"Stück",flat:"Pauschal",day:"Tag",month:"Monat",year:"Jahr",kg:"kg",m:"m",m2:"m²"};
export function priceUnit(unit:unknown){
 const raw=String(unit??"");
 return Object.hasOwn(priceUnits,raw)?priceUnits[raw]:raw;
}
export function withPriceUnit(price:string,unit:unknown,translate:(label:string)=>string=label=>label){const label=priceUnit(unit);return label?`${price} / ${Object.hasOwn(priceUnits,String(unit??""))?translate(label):label}`:price}
export function timeMetadata(description:unknown,project:unknown,person:unknown,date:string){
 return [...new Set([project,person,date].map(v=>String(v??"").trim()).filter(v=>v&&v!==String(description??"").trim()))].join(" · ");
}
/** Display only: retain sub-minute work instead of presenting it as zero. */
export function formatTimeDuration(minutes:number,translate:(text:string)=>string=text=>text){
 if(!Number.isFinite(minutes)||minutes<0)return '—';
 if(minutes>0&&minutes<1)return translate('< 1 Min.');
 const rounded=Math.round(minutes);
 return `${Math.floor(rounded/60)}:${String(rounded%60).padStart(2,'0')} h`;
}

/** Human-readable Swiss business time and timestamp formatting. */
export function formatHours(value:unknown){
 const hours=Number(value);return Number.isFinite(hours)?hours.toLocaleString("de-DE",{maximumFractionDigits:2})+" h":"—";
}
function formatTimestamp(value:unknown,locale:string,withTime:boolean){
 const date=new Date(String(value??""));if(!Number.isFinite(date.getTime()))return "";
 return new Intl.DateTimeFormat(locale,withTime?{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"Europe/Zurich"}:{day:"2-digit",month:"2-digit",year:"numeric",timeZone:"Europe/Zurich"}).format(date);
}
export function formatDateTime(value:unknown,locale='de-CH'){return formatTimestamp(value,locale,true);}
/** Actual timestamps use the Swiss business day; civil document dates do not. */
export function formatTimestampDate(value:unknown,locale='de-CH'){return formatTimestamp(value,locale,false);}
/** Chat day boundaries use the same Swiss business timezone as other timestamps. */
export function messageDay(value:string){
 const date=new Date(value);if(!Number.isFinite(date.getTime()))return "";
 return new Intl.DateTimeFormat("de-CH",{day:"2-digit",month:"2-digit",year:"numeric",timeZone:"Europe/Zurich"}).format(date);
}
/** Keep the server's event order within each Swiss business day. */
export function activityDays<T extends {at:string}>(items:readonly T[]){
 const groups=new Map<string,T[]>();
 for(const item of [...items].sort((a,b)=>Date.parse(b.at)-Date.parse(a.at))){const day=messageDay(item.at);groups.set(day,[...(groups.get(day)??[]),item]);}
 return [...groups].map(([day,events])=>({day,events}));
}
/** Presentation of legacy activity text; persisted values are never rewritten. */
export function formatActivityDetail(title:string,detail:string){
 if(title==="Arbeitszeit erfasst")return detail.replace(/^([0-9]+(?:\.[0-9]+)?) h/,(_,hours)=>formatHours(hours));
 if(title==="Zahlung erhalten")return detail.replace(/([0-9]+(?:\.[0-9]+)?) ([A-Z]{3})$/,(_,amount,currency)=>formatCurrency(amount,currency));
 return detail;
}
