"use client";

import {LocalizedText,LocalizedElement} from "@/lib/client/locale";
import {Children,cloneElement,isValidElement,Fragment,useEffect,useRef,type ReactNode} from "react";
import {Button,FormActions,FormSection} from "./ui";

/** Keeps every step mounted: a step change never changes drafts or navigation. */
export function FormWizard({labels,step,onStep,children,action,cancelAction,busy=false,guided=true,backLabel="Zurück",nextLabel="Weiter",progressLabel,ariaLabel="Geführte Erfassung"}:{labels:string[];step:number;onStep:(step:number)=>void;children:ReactNode;action:ReactNode;cancelAction:ReactNode;busy?:boolean;guided?:boolean;backLabel?:string;nextLabel?:string;progressLabel?:(step:number,total:number,label:string)=>string;ariaLabel?:string}){
 const rootRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const root=rootRef.current;if(!guided||!root||root.closest('.bottom-sheet'))return;
  const viewport=window.visualViewport;
  const header=document.querySelector(window.innerWidth<=760?'.mobile-header':'.desktop-appbar');
  const update=()=>{
   // Session initialization mounts forms before the frame becomes visible.
   // A hidden rectangle cannot define the available viewport height.
   if(!root.getClientRects().length)return;
   const top=Math.max(root.getBoundingClientRect().top,header?.getBoundingClientRect().bottom??0);
   const container=root.closest('.page-container');
   const bottomInset=container?parseFloat(getComputedStyle(container).paddingBottom)||0:0;
   root.style.setProperty('--wizard-height',`${Math.max(0,(viewport?.height??window.innerHeight)+(viewport?.offsetTop??0)-top-bottomInset)}px`);
  };
  let frame=0;
  const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{
   update();
   const focused=document.activeElement;
   if(focused instanceof HTMLElement&&root.contains(focused)&&focused.matches('input,select,textarea'))focused.scrollIntoView({block:'nearest'});
  })};
  const observer=new ResizeObserver(schedule);
  observer.observe(root);if(root.parentElement)observer.observe(root.parentElement);if(header)observer.observe(header);
  update();root.addEventListener('focusin',schedule);window.addEventListener('resize',schedule);viewport?.addEventListener('resize',schedule);viewport?.addEventListener('scroll',schedule);
  return()=>{root.removeEventListener('focusin',schedule);observer.disconnect();cancelAnimationFrame(frame);window.removeEventListener('resize',schedule);viewport?.removeEventListener('resize',schedule);viewport?.removeEventListener('scroll',schedule);root.style.removeProperty('--wizard-height')};
 },[guided]);
 const valid=()=>{
  const invalid=Array.from(rootRef.current?.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>('input,select,textarea')??[]).find(el=>(el.getClientRects().length||el.matches("select[data-app-select]")&&el.closest(".app-select-control")?.getClientRects().length)&&!el.disabled&&!el.checkValidity());
  // checkValidity already dispatches Field's inline error. Keep focus on that
  // control without adding a native validation popover over the sheet footer.
  if(invalid){invalid.focus({preventScroll:true});invalid.scrollIntoView({block:'nearest'});return false;}
  return true;
 };
 const go=(next:number)=>{
  if(next>step&&!valid())return;
  if(busy||next<0||next>=labels.length)return;
  onStep(next);rootRef.current?.querySelector(".wizard-content")?.scrollTo({top:0});
  requestAnimationFrame(()=>{const content=rootRef.current?.querySelector<HTMLElement>(".wizard-content");if(content){content.tabIndex=-1;content.focus({preventScroll:true});}});
 };
 return <LocalizedElement as="div" ref={rootRef} className="form-wizard" data-guided={guided?"true":undefined} aria-label={ariaLabel}>
  {guided&&<div className="wizard-progress" role="status"><LocalizedText>{progressLabel?progressLabel(step+1,labels.length,labels[step]):`Schritt ${step+1} von ${labels.length} · ${labels[step]}`}</LocalizedText></div>}
  <div className="wizard-content">{Children.map(children,child=>guided&&isValidElement<{title?:string}>(child)&&child.type===FormSection&&child.props.title===labels[step]?cloneElement(child,{title:undefined}):child)}</div>
  <FormActions onClickCapture={event=>{
   const button=event.target instanceof Element?event.target.closest('button.button-primary'):null;
   // Prevent a step transition from acquiring native submit semantics in the same click.
   if(button&&guided&&step<labels.length-1)event.preventDefault();
   if(button&&(!guided||step===labels.length-1)&&!valid()){event.preventDefault();event.stopPropagation();}
  }}>{!guided?cancelAction:(step===0?cancelAction:<Button variant="secondary" disabled={busy} onClick={()=>go(step-1)}><LocalizedText>{backLabel}</LocalizedText></Button>)}{!guided||step===labels.length-1?<Fragment key="wizard-submit">{action}</Fragment>:<Button key="wizard-next" disabled={busy} onClick={()=>go(step+1)}><LocalizedText>{nextLabel}</LocalizedText></Button>}</FormActions>
 </LocalizedElement>;
}
