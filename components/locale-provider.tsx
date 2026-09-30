"use client";

import {createContext,useContext,useEffect,useMemo,useSyncExternalStore} from "react";
import {getLocale,localeLabels,localeNames,setLocale as persistLocale,translate,type Locale} from "@/lib/i18n";
import {formatCurrency as formatCurrencyValue,formatDate as formatDateValue,formatDateTime as formatDateTimeValue,formatNumber as formatNumberValue,formatTime as formatTimeValue} from "@/lib/locale-format";
import {appEvents,subscribeAppEvent} from "@/lib/client/app-events";
import {storageKeys} from "@/config/storage-keys";

type LocaleContextValue={
  locale:Locale;
  setLocale:(locale:Locale)=>void;
  t:(value:string)=>string;
  formatDate:(value:Date|string|number,options?:Intl.DateTimeFormatOptions)=>string;
  formatDateTime:(value:Date|string|number,options?:Intl.DateTimeFormatOptions)=>string;
  formatTime:(value:Date|string|number,options?:Intl.DateTimeFormatOptions)=>string;
  formatNumber:(value:number,options?:Intl.NumberFormatOptions)=>string;
  formatCurrency:(value:number,currency?:string,options?:Intl.NumberFormatOptions)=>string;
};

const LocaleContext=createContext<LocaleContextValue>({
  locale:"de",setLocale:()=>{},t:value=>value,
  formatDate:value=>formatDateValue(value,"de"),
  formatDateTime:value=>formatDateTimeValue(value,"de"),
  formatTime:value=>formatTimeValue(value,"de"),
  formatNumber:value=>formatNumberValue(value,"de"),
  formatCurrency:(value,currency)=>formatCurrencyValue(value,"de",currency)
});

export function useLocale(){return useContext(LocaleContext)}

function subscribeLocale(onStoreChange:()=>void){
 const unsubscribeLocale=subscribeAppEvent(appEvents.localeChanged,()=>onStoreChange());
 const onStorage=(event:StorageEvent)=>{if(event.key===storageKeys.locale)onStoreChange()};
 window.addEventListener("storage",onStorage);
 return()=>{unsubscribeLocale();window.removeEventListener("storage",onStorage)};
}
function getServerLocale():Locale{return "de"}

export default function LocaleProvider({children}:{children:React.ReactNode}){
  // useSyncExternalStore gives React a deterministic SSR snapshot and switches to
  // the persisted/browser locale only after hydration, without DOM mutation or
  // synchronous setState inside an effect.
  const locale=useSyncExternalStore(subscribeLocale,getLocale,getServerLocale);

  useEffect(()=>{document.documentElement.lang=locale==="de"?"de-CH":locale},[locale]);

  const value=useMemo<LocaleContextValue>(()=>({
    locale,
    setLocale:(next)=>persistLocale(next),
    t:(text)=>translate(text,locale),
    formatDate:(input,options)=>formatDateValue(input,locale,options),
    formatDateTime:(input,options)=>formatDateTimeValue(input,locale,options),
    formatTime:(input,options)=>formatTimeValue(input,locale,options),
    formatNumber:(input,options)=>formatNumberValue(input,locale,options),
    formatCurrency:(input,currency="CHF",options)=>formatCurrencyValue(input,locale,currency,options)
  }),[locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function LanguageSwitcher({compact=false}:{compact?:boolean}){
  const {locale,setLocale,t}=useLocale();
  return <label className={compact?"language-switcher compact":"language-switcher"} aria-label={t("Sprache")}>
    {!compact&&<span>{t("Sprache")}</span>}
    <select aria-label={t("Sprache")} value={locale} onChange={event=>setLocale(event.target.value as Locale)}>
      {(Object.keys(localeLabels) as Locale[]).map(item=><option value={item} key={item}>{compact?localeLabels[item]:localeNames[item]}</option>)}
    </select>
  </label>;
}
