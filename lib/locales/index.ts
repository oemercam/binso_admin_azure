import catalogue from './messages.json';
import periodCatalogue from './periods.json';
import pluralCatalogue from "./plurals.json";
import {locales,localeTags,type Locale} from "./config";
export * from "./config";
import templateCatalogue from "./templates.json";
type Translations=Record<string,readonly string[]>;
const messages:Translations=catalogue;
const templatePatterns=Object.entries(templateCatalogue).map(([source,translations])=>({source,translations,pattern:new RegExp('^'+source.split(/\{\d+\}/g).map(piece=>piece.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('(.*?)')+'$')}));
const plurals:Record<string,Partial<Record<Locale,{one:string;other:string}>>>=pluralCatalogue;
const pluralRules=Object.fromEntries(locales.map(locale=>[locale,new Intl.PluralRules(localeTags[locale])])) as Record<Locale,Intl.PluralRules>;
export function translateMessage(value:string,locale:Locale):string{
 const key=value.replace(/\s+/g,' ').trim();
 const periodMessage=(periodCatalogue as Record<string,Partial<Record<Locale,string>>>)[key]?.[locale];
 if(periodMessage)return (value.startsWith(' ')?' ':'')+periodMessage+(value.endsWith(' ')?' ':'');
 // Turkish is introduced for the period control; untranslated app copy retains
 // its source language instead of accidentally selecting the Italian catalogue.
 if(locale==='tr')return value;
 const count=key.match(/^(\d+) (.+)$/),forms=count?plurals[count[2]]?.[locale]:undefined;
 if(count&&forms)return (value.startsWith(' ')?' ':'')+count[1]+' '+forms[pluralRules[locale].select(Number(count[1]))==='one'?'one':'other']+(value.endsWith(' ')?' ':'');
 if(locale==='de')return value;
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
