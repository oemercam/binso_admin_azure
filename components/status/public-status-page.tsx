"use client";
import StatusClient from "@/components/status/status-client";
import {useLocale} from "@/components/locale-provider";

export default function PublicStatusPage(){
 const {t}=useLocale();
 return <section className="legal-main status-public-page">
  <div className="legal-kicker">Binso One · {t("Status")}</div>
  <h1>{t("Systemstatus")}</h1>
  <p className="legal-lead">{t("Aktueller Zustand der wichtigsten Binso-One-Dienste.")}</p>
  <StatusClient/>
 </section>;
}
