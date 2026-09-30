"use client";
import {getBrowserStorage} from "@/lib/client/browser-storage";
import {storagePrefixes} from "@/config/storage-keys";
import {emitAppEvent,appEvents} from "@/lib/client/app-events";
const userScopedPrefixes=storagePrefixes.userScoped;
export async function clearUserRuntimeState(){
 const local=getBrowserStorage("local");const session=getBrowserStorage("session");
 if(local)for(let i=local.length-1;i>=0;i--){const key=local.key(i);if(key&&userScopedPrefixes.some(prefix=>key.startsWith(prefix)))local.removeItem(key)}
 session?.clear();
 if("caches" in window){const keys=await caches.keys();await Promise.all(keys.filter(key=>/user|tenant|api/i.test(key)).map(key=>caches.delete(key)))}
 emitAppEvent(appEvents.sessionCleared);
}
