"use client";
import {useConnectivity} from "@/hooks/use-connectivity";
export default function ConnectivityBanner(){const state=useConnectivity();if(state==="online")return null;return <div className={`connectivity-banner ${state}`} role="status" aria-live="polite">{state==="offline"?"Keine Internetverbindung. Einige Funktionen sind momentan nicht verfügbar.":"Verbindung wird wiederhergestellt …"}</div>}
