'use client';
import {createContext,createElement,useContext,useEffect,useMemo,useState,type ReactNode,type JSX,type ComponentPropsWithRef} from 'react';
import {asLocale,localeCookie,localeTags,translateMessage,type Locale} from '@/lib/locales';
const LocaleContext=createContext<{locale:Locale;choose:(value:Locale)=>void}>({locale:'de',choose:()=>{}});
export function LocaleProvider({initialLocale,children}:{initialLocale:Locale;children:ReactNode}){
 const [locale,setLocale]=useState(initialLocale);
 useEffect(()=>{document.documentElement.lang=localeTags[locale]},[locale]);
 const context=useMemo(()=>({locale,choose:(value:Locale)=>{
  const next=asLocale(value);setLocale(next);
  document.cookie=`${localeCookie}=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol==='https:'?'; Secure':''}`;
  document.documentElement.lang=localeTags[next];
  const url=new URL(location.href);
  if(url.searchParams.get('lang')!==next&&(url.searchParams.has('lang')||next!==locale)){url.searchParams.set('lang',next);history.replaceState(history.state,'',url);}
  if(next!==locale)window.dispatchEvent(new CustomEvent('binso-locale',{detail:next}));
 }}),[locale]);
 return <LocaleContext.Provider value={context}>{children}</LocaleContext.Provider>;
}
export function useLocale(){return useContext(LocaleContext)}
export function useTranslation(){const {locale}=useLocale();return (value:string)=>translateMessage(value,locale)}
/** Only application copy is passed here; records, names and user messages stay untouched. */
export function LocalizedText({children,verbatim=false}:{children:ReactNode;verbatim?:boolean}){
 const {locale}=useLocale();
 const render=(value:ReactNode):ReactNode=>{
  if(typeof value==='string'){
   const reference=value.match(/^([\s\S]*) · #([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i);
   return reference?[translateMessage(reference[1],locale),' · ',translateMessage('Referenz',locale),': ',reference[2]]:translateMessage(value,locale);
  }
  return Array.isArray(value)?value.map(render):value;
 };
 return verbatim?children:render(children);
}
/** Native attribute localization keeps accessible names in the selected language. */
export function LocalizedElement<Tag extends keyof JSX.IntrinsicElements>({as,...props}:{as:Tag}&ComponentPropsWithRef<Tag>){
 const {locale}=useLocale();const translated={...props} as Record<string,unknown>;
 for(const name of ['aria-label','aria-description','placeholder','title','alt'])if(typeof translated[name]==='string')translated[name]=translateMessage(translated[name] as string,locale);
 return createElement(as,translated);
}
