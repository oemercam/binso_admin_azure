export const locales=['de','fr','it','en','tr'] as const;
export type Locale=typeof locales[number];
export const localeNames:Record<Locale,string>={de:'Deutsch',fr:'Français',it:'Italiano',en:'English',tr:'Türkçe'};
export const localeTags:Record<Locale,string>={de:'de-CH',fr:'fr-CH',it:'it-CH',en:'en-CH',tr:'tr-TR'};
export const localeCookie='binso_locale';
export function asLocale(value:unknown):Locale{
 const language=typeof value==='string'?value.toLowerCase().split('-')[0]:'';
 // Return a literal from the finite contract, never propagate DOM/cookie input.
 switch(language){case 'fr':return 'fr';case 'it':return 'it';case 'en':return 'en';case 'tr':return 'tr';default:return 'de';}
}
