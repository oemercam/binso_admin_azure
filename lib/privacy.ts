"use client";
import {legalConfig} from "@/lib/legal";
import {appEvents,emitAppEvent} from "@/lib/client/app-events";
import {readJsonStorage,writeJsonStorage} from "@/lib/client/browser-storage";
import {storageKeys} from "@/config/storage-keys";

export const CONSENT_VERSION=legalConfig.cookieVersion;
const CONSENT_KEY=storageKeys.consent;
export type ConsentPreferences={necessary:true;analytics:boolean;version:string;updatedAt:string};
export const defaultConsent:ConsentPreferences={necessary:true,analytics:false,version:CONSENT_VERSION,updatedAt:""};

export function loadConsent():ConsentPreferences|null{
 const data=readJsonStorage<ConsentPreferences|null>(CONSENT_KEY,null);
 return data?.version===CONSENT_VERSION?data:null;
}
export function saveConsent(input:{analytics:boolean}){
 const value:ConsentPreferences={necessary:true,analytics:input.analytics,version:CONSENT_VERSION,updatedAt:new Date().toISOString()};
 writeJsonStorage(CONSENT_KEY,value);
 emitAppEvent(appEvents.consentChanged,value);
 return value;
}
