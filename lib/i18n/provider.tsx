"use client";
import {createContext,useCallback,useContext,useEffect,useMemo,useState} from "react";
import {defaultLocale,localeTags,type AppLocale} from "./config";
import {getMessages,type Messages} from "./messages";
type I18nContextValue={locale:AppLocale;messages:Messages;setLocale:(locale:AppLocale)=>void};
const I18nContext=createContext<I18nContextValue|null>(null);
export function I18nProvider({children,initialLocale=defaultLocale}:{children:React.ReactNode;initialLocale?:AppLocale}){
 const [locale,setLocaleState]=useState<AppLocale>(initialLocale);
 useEffect(()=>{document.documentElement.lang=localeTags[locale];document.documentElement.dir="ltr";window.localStorage.setItem("binso.locale",locale);},[locale]);
 const setLocale=useCallback((next:AppLocale)=>{setLocaleState(next);document.cookie=`binso_locale=${next}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`;},[]);
 const value=useMemo(()=>({locale,messages:getMessages(locale),setLocale}),[locale,setLocale]);
 return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
export function useI18n(){const value=useContext(I18nContext);if(!value)throw new Error("useI18n must be used inside I18nProvider");return value;}
