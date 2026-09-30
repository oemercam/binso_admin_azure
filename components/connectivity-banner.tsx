"use client";
import {useConnectivity} from "@/hooks/use-connectivity";
import {useLocale} from "@/components/locale-provider";
export default function ConnectivityBanner(){const state=useConnectivity();const {t}=useLocale();if(state==="online")return null;return <div className={`connectivity-banner ${state}`} role="status" aria-live="polite">{t(state==="offline"?"Keine Internetverbindung. Einige Funktionen sind momentan nicht verfügbar.":"Verbindung wird wiederhergestellt …")}</div>}
