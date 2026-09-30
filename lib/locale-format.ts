import type {Locale} from "@/lib/i18n";

export const localeTags:Record<Locale,string>={
  de:"de-CH",
  en:"en-CH",
  fr:"fr-CH",
  it:"it-CH",
  tr:"tr-TR"
};

function dateValue(value:Date|string|number){return value instanceof Date?value:new Date(value)}

export function formatDate(value:Date|string|number,locale:Locale,options:Intl.DateTimeFormatOptions={}){
  return new Intl.DateTimeFormat(localeTags[locale],{day:"2-digit",month:"2-digit",year:"numeric",...options}).format(dateValue(value));
}
export function formatDateTime(value:Date|string|number,locale:Locale,options:Intl.DateTimeFormatOptions={}){
  return new Intl.DateTimeFormat(localeTags[locale],{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit",...options}).format(dateValue(value));
}
export function formatTime(value:Date|string|number,locale:Locale,options:Intl.DateTimeFormatOptions={}){
  return new Intl.DateTimeFormat(localeTags[locale],{hour:"2-digit",minute:"2-digit",...options}).format(dateValue(value));
}
export function formatNumber(value:number,locale:Locale,options:Intl.NumberFormatOptions={}){
  return new Intl.NumberFormat(localeTags[locale],options).format(value);
}
export function formatCurrency(value:number,locale:Locale,currency="CHF",options:Intl.NumberFormatOptions={}){
  return new Intl.NumberFormat(localeTags[locale],{style:"currency",currency,...options}).format(value);
}
