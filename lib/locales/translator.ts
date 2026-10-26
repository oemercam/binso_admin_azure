import {localeTags,type Locale} from './config';
export type LocaleCatalogue={messages:Record<string,string>;periods:Record<string,string>;plurals:Record<string,{one:string;other:string}>;templates:Record<string,string>};
/** One language, no imports of the combined server catalogue. Unknown/authored
 * content is preserved exactly, including surrounding whitespace. */
export function createTranslator(locale:Locale,catalogue:LocaleCatalogue){
 const rules=new Intl.PluralRules(localeTags[locale]);
 const patterns=Object.entries(catalogue.templates).map(([source,text])=>({source,text,pattern:new RegExp('^'+source.split(/\{\d+\}/g).map(piece=>piece.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('(.*?)')+'$')}));
 const padded=(source:string,text:string)=>(source.startsWith(' ')?' ':'')+text+(source.endsWith(' ')?' ':'');
 const translate=(value:string):string=>{
  const key=value.replace(/\s+/g,' ').trim(),period=catalogue.periods[key];
  if(typeof period==='string'&&period)return padded(value,period);
  const count=key.match(/^(\d+) (.+)$/),forms=count&&Object.hasOwn(catalogue.plurals,count[2])?catalogue.plurals[count[2]]:undefined;
  if(count&&forms)return padded(value,count[1]+' '+forms[rules.select(Number(count[1]))==='one'?'one':'other']);
  if(locale==='de')return value;
  const result=catalogue.messages[key];
  if(typeof result==='string'&&result)return padded(value,result);
  for(const {source,text,pattern} of patterns){
   const match=key.match(pattern);
   if(match&&text)return text.replace(/\{(\d+)\}/g,(_,index)=>{
    const value=match[Number(index)+1]??'';
    return source.startsWith('Schritt ')&&index==='2'||source.endsWith('Zugriffsrechte.')&&index==='1'?translate(value):value;
   });
  }
  if(count&&typeof catalogue.messages[count[2]]==='string')return count[1]+' '+translate(count[2]);
  return value;
 };
 return translate;
}
