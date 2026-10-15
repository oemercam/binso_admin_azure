"use client";
import "./binso-ui.css";
import {useSyncExternalStore} from "react";
import {asLocale,localeCookie,localeTags} from "@/lib/locales/config";
import {Button,Logo} from "@/components/ui";
import {LocaleProvider,LocalizedText} from "@/lib/client/locale";
/** Independent of the failed root layout and its providers. */
export default function GlobalError({reset}:{error:Error & {digest?:string};reset:()=>void}){
 const locale=useSyncExternalStore(()=>()=>{},()=>asLocale(document.cookie.split(";").map(part=>part.trim()).find(part=>part.startsWith(localeCookie+"="))?.slice(localeCookie.length+1)),()=>"de" as const);
 return <html lang={localeTags[locale]}><body><LocaleProvider key={locale} initialLocale={locale}><main className="auth-page"><section className="auth-card error-state"><Logo/><h1><LocalizedText>{"Etwas ist schiefgelaufen"}</LocalizedText></h1><p><LocalizedText>{"Die Seite konnte nicht vollständig geladen werden."}</LocalizedText></p><Button onClick={reset}><LocalizedText>{"Erneut versuchen"}</LocalizedText></Button><Button href="/" variant="secondary"><LocalizedText>{"Zur Website"}</LocalizedText></Button></section></main></LocaleProvider></body></html>;
}
