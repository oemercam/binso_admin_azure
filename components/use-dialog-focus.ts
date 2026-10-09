"use client";

import { useEffect, useRef } from "react";

/** Keep modal keyboard navigation inside the dialog and restore its trigger. */
const modalStack:HTMLElement[]=[];
let savedOverflow="",savedRootOverflow="",savedScrollX=0,savedScrollY=0;

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
    if(!modalStack.length){savedOverflow=document.body.style.overflow;savedRootOverflow=document.documentElement.style.overflow;savedScrollX=window.scrollX;savedScrollY=window.scrollY;}
    modalStack.push(dialog);
    if(!headerPanel)window.dispatchEvent(new Event("binso-modal-open"));
    const active = document.activeElement;
    const trigger = active instanceof HTMLElement && !dialog.contains(active) ? active : triggerRef.current;
    // clip prevents a new body scroll container from breaking sticky app headers.
    document.body.style.overflow = "clip";
    document.documentElement.style.overflow = "hidden";
    const viewport=window.visualViewport;
    const resize=()=>{
      document.documentElement.style.setProperty("--dialog-viewport-height",`${viewport?.height??window.innerHeight}px`);
      document.documentElement.style.setProperty("--dialog-viewport-top",`${viewport?.offsetTop??0}px`);
      const focused=document.activeElement;
      if(focused instanceof HTMLElement&&dialog.contains(focused))focused.scrollIntoView({block:"nearest"});
    };
    resize();viewport?.addEventListener("resize",resize);viewport?.addEventListener("scroll",resize);
    const controls = () => Array.from(dialog.querySelectorAll<HTMLElement>(
      'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
    )).filter(element => element.getClientRects().length > 0 && !element.closest('[hidden],[inert]'));
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
      if (event.target instanceof Node && !dialog.contains(event.target)) (controls()[0] ?? dialog).focus({preventScroll:true});
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("focusin", onFocus);
    return () => {
      const index=modalStack.indexOf(dialog);if(index>=0)modalStack.splice(index,1);
      viewport?.removeEventListener("resize",resize);viewport?.removeEventListener("scroll",resize);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("focusin", onFocus);
      if(modalStack.length&&trigger?.isConnected&&modalStack.at(-1)?.contains(trigger))trigger.focus({preventScroll:true});
      if(!modalStack.length){
        document.documentElement.style.removeProperty("--dialog-viewport-height");document.documentElement.style.removeProperty("--dialog-viewport-top");
        document.body.style.overflow = savedOverflow;
        document.documentElement.style.overflow = savedRootOverflow;
        if (trigger?.isConnected) trigger.focus({preventScroll:true});
        window.scrollTo(savedScrollX,savedScrollY);
      }
    };
  }, [open,headerPanel,headerSelector]);
  return dialogRef;
}
