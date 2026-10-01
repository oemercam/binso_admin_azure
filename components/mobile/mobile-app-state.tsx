"use client";
import Link from "next/link";
import {AlertCircle,CheckCircle2,FileText,RefreshCw,TriangleAlert,WifiOff} from "lucide-react";
import {useLocale} from "@/components/locale-provider";

export function MobileSkeleton({rows=5}:{rows?:number}){
 const {t}=useLocale();
 return <div className="mobile-state-skeleton" role="status" aria-label={t("Ansicht wird geladen")}>{Array.from({length:rows},(_,i)=><div className="mobile-skeleton-row" key={i}><span/><div><i/><i/></div></div>)}</div>;
}

export function MobileEmptyState({title,text,actionLabel,href}:{title:string;text:string;actionLabel?:string;href?:string}){
 return <section className="mobile-state mobile-empty-state"><div className="mobile-state-icon"><FileText size={24}/></div><h2>{title}</h2><p>{text}</p>{actionLabel&&href&&<Link className="mobile-state-action" href={href}>{actionLabel}</Link>}</section>;
}

export function MobileErrorState({title,text,onRetry}:{title:string;text:string;onRetry?:()=>void}){
 const {t}=useLocale();
 return <section className="mobile-state mobile-error-state" role="alert"><div className="mobile-state-icon"><AlertCircle size={24}/></div><h2>{title}</h2><p>{text}</p>{onRetry&&<button className="mobile-state-action" type="button" onClick={onRetry}><RefreshCw size={15}/>{t("Erneut versuchen")}</button>}</section>;
}

export function MobileOfflineState(){const {t}=useLocale();return <section className="mobile-state mobile-offline-state"><div className="mobile-state-icon"><WifiOff size={24}/></div><h2>{t("Offline")}</h2><p>{t("Keine Verbindung. Bereits geladene Inhalte bleiben verfügbar.")}</p></section>}

export function MobileFeedback({tone,title,text}:{tone:"success"|"warning"|"danger"|"info";title:string;text:string}){
 const Icon=tone==="success"?CheckCircle2:tone==="warning"?TriangleAlert:AlertCircle;
 return <div className={`mobile-feedback mobile-feedback-${tone}`} role={tone==="danger"?"alert":"status"}><Icon size={18}/><span><strong>{title}</strong><small>{text}</small></span></div>;
}
