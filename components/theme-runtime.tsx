"use client";
import {useEffect} from 'react';
import {applyTheme} from '@/lib/client/theme';
export function ThemeRuntime(){
 useEffect(()=>{
  // Next may replace metadata after navigation. Keep the status bar in sync.
  const syncMeta=()=>{
   const color=document.documentElement.dataset.theme==='dark'?'#000000':'#ffffff';
   for(const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')){
    if(meta.content!==color)meta.content=color;
   }
  };
  const metadataObserver=new MutationObserver(syncMeta);
  metadataObserver.observe(document.head,{childList:true,subtree:true,attributes:true,attributeFilter:['content']});
  const media=window.matchMedia('(prefers-color-scheme: dark)');
  const systemChanged=()=>{if(document.documentElement.dataset.themeMode==='system')applyTheme('system');};
  const resume=()=>{
   if(document.visibilityState!=='visible')return;
   const selected=document.documentElement.dataset.themeMode;
   applyTheme(selected==='light'||selected==='dark'?selected:'system');
   syncMeta();
  };
  const storedChanged=(event:StorageEvent)=>{
   if(event.key!=='binso.theme.mode'&&event.key!==null)return;
   const mode=event.newValue;
   applyTheme(mode==='light'||mode==='dark'?mode:'system');
  };
  const mode=document.documentElement.dataset.themeMode;
  applyTheme(mode==='light'||mode==='dark'?mode:'system');
  media.addEventListener('change',systemChanged);
  window.addEventListener('storage',storedChanged);
  window.addEventListener('pageshow',resume);
  document.addEventListener('visibilitychange',resume);
  return()=>{metadataObserver.disconnect();media.removeEventListener('change',systemChanged);window.removeEventListener('storage',storedChanged);window.removeEventListener('pageshow',resume);document.removeEventListener('visibilitychange',resume);};
 },[]);
 return null;
}
