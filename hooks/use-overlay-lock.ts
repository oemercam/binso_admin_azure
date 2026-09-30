"use client";

import {useEffect} from "react";

let lockCount=0;
let previousBodyOverflow="";
let previousHtmlOverflow="";
let previousBodyOverscroll="";

export function useOverlayLock(open:boolean){
 useEffect(()=>{
  if(!open)return;
  if(lockCount===0){
   previousBodyOverflow=document.body.style.overflow;
   previousHtmlOverflow=document.documentElement.style.overflow;
   previousBodyOverscroll=document.body.style.overscrollBehavior;
   document.documentElement.classList.add("binso-overlay-open");
   document.body.classList.add("binso-overlay-open");
   document.documentElement.style.overflow="hidden";
   document.body.style.overflow="hidden";
   document.body.style.overscrollBehavior="none";
  }
  lockCount+=1;
  return()=>{
   lockCount=Math.max(0,lockCount-1);
   if(lockCount===0){
    document.documentElement.classList.remove("binso-overlay-open");
    document.body.classList.remove("binso-overlay-open");
    document.documentElement.style.overflow=previousHtmlOverflow;
    document.body.style.overflow=previousBodyOverflow;
    document.body.style.overscrollBehavior=previousBodyOverscroll;
   }
  };
 },[open]);
}
