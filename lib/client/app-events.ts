"use client";

export const appEvents={
  dataChanged:"binso-data-changed",
  settingsChanged:"binso-settings-changed",
  appChanged:"binso-app-changed",
  saasChanged:"binso-saas-changed",
  pilotDataChanged:"binso-pilot-data",
  localeChanged:"binso-locale-changed",
  pwaUpdateAvailable:"binso-pwa-update",
  pwaApplyUpdate:"binso-pwa-apply-update",
  sessionCleared:"binso-session-cleared",
  consentChanged:"binso-consent-changed",
  themeChanged:"binso-theme-changed",
  toast:"binso-toast",
  confirm:"binso-confirm",
  openConsent:"binso-open-consent",
} as const;

export type AppEventName=(typeof appEvents)[keyof typeof appEvents];

export function emitAppEvent(name:AppEventName,detail?:unknown){
  if(typeof window==="undefined")return;
  window.dispatchEvent(detail===undefined?new Event(name):new CustomEvent(name,{detail}));
}

export function subscribeAppEvent(name:AppEventName,listener:EventListener){
  if(typeof window==="undefined")return()=>{};
  window.addEventListener(name,listener);
  return()=>window.removeEventListener(name,listener);
}
