export type ThemeMode='light'|'dark'|'system';

// Self-contained so the same resolver can run in the head before the first paint.
export function initializeTheme(selected?:ThemeMode){
 let mode:ThemeMode=selected??'system';
 if(!selected){
  try{
   const cached=localStorage.getItem('binso.theme.mode')??localStorage.getItem('binso.theme');
   if(cached==='light'||cached==='dark'||cached==='system')mode=cached;
  }catch{/* Restricted browser storage still supports the system theme. */}
 }
 const resolved=mode==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):mode;
 const root=document.documentElement;
 root.dataset.themeMode=mode;
 root.dataset.theme=resolved;
 for(const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')){
  meta.content=resolved==='dark'?'#000000':'#ffffff';
  meta.removeAttribute('media');
 }
 try{localStorage.setItem('binso.theme.mode',mode);localStorage.setItem('binso.theme',resolved);}catch{/* Theme rendering must not depend on writable storage. */}
 return {mode,resolved};
}
