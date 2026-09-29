"use client";
import Link from "next/link";
import {useSearchParams} from "next/navigation";
import {ArrowLeft,LockKeyhole} from "lucide-react";
import {useLocale} from "@/components/locale-provider";

export default function UpgradePage(){
 const params=useSearchParams();
 const {t}=useLocale();
 const next=params.get("next")||"/dashboard";
 return <div className="system-page"><section className="system-card plan-gate-card"><div className="system-icon"><LockKeyhole size={24}/></div><div className="system-code">PLAN</div><h1>{t("In deinem Plan nicht enthalten")}</h1><p>{t("Diese Funktion ist mit deinem aktuellen Binso-One-Plan nicht verfügbar. Du kannst deinen Plan unter Plan und Abrechnung ändern.")}</p><div className="system-actions"><Link className="secondary-button" href="/dashboard"><ArrowLeft size={16}/>{t("Zum Dashboard")}</Link><Link className="primary-button" href={`/abo?next=${encodeURIComponent(next)}`}>{t("Plan und Abrechnung")}</Link></div></section></div>
}
