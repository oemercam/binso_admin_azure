import {apiGet,apiPatch,isProductionBackendEnabled} from './backend';
export type ThemeMode='light'|'dark'|'system';
export function applyTheme(mode:ThemeMode){
 const resolved=mode==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):mode;
 document.documentElement.dataset.theme=resolved;
 localStorage.setItem('binso.theme.mode',mode);localStorage.setItem('binso.theme',resolved);
 window.dispatchEvent(new CustomEvent('binso-theme',{detail:{mode,resolved}}));
 return resolved;
}
export async function loadTheme(){
 if(!isProductionBackendEnabled())return null;
 const data=await apiGet<{item?:{theme?:string}}>('/api/settings/profile');
 const mode=data.item?.theme;
 if(mode==='light'||mode==='dark'||mode==='system'){applyTheme(mode);return mode;}
 return null;
}
export async function saveTheme(mode:ThemeMode){
 if(isProductionBackendEnabled())await apiPatch('/api/settings/profile',{theme:mode});
 applyTheme(mode);
}
