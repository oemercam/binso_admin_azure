"use client";
import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
export default function ErrorPage({error,reset}:{error:Error&{digest?:string};reset:()=>void}){
 useEffect(()=>{console.error(error)},[error]);
 return <main className="system-page"><div className="system-card"><div className="system-icon danger"><AlertTriangle/></div><div className="system-code">500</div><h1>Etwas ist schiefgelaufen</h1><p>Die Anwendung konnte diese Ansicht nicht laden. Bitte versuchen Sie es erneut.</p>{error.digest&&<small>Referenz: {error.digest}</small>}<div className="system-actions"><button className="primary-inline" onClick={reset}><RotateCcw size={16}/> Erneut versuchen</button><Link href="/dashboard" className="secondary-button">Zurück zum Dashboard</Link></div></div></main>
}
