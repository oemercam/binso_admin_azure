'use client';
import {createContext,createElement,useContext,useEffect,useMemo,useRef,useState,type ReactNode,type JSX,type ComponentPropsWithRef} from 'react';
import {asLocale,localeCookie,localeTags,type Locale} from '@/lib/locales/config';
import {createTranslator,type LocaleCatalogue} from '@/lib/locales/translator';
import {loadLocaleCatalogue,rememberLocaleCatalogue} from '@/lib/locales/client-catalogue';
import german from '@/lib/locales/generated/de.json';
const LocaleContext=createContext<{locale:Locale;choose:(value:Locale)=>Promise<boolean>;translate:(value:string)=>string;loadError:string}>({locale:'de',choose:async()=>true,translate:createTranslator('de',german),loadError:''});
export function LocaleProvider({initialLocale,initialCatalogue,children}:{initialLocale:Locale;initialCatalogue?:LocaleCatalogue;children:ReactNode}){
 if(!initialCatalogue&&initialLocale!=='de')throw new Error('Initial locale catalogue is required.');
 const [selection,setSelection]=useState({locale:initialLocale,catalogue:initialCatalogue??german});
 const [loadError,setLoadError]=useState('');
 const lifecycle=useRef({revision:0,active:true}),loaded=useRef(new Map<Locale,LocaleCatalogue>([[initialLocale,selection.catalogue]]));
 const {locale,catalogue}=selection;
 useEffect(()=>{const state=lifecycle.current;state.active=true;return()=>{state.active=false;++state.revision}},[]);
 useEffect(()=>{rememberLocaleCatalogue(initialLocale,initialCatalogue??german)},[initialLocale,initialCatalogue]);
 useEffect(()=>{document.documentElement.lang=localeTags[locale]},[locale]);
 const translate=useMemo(()=>createTranslator(locale,catalogue),[locale,catalogue]);
 const context=useMemo(()=>({locale,translate,loadError,choose:async(value:Locale)=>{
  const next=asLocale(value),revision=++lifecycle.current.revision;
  if(next===locale){setLoadError('');return true;}
  try{
   const catalogue=loaded.current.get(next)??await loadLocaleCatalogue(next);
   if(!lifecycle.current.active||revision!==lifecycle.current.revision)return false;
   loaded.current.set(next,catalogue);
   setSelection({locale:next,catalogue});setLoadError('');
   document.cookie=`${localeCookie}=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol==='https:'?'; Secure':''}`;
   document.documentElement.lang=localeTags[next];
   const url=new URL(location.href);
   if(url.searchParams.get('lang')!==next){url.searchParams.set('lang',next);history.replaceState(history.state,'',url);}
   window.dispatchEvent(new CustomEvent('binso-locale',{detail:next}));
   return true;
  }catch{if(lifecycle.current.active&&revision===lifecycle.current.revision)setLoadError('Sprache konnte nicht gespeichert werden.');return false;}
 }}),[locale,translate,loadError]);
 return <LocaleContext.Provider value={context}>{children}</LocaleContext.Provider>;
}
export function useLocale(){return useContext(LocaleContext)}
export function useTranslation(){return useLocale().translate}
/** Only application copy is passed here; records, names and user messages stay untouched. */
export function LocalizedText({children,verbatim=false}:{children:ReactNode;verbatim?:boolean}){
 const translate=useTranslation();
 const render=(value:ReactNode):ReactNode=>{
  if(typeof value==='string'){
   const reference=value.match(/^([\s\S]*) · #([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i);
   return reference?[translate(reference[1]),' · ',translate('Referenz'),': ',reference[2]]:translate(value);
  }
  return Array.isArray(value)?value.map(render):value;
 };
 return verbatim?children:render(children);
}
/** Native attribute localization keeps accessible names in the selected language. */
export function LocalizedElement<Tag extends keyof JSX.IntrinsicElements>({as,...props}:{as:Tag}&ComponentPropsWithRef<Tag>){
 const translate=useTranslation();const translated={...props} as Record<string,unknown>;
 for(const name of ['aria-label','aria-description','placeholder','title','alt'])if(typeof translated[name]==='string')translated[name]=translate(translated[name] as string);
 return createElement(as,translated);
}
