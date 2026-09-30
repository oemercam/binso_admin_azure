"use client";
import {Button} from "@/components/ui/button";
import {getLocale,tr} from "@/lib/i18n";
export default function GlobalError({reset}:{error:Error&{digest?:string};reset:()=>void}){
 const locale=getLocale();
 return <html lang={locale==="de"?"de-CH":locale}><body><main className="system-page"><div className="system-card"><div className="system-code">500</div><h1>{tr("Etwas ist schiefgelaufen",locale)}</h1><p>{tr("Binso One konnte nicht vollständig geladen werden.",locale)}</p><Button onClick={reset}>{tr("Erneut versuchen",locale)}</Button></div></main></body></html>
}
