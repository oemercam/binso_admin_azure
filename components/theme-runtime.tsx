"use client";
import {useEffect} from 'react';
import {applyTheme} from '@/lib/client/theme';
export function ThemeRuntime(){
 useEffect(()=>{
  const viewport=window.visualViewport;
  const syncViewport=()=>{
   const root=document.documentElement;
   const focused=document.activeElement;
   const typing=focused instanceof HTMLElement&&focused.matches('input,textarea,select');
   root.style.setProperty('--sheet-available-height',`${viewport?.height??window.innerHeight}px`);
   root.style.setProperty('--sheet-keyboard-offset',`${typing&&viewport?Math.max(0,window.innerHeight-viewport.height-viewport.offsetTop):0}px`);
  };
  syncViewport();
  viewport?.addEventListener('resize',syncViewport);
  viewport?.addEventListener('scroll',syncViewport);
  document.addEventListener('focusin',syncViewport);
  document.addEventListener('focusout',syncViewport);
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
  const storedChanged=(event:StorageEvent)=>{
   if(event.key!=='binso.theme.mode'&&event.key!==null)return;
   const mode=event.newValue;
   applyTheme(mode==='light'||mode==='dark'?mode:'system');
  };
  const mode=document.documentElement.dataset.themeMode;
  applyTheme(mode==='light'||mode==='dark'?mode:'system');
  media.addEventListener('change',systemChanged);
  window.addEventListener('storage',storedChanged);
  return()=>{metadataObserver.disconnect();viewport?.removeEventListener('resize',syncViewport);viewport?.removeEventListener('scroll',syncViewport);document.removeEventListener('focusin',syncViewport);document.removeEventListener('focusout',syncViewport);media.removeEventListener('change',systemChanged);window.removeEventListener('storage',storedChanged);};
 },[]);
 return null;
}
