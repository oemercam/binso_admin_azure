"use client";
const userScopedPrefixes=["binso-one-saas-","binso-one-local-","binso-local-","binso-data-","binso-records-"];
export async function clearUserRuntimeState(){
 for(let i=localStorage.length-1;i>=0;i--){const key=localStorage.key(i);if(key&&userScopedPrefixes.some(prefix=>key.startsWith(prefix)))localStorage.removeItem(key)}
 sessionStorage.clear();
 if("caches" in window){const keys=await caches.keys();await Promise.all(keys.filter(key=>/user|tenant|api/i.test(key)).map(key=>caches.delete(key)))}
 window.dispatchEvent(new Event("binso-session-cleared"));
}
