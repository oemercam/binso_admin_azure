import type {Locale} from './config';
import type {LocaleCatalogue} from './translator';
const loaders={de:()=>import('./generated/de.json'),en:()=>import('./generated/en.json'),fr:()=>import('./generated/fr.json'),it:()=>import('./generated/it.json'),tr:()=>import('./generated/tr.json')};
const pending=new Map<Locale,Promise<LocaleCatalogue>>();
export function rememberLocaleCatalogue(locale:Locale,catalogue:LocaleCatalogue){
 if(!pending.has(locale))pending.set(locale,Promise.resolve(catalogue));
}
/** Public immutable dictionaries only. A failed chunk can be retried; concurrent
 * selectors share one download. The initial language arrives in the RSC props. */
export function loadLocaleCatalogue(locale:Locale):Promise<LocaleCatalogue>{
 const saved=pending.get(locale);if(saved)return saved;
 const request=loaders[locale]().then(module=>module.default as LocaleCatalogue);
 pending.set(locale,request);
 void request.catch(()=>{if(pending.get(locale)===request)pending.delete(locale)});
 return request;
}
