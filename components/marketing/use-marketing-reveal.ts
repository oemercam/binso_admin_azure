"use client";

import {useEffect} from "react";

export function useMarketingReveal(){
 useEffect(()=>{
  const root=document.querySelector<HTMLElement>(".marketing-shell");
  if(!root)return;
  const items=Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
  if(!items.length)return;
  const reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(reduce){items.forEach(item=>item.classList.add("is-visible"));return}
  const observer=new IntersectionObserver(entries=>{
   for(const entry of entries){
    if(!entry.isIntersecting)continue;
    const el=entry.target as HTMLElement;
    el.classList.add("is-visible");
    observer.unobserve(el);
   }
  },{rootMargin:"0px 0px -8% 0px",threshold:.12});
  items.forEach(item=>observer.observe(item));
  return()=>observer.disconnect();
 },[]);
}
