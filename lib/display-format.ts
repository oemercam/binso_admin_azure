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
