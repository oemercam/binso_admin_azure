"use client";

import Link from "next/link";
import {Check} from "lucide-react";
import {useEffect,useRef,useState} from "react";
import {plans} from "@/lib/plans";
import {useLocale} from "@/components/locale-provider";

export default function PricingCarousel({registerBase="/portal/registrieren"}:{registerBase?:string}){
 const {t}=useLocale();
 const gridRef=useRef<HTMLDivElement>(null);
 const [activePlan,setActivePlan]=useState("business");

 useEffect(()=>{
  const grid=gridRef.current;
  if(!grid)return;
  const media=window.matchMedia("(max-width: 760px)");
  if(!media.matches)return;
  const centerBusiness=()=>{
    const business=grid.querySelector<HTMLElement>('[data-plan="business"]');
    if(!business)return;
    const left=business.offsetLeft-(grid.clientWidth-business.clientWidth)/2;
    grid.scrollTo({left:Math.max(0,left),behavior:"auto"});
  };
  const frame=window.requestAnimationFrame(centerBusiness);
  return()=>window.cancelAnimationFrame(frame);
 },[]);

 useEffect(()=>{
  const grid=gridRef.current;
  if(!grid)return;
  let frame=0;
  const update=()=>{
    window.cancelAnimationFrame(frame);
    frame=window.requestAnimationFrame(()=>{
      const center=grid.scrollLeft+grid.clientWidth/2;
      let current="business";
      let distance=Number.POSITIVE_INFINITY;
      grid.querySelectorAll<HTMLElement>("[data-plan]").forEach(card=>{
        const cardCenter=card.offsetLeft+card.clientWidth/2;
        const next=Math.abs(cardCenter-center);
        if(next<distance){distance=next;current=card.dataset.plan||current}
      });
      setActivePlan(current);
    });
  };
  grid.addEventListener("scroll",update,{passive:true});
  return()=>{grid.removeEventListener("scroll",update);window.cancelAnimationFrame(frame)};
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
  <div className="pricing-swipe-hint" aria-hidden="true">{plans.map(p=><span key={p.id} className={activePlan===p.id?"active":""}/>)}</div>
 </div>;
}
