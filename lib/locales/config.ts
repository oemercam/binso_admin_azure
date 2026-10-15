export const locales=['de','fr','it','en'] as const;
export type Locale=typeof locales[number];
export const localeNames:Record<Locale,string>={de:'Deutsch',fr:'Français',it:'Italiano',en:'English'};
export const localeTags:Record<Locale,string>={de:'de-CH',fr:'fr-CH',it:'it-CH',en:'en-CH'};
export const localeCookie='binso_locale';
export function asLocale(value:unknown):Locale{return typeof value==='string'&&locales.includes(value.toLowerCase().split('-')[0] as Locale)?value.toLowerCase().split('-')[0] as Locale:'de';}
