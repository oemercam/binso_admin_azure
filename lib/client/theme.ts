import {apiGet,apiPatch,isProductionBackendEnabled} from './backend';
import {initializeTheme,type ThemeMode} from '../theme';
export type {ThemeMode} from '../theme';
let preferenceRevision=0;
let pendingSave:Promise<void>=Promise.resolve();
let pendingLoad:Promise<ThemeMode|null>|null=null;
let confirmedMode:ThemeMode|null=null;
export function applyTheme(mode:ThemeMode){
 const result=initializeTheme(mode);
 window.dispatchEvent(new CustomEvent('binso-theme',{detail:result}));
 return result.resolved;
}
export async function loadTheme(){
 if(!isProductionBackendEnabled())return null;
 if(pendingLoad)return pendingLoad;
 const revision=preferenceRevision;
 pendingLoad=(async()=>{
  await pendingSave.catch(()=>{});
  const data=await apiGet<{item?:{theme?:string}}>('/api/settings/profile');
  if(revision!==preferenceRevision)return null;
  const mode=data.item?.theme;
  if(mode==='light'||mode==='dark'||mode==='system'){confirmedMode=mode;applyTheme(mode);return mode;}
  return null;
 })();
 try{return await pendingLoad;}finally{pendingLoad=null;}
}
export async function saveTheme(mode:ThemeMode){
 const revision=++preferenceRevision;
 const previous=document.documentElement.dataset.themeMode;
 confirmedMode??=previous==='light'||previous==='dark'?previous:'system';
 applyTheme(mode);
 // Immediate rendering; ordered writes keep rapid choices consistent on restart.
 const saving=pendingSave.catch(()=>{}).then(async()=>{
  if(isProductionBackendEnabled())await apiPatch('/api/settings/profile',{theme:mode});
  confirmedMode=mode;
 });
 pendingSave=saving;
 try{await saving;}catch(error){
  if(revision===preferenceRevision)applyTheme(confirmedMode??'system');
  throw error;
 }
}
