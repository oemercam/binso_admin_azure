"use client";
export type ClientCapabilities={standalone:boolean;share:boolean;notifications:boolean;push:boolean;serviceWorker:boolean;installPrompt:boolean};
export function detectCapabilities():ClientCapabilities{
 if(typeof window==="undefined")return {standalone:false,share:false,notifications:false,push:false,serviceWorker:false,installPrompt:false};
 const nav=navigator as Navigator&{standalone?:boolean;share?:ShareData extends never?never:(data:ShareData)=>Promise<void>};
 return {
  standalone:window.matchMedia("(display-mode: standalone)").matches||Boolean(nav.standalone),
  share:typeof navigator.share==="function",
  notifications:"Notification" in window,
  push:"PushManager" in window,
  serviceWorker:"serviceWorker" in navigator,
  installPrompt:"BeforeInstallPromptEvent" in window,
 };
}
