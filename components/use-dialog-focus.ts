"use client";

import { useEffect, useRef } from "react";
import {lockPageScroll} from './page-scroll-lock';

/** Keep modal keyboard navigation inside the dialog and restore its trigger. */
const modalStack:HTMLElement[]=[];
const dialogPortals=new Map<HTMLElement,HTMLElement>();
/** Only a control inside an existing modal can register its own focus surface. */
export function registerDialogPortal(trigger:HTMLElement|null,portal:HTMLElement|null){
 const owner=trigger?[...modalStack].reverse().find(dialog=>dialog.contains(trigger)):undefined;
 if(!owner||!portal)return()=>{};
 dialogPortals.set(portal,owner);return()=>{dialogPortals.delete(portal)};
}
const backgroundLocks=new Map<HTMLElement,{count:number;previous:boolean}>();
const coveredSheets=new Map<HTMLElement,{count:number;previous:boolean}>();
/** Keep a parent editor mounted, but show only the active child sheet. */
function coverParentSheets(dialog:HTMLElement){
 if(!dialog.matches('.bottom-sheet'))return()=>{};
 const layers=Array.from(document.querySelectorAll<HTMLElement>('.sheet-layer')).filter(layer=>!layer.contains(dialog));
 for(const layer of layers){const lock=coveredSheets.get(layer)??{count:0,previous:layer.hasAttribute('data-sheet-covered')};lock.count++;coveredSheets.set(layer,lock);layer.setAttribute('data-sheet-covered','');}
 return()=>{for(const layer of layers){const lock=coveredSheets.get(layer);if(lock&&--lock.count===0){layer.toggleAttribute('data-sheet-covered',lock.previous);coveredSheets.delete(layer);}}};
}
/** Nested modals share background ownership; closing one cannot expose another's page. */
function lockDialogBackground(dialog:HTMLElement){
 const targets=Array.from(document.body.children).filter((element):element is HTMLElement=>element instanceof HTMLElement&&!element.contains(dialog)&&!["SCRIPT","STYLE","LINK","TEMPLATE"].includes(element.tagName));
 for(const element of targets){const lock=backgroundLocks.get(element)??{count:0,previous:element.inert};lock.count++;backgroundLocks.set(element,lock);element.inert=true;}
 return()=>{for(const element of targets){const lock=backgroundLocks.get(element);if(!lock)continue;if(--lock.count===0){element.inert=lock.previous;backgroundLocks.delete(element);}}};
}
/** Header shortcuts never stack a second panel over an active non-header modal. */
export function hasBlockingModal(){return modalStack.some(dialog=>dialog.isConnected&&!dialog.matches(".header-panel"));}

export function useDialogFocus(open: boolean, onClose: () => void, headerPanel=false, headerSelector=".mobile-header,.desktop-appbar") {
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  const triggerRef = useRef<HTMLElement|null>(null);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    if(open)return;
    const rememberTrigger = () => {
      const active = document.activeElement;
      if(active instanceof HTMLElement && !active.closest('[aria-modal="true"]') && !dialogRef.current?.contains(active)) triggerRef.current = active;
    };
    rememberTrigger();
    document.addEventListener("focusin", rememberTrigger);
    return () => document.removeEventListener("focusin", rememberTrigger);
  }, [open]);
  useEffect(() => {
    if (!open || !dialogRef.current) return;
    const dialog = dialogRef.current;
    const unlockScroll=lockPageScroll(()=>dialog);
    const unlockBackground=headerPanel?()=>{}:lockDialogBackground(dialog);
    const uncoverSheets=coverParentSheets(dialog);
    modalStack.push(dialog);
    if(!headerPanel)document.documentElement.dataset.modalOverlay="true";
    if(!headerPanel)window.dispatchEvent(new Event("binso-modal-open"));
    const active = document.activeElement;
    const trigger = active instanceof HTMLElement && !dialog.contains(active) ? active : triggerRef.current;
    // clip prevents a new body scroll container from breaking sticky app headers.
    const viewport=window.visualViewport;
    let resizeFrame=0;
    const resize=()=>{
      document.documentElement.style.setProperty("--dialog-viewport-height",`${viewport?.height??window.innerHeight}px`);
      document.documentElement.style.setProperty("--dialog-viewport-top",`${viewport?.offsetTop??0}px`);
      cancelAnimationFrame(resizeFrame);
      resizeFrame=requestAnimationFrame(()=>{
       const focused=document.activeElement;
       if(!(focused instanceof HTMLElement)||!dialog.contains(focused)||!focused.matches('input,select,textarea,[contenteditable="true"]'))return;
       const field=focused.getBoundingClientRect(),body=focused.closest('.sheet-body,.sheet-form-content')?.getBoundingClientRect();
       const top=Math.max(viewport?.offsetTop??0,body?.top??0),bottom=Math.min((viewport?.offsetTop??0)+(viewport?.height??window.innerHeight),body?.bottom??Infinity);
       if(field.top<top||field.bottom>bottom)focused.scrollIntoView({block:"nearest",behavior:"instant"});
      });
    };
    resize();viewport?.addEventListener("resize",resize);viewport?.addEventListener("scroll",resize);
    const roots=()=>[dialog,...[...dialogPortals].filter(([,owner])=>owner===dialog).map(([portal])=>portal)];
    const controls = () => roots().flatMap(root=>Array.from(root.querySelectorAll<HTMLElement>(
      'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
    ))).filter(element => element.getClientRects().length > 0 && !element.closest('[hidden],[inert],[aria-hidden="true"]'));
    if(!dialog.contains(document.activeElement)) (controls()[0] ?? dialog).focus({preventScroll:true});
    const onKey = (event: KeyboardEvent) => {
      if(modalStack.at(-1)!==dialog)return;
      if (event.key === "Escape") { event.preventDefault(); closeRef.current(); return; }
      if (event.key !== "Tab") return;
      const items = controls();
      const first = items[0], last = items.at(-1);
      if (!first || !last) { event.preventDefault(); dialog.focus({preventScroll:true}); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault(); last.focus({preventScroll:true});
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) {
        event.preventDefault(); first.focus({preventScroll:true});
      }
    };
    const onFocus = (event: FocusEvent) => {
      if(modalStack.at(-1)!==dialog)return;
      if(headerPanel&&event.target instanceof Element&&event.target.closest(headerSelector))return;
      if (event.target instanceof Node && !roots().some(root=>root.contains(event.target as Node))) (controls()[0] ?? dialog).focus({preventScroll:true});
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("focusin", onFocus);
    return () => {
      const index=modalStack.indexOf(dialog);if(index>=0)modalStack.splice(index,1);
      unlockBackground();
      uncoverSheets();
      cancelAnimationFrame(resizeFrame);
      if(!modalStack.some(item=>!item.matches(".header-panel")))delete document.documentElement.dataset.modalOverlay;
      viewport?.removeEventListener("resize",resize);viewport?.removeEventListener("scroll",resize);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("focusin", onFocus);
      if(modalStack.length&&trigger?.isConnected&&modalStack.at(-1)?.contains(trigger))trigger.focus({preventScroll:true});
      if(!modalStack.length){
        document.documentElement.style.removeProperty("--dialog-viewport-height");document.documentElement.style.removeProperty("--dialog-viewport-top");
        // An action menu may unmount its row after opening the next sheet.
        // Retain the last stable page trigger for that modal handoff.
        const returnTrigger=trigger?.isConnected?trigger:triggerRef.current;
        if (returnTrigger?.isConnected) returnTrigger.focus({preventScroll:true});
      }
      unlockScroll();
    };
  }, [open,headerPanel,headerSelector]);
  return dialogRef;
}
