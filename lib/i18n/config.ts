export const locales=["de","fr","it","en","tr"] as const;
export type AppLocale=typeof locales[number];
export const defaultLocale:AppLocale="de";
export const localeTags:Record<AppLocale,string>={de:"de-CH",fr:"fr-CH",it:"it-CH",en:"en-CH",tr:"tr-CH"};
export const localeLabels:Record<AppLocale,string>={de:"Deutsch",fr:"Français",it:"Italiano",en:"English",tr:"Türkçe"};
export function normalizeLocale(value?:string|null):AppLocale{const code=(value??"").toLowerCase().split(/[-_]/)[0] as AppLocale;return locales.includes(code)?code:defaultLocale;}
export function formatMoney(value:unknown,locale:AppLocale=defaultLocale,currency="CHF"){const amount=Number(value);return new Intl.NumberFormat(localeTags[locale],{style:"currency",currency,minimumFractionDigits:2,maximumFractionDigits:2}).format(Number.isFinite(amount)?amount:0);}
export function formatDate(value:string|Date,locale:AppLocale=defaultLocale,options:Intl.DateTimeFormatOptions={dateStyle:"short"}){const date=value instanceof Date?value:new Date(value);return Number.isNaN(date.getTime())?"":new Intl.DateTimeFormat(localeTags[locale],options).format(date);}
export function formatNumber(value:unknown,locale:AppLocale=defaultLocale,options?:Intl.NumberFormatOptions){const amount=Number(value);return new Intl.NumberFormat(localeTags[locale],options).format(Number.isFinite(amount)?amount:0);}