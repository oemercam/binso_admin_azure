"use client";

import { useEffect, useRef } from "react";

/** Keep modal keyboard navigation inside the dialog and restore its trigger. */
export function useDialogFocus(open: boolean, onClose: () => void) {
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
    const active = document.activeElement;
    const trigger = active instanceof HTMLElement && !dialog.contains(active) ? active : triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
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
    if(!dialog.contains(document.activeElement)) (controls()[0] ?? dialog).focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); closeRef.current(); return; }
      if (event.key !== "Tab") return;
      const items = controls();
      const first = items[0], last = items.at(-1);
      if (!first || !last) { event.preventDefault(); dialog.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) {
        event.preventDefault(); first.focus();
      }
    };
    const onFocus = (event: FocusEvent) => {
      if (event.target instanceof Node && !dialog.contains(event.target)) (controls()[0] ?? dialog).focus();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("focusin", onFocus);
    return () => {
      viewport?.removeEventListener("resize",resize);viewport?.removeEventListener("scroll",resize);
      document.documentElement.style.removeProperty("--dialog-viewport-height");document.documentElement.style.removeProperty("--dialog-viewport-top");
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("focusin", onFocus);
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.overflow = previousRootOverflow;
      if (trigger?.isConnected) trigger.focus();
    };
  }, [open]);
  return dialogRef;
}
