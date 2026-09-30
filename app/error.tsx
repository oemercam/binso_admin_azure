"use client";
import {useEffect} from "react";
import {ButtonLink} from "@/components/ui/button-link";
import {Button} from "@/components/ui/button";
import {AlertTriangle,RotateCcw} from "lucide-react";
import {useLocale} from "@/components/locale-provider";
export default function ErrorPage({error,reset}:{error:Error&{digest?:string};reset:()=>void}){
 const {t}=useLocale();
 useEffect(()=>{console.error(error)},[error]);
 return <main className="system-page"><div className="system-card"><div className="system-icon danger"><AlertTriangle/></div><div className="system-code">500</div><h1>{t("Etwas ist schiefgelaufen")}</h1><p>{t("Die Anwendung konnte diese Ansicht nicht laden. Bitte versuchen Sie es erneut.")}</p>{error.digest&&<small>{t("Referenz")}: {error.digest}</small>}<div className="system-actions"><Button icon={<RotateCcw size={16}/>} onClick={reset}>{t("Erneut versuchen")}</Button><ButtonLink href="/dashboard" variant="secondary">{t("Zurück zum Dashboard")}</ButtonLink></div></div></main>;
}
