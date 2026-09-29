"use client";
export default function GlobalError({reset}:{error:Error&{digest?:string};reset:()=>void}){
 return <html><body><main className="system-page"><div className="system-card"><div className="system-code">500</div><h1>Etwas ist schiefgelaufen</h1><p>Binso One konnte nicht vollständig geladen werden.</p><button className="primary-inline" onClick={reset}>Erneut versuchen</button></div></main></body></html>
}
