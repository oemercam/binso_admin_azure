"use client";
import Link from "next/link";
import {Check} from "lucide-react";
import {useEffect,useRef} from "react";
import {plans} from "@/lib/plans";
import {useLocale} from "@/components/locale-provider";

export default function PricingCarousel({registerBase="/portal/registrieren"}:{registerBase?:string}){
 const {t}=useLocale();
 const gridRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const grid=gridRef.current;
  if(!grid||!window.matchMedia("(max-width: 600px)").matches)return;
  const business=grid.querySelector<HTMLElement>('[data-plan="business"]');
  const id=window.requestAnimationFrame(()=>business?.scrollIntoView({behavior:"auto",block:"nearest",inline:"center"}));
  return()=>window.cancelAnimationFrame(id);
 },[]);
 return <div className="pricing-carousel-shell">
  <div className="pricing-grid pricing-carousel" ref={gridRef} aria-label={t("Preispläne")}>
   {plans.map(p=><article data-plan={p.id} key={p.id} className={p.popular?"pricing-card popular":"pricing-card"}>
    {p.popular&&<div className="popular-badge">{t("Empfohlen")}</div>}
    <h3>{p.name}</h3>
    <p>{t(p.description)}</p>
    <div className="price"><strong>CHF {p.monthly}</strong><span>/ {t("Monat")}</span></div>
    <Link className={p.popular?"marketing-primary plan-button":"marketing-secondary plan-button"} href={`${registerBase}?plan=${p.id}`}>{p.name} {t("wählen")}</Link>
    <div className="plan-features">{p.features.map(f=><span key={f}><Check size={15}/>{t(f)}</span>)}</div>
   </article>)}
  </div>
  <div className="pricing-swipe-hint" aria-hidden="true"><span/><span className="active"/><span/></div>
 </div>;
}
