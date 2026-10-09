"use client";

import {useEffect,useRef,useState,type ReactNode} from "react";
import {createPortal} from "react-dom";
import {useDialogFocus} from "./use-dialog-focus";
import {IconButton} from "./ui";

export type HeaderPanelKind="search"|"notifications"|"account";

/** All global header interactions share this anchored modal and viewport contract. */
export function HeaderPanel({kind,label,onClose,children,headerSelector,backgroundSelector=".page-container,.app-sidebar,.bottom-nav"}:{kind:HeaderPanelKind;label:string;onClose:()=>void;children:ReactNode;headerSelector?:string;backgroundSelector?:string}){
 const dialog=useDialogFocus(true,onClose,true,headerSelector);
 const trigger=useRef<HTMLElement|null>(typeof document!=="undefined"&&document.activeElement instanceof HTMLElement?document.activeElement:null);
 const [placement,setPlacement]=useState({top:64,right:16});
 useEffect(()=>{
  const elements=Array.from(document.querySelectorAll<HTMLElement>(backgroundSelector));
  const previous=elements.map(element=>element.inert);
  elements.forEach(element=>{element.inert=true});
  return()=>elements.forEach((element,index)=>{element.inert=previous[index]});
 },[backgroundSelector]);
 useEffect(()=>{
  const update=()=>{
   const mobile=window.innerWidth<=760;
   const header=document.querySelector(headerSelector??(mobile?".mobile-header":".desktop-appbar"));
   const rect=header?.getBoundingClientRect();
   const anchor=trigger.current?.getBoundingClientRect();
   setPlacement({top:Math.max(0,rect?.bottom??64),right:mobile?0:Math.max(16,window.innerWidth-(anchor?.right??window.innerWidth-16))});
  };
  update();window.addEventListener("resize",update);window.visualViewport?.addEventListener("resize",update);
  const closeForModal=()=>onClose();window.addEventListener("binso-modal-open",closeForModal);
  return()=>{window.removeEventListener("resize",update);window.visualViewport?.removeEventListener("resize",update);window.removeEventListener("binso-modal-open",closeForModal)};
 },[onClose,headerSelector]);
 return createPortal(<div className="header-panel-layer" style={{"--header-panel-top":`${placement.top}px`,"--header-panel-right":`${placement.right}px`} as React.CSSProperties} onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}>
  <section ref={dialog} className={`header-panel header-panel-${kind}`} tabIndex={-1} role="dialog" aria-modal="true" aria-label={label}>
   <header className="header-panel-heading"><h2>{label}</h2><IconButton label="Schliessen" icon="close" onClick={onClose}/></header>
   {children}
  </section>
 </div>,document.body);
}
