"use client";
import {FontPreload} from "@/components/font-preload";
import "./binso-ui.css";
import {useSyncExternalStore} from "react";
import {asLocale,localeCookie,localeTags} from "@/lib/locales/config";
import {PrivacyConsent} from '@/components/privacy-consent';
import {SystemState} from "@/components/system-state";
import {LocaleProvider} from "@/lib/client/locale";
import {initializeTheme} from "@/lib/theme";
import {ThemeRuntime} from "@/components/theme-runtime";
/** Independent of the failed root layout and its providers. */
export default function GlobalError({error,reset}:{error:Error & {digest?:string};reset:()=>void}){
 const locale=useSyncExternalStore(()=>()=>{},()=>asLocale(document.cookie.split(";").map(part=>part.trim()).find(part=>part.startsWith(localeCookie+"="))?.slice(localeCookie.length+1)),()=>"de" as const);
 return <html lang={localeTags[locale]} suppressHydrationWarning><head><FontPreload/><title>Binso One</title><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/><meta name="theme-color" content="#ffffff"/><script id="binso-theme-init" dangerouslySetInnerHTML={{__html:`(${initializeTheme.toString()})();`}}/></head><body><ThemeRuntime/><LocaleProvider key={locale} initialLocale={locale}><div id="binso-page-content"><SystemState title="Etwas ist schiefgelaufen" description="Die Seite konnte nicht vollständig geladen werden." reference={error.digest} onRetry={reset}/></div><PrivacyConsent/></LocaleProvider></body></html>;
}
