import catalogue from './messages.json';
import {type Locale} from "./config";
export * from "./config";
import templateCatalogue from "./templates.json";
type Translations=Record<string,readonly string[]>;
const messages:Translations=catalogue;
const templatePatterns=Object.entries(templateCatalogue).map(([source,translations])=>({source,translations,pattern:new RegExp('^'+source.split(/\{\d+\}/g).map(piece=>piece.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('(.*?)')+'$')}));
export function translateMessage(value:string,locale:Locale):string{
 if(locale==='de')return value;
 const key=value.replace(/\s+/g,' ').trim();
 const result=messages[key]?.[locale==='en'?0:locale==='fr'?1:2];
 if(!result){
  for(const {source,translations,pattern} of templatePatterns){
   const match=key.match(pattern);
   if(match)return translations[locale==='en'?0:locale==='fr'?1:2].replace(/\{(\d+)\}/g,(_,index)=>{
    const value=match[Number(index)+1]??'';
    const label=source.startsWith('Schritt ')&&index==='2'||source.endsWith('Zugriffsrechte.')&&index==='1';
    return label?translateMessage(value,locale):value;
   });
  }
  const count=key.match(/^(\d+) (.+)$/);
  if(count&&messages[count[2]])return count[1]+' '+translateMessage(count[2],locale);
  return value;
 }
 return (value.startsWith(' ')?' ':'')+result+(value.endsWith(' ')?' ':'');
}
