"use client";
import {useEffect} from 'react';
import {applyTheme} from '@/lib/client/theme';
export function ThemeRuntime(){
 useEffect(()=>{
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
  return()=>{media.removeEventListener('change',systemChanged);window.removeEventListener('storage',storedChanged);};
 },[]);
 return null;
}
