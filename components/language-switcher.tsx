"use client";
import {localeLabels,locales,type AppLocale} from "@/lib/i18n/config";
import {useI18n} from "@/lib/i18n/provider";

export function LanguageSwitcher({compact=false}:{compact?:boolean}){
 const {locale,setLocale,messages}=useI18n();
 return <label className={"language-switcher"+(compact?" is-compact":"")}>
   <span className="sr-only">{messages.common.language}</span>
   <select aria-label={messages.common.language} value={locale} onChange={event=>setLocale(event.target.value as AppLocale)}>
     {locales.map(code=><option key={code} value={code}>{localeLabels[code]}</option>)}
   </select>
 </label>;
}
