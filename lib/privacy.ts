export const CONSENT_VERSION="2026-09-29";
export type ConsentPreferences={necessary:true;analytics:boolean;version:string;updatedAt:string};
export const defaultConsent:ConsentPreferences={necessary:true,analytics:false,version:CONSENT_VERSION,updatedAt:""};

export function loadConsent():ConsentPreferences|null{
 if(typeof window==="undefined")return null;
 try{const raw=localStorage.getItem("binso-cookie-consent");if(!raw)return null;const data=JSON.parse(raw) as ConsentPreferences;return data.version===CONSENT_VERSION?data:null}catch{return null}
}
export function saveConsent(input:{analytics:boolean}){
 const value:ConsentPreferences={necessary:true,analytics:input.analytics,version:CONSENT_VERSION,updatedAt:new Date().toISOString()};
 localStorage.setItem("binso-cookie-consent",JSON.stringify(value));
 window.dispatchEvent(new CustomEvent("binso-consent-changed",{detail:value}));
 return value;
}
