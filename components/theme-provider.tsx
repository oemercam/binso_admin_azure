"use client";

import {createContext,useContext,useEffect,useMemo,useState} from "react";
import {appEvents,emitAppEvent} from "@/lib/client/app-events";
import {readTextStorage,writeTextStorage} from "@/lib/client/browser-storage";
import {storageKeys} from "@/config/storage-keys";

export type ThemePreference="system"|"light"|"dark";
type ThemeContextValue={theme:ThemePreference;resolved:"light"|"dark";setTheme:(theme:ThemePreference)=>void};
const ThemeContext=createContext<ThemeContextValue|null>(null);
const STORAGE_KEY=storageKeys.theme;
const themes:ThemePreference[]=["system","light","dark"];

function resolveTheme(theme:ThemePreference):"light"|"dark"{
 if(theme!=="system")return theme;
 if(typeof window==="undefined")return "light";
 return window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";
}

function applyTheme(theme:ThemePreference){
 const resolved=resolveTheme(theme);
 document.documentElement.dataset.theme=resolved;
 document.documentElement.style.colorScheme=resolved;
 return resolved;
}

export default function ThemeProvider({children}:{children:React.ReactNode}){
 const [theme,setThemeState]=useState<ThemePreference>("system");
 const [resolved,setResolved]=useState<"light"|"dark">("light");
 useEffect(()=>{
  const media=window.matchMedia("(prefers-color-scheme: dark)");
  let current:ThemePreference="system";
  const timer=window.setTimeout(async()=>{
   const stored=readTextStorage(STORAGE_KEY,"system") as ThemePreference;
   current=themes.includes(stored)?stored:"system";
   setThemeState(current);
   setResolved(applyTheme(current));
  },0);
  const listener=()=>{if(current==="system")setResolved(applyTheme(current))};
  media.addEventListener("change",listener);
  return()=>{window.clearTimeout(timer);media.removeEventListener("change",listener)};
 },[]);
 function setTheme(next:ThemePreference){
  writeTextStorage(STORAGE_KEY,next);
  setThemeState(next);
  const value=applyTheme(next);setResolved(value);
  emitAppEvent(appEvents.themeChanged,{theme:next,resolved:value});
 }
 const value=useMemo(()=>({theme,resolved,setTheme}),[theme,resolved]);
 return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export function useTheme(){const value=useContext(ThemeContext);if(!value)throw new Error("useTheme must be used inside ThemeProvider");return value}
