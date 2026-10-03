"use client";
import {createContext,useCallback,useContext,useEffect,useMemo,useState} from "react";
import {defaultLocale,localeTags,normalizeLocale,type AppLocale} from "./config";
import {getMessages,type Messages} from "./messages";
type I18nContextValue={locale:AppLocale;messages:Messages;setLocale:(locale:AppLocale)=>void};
const I18nContext=createContext<I18nContextValue|null>(null);
export function I18nProvider({children}:{children:React.ReactNode}){
 const [locale,setLocaleState]=useState<AppLocale>(()=>{if(typeof window==="undefined")return defaultLocale;const saved=window.localStorage.getItem("binso.locale");const browser=navigator.languages?.[0]??navigator.language;return normalizeLocale(saved||browser);});
 useEffect(()=>{document.documentElement.lang=localeTags[locale];document.documentElement.dir="ltr";},[locale]);
 const setLocale=useCallback((next:AppLocale)=>{setLocaleState(next);window.localStorage.setItem("binso.locale",next);document.cookie=`binso_locale=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;},[]);
 const value=useMemo(()=>({locale,messages:getMessages(locale),setLocale}),[locale,setLocale]);
 return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
export function useI18n(){const value=useContext(I18nContext);if(!value)throw new Error("useI18n must be used inside I18nProvider");return value;}