import {apiGet,apiPatch,isProductionBackendEnabled} from './backend';
import {initializeTheme,type ThemeMode} from '../theme';
export type {ThemeMode} from '../theme';
let preferenceRevision=0;
export function applyTheme(mode:ThemeMode){
 const result=initializeTheme(mode);
 window.dispatchEvent(new CustomEvent('binso-theme',{detail:result}));
 return result.resolved;
}
export async function loadTheme(){
 if(!isProductionBackendEnabled())return null;
 const revision=preferenceRevision;
 const data=await apiGet<{item?:{theme?:string}}>('/api/settings/profile');
 if(revision!==preferenceRevision)return null;
 const mode=data.item?.theme;
 if(mode==='light'||mode==='dark'||mode==='system'){applyTheme(mode);return mode;}
 return null;
}
export async function saveTheme(mode:ThemeMode){
 ++preferenceRevision;
 if(isProductionBackendEnabled())await apiPatch('/api/settings/profile',{theme:mode});
 applyTheme(mode);
}
