"use client";
import {useEffect,useState} from "react";
import {useLocale} from "@/components/locale-provider";
import {appEvents,emitAppEvent,subscribeAppEvent} from "@/lib/client/app-events";
export default function PwaUpdateNotice(){const {t}=useLocale();const [ready,setReady]=useState(false);useEffect(()=>subscribeAppEvent(appEvents.pwaUpdateAvailable,()=>setReady(true)),[]);if(!ready)return null;return <div className="pwa-update-notice" role="status"><span>{t("Neue Version verfügbar.")}</span><button type="button" onClick={()=>emitAppEvent(appEvents.pwaApplyUpdate)}>{t("Aktualisieren")}</button></div>}
