"use client";

import {createContext,useContext,useEffect,useMemo,useState} from "react";

export type ThemePreference="system"|"light"|"dark";
type ThemeContextValue={theme:ThemePreference;resolved:"light"|"dark";setTheme:(theme:ThemePreference)=>void};
const ThemeContext=createContext<ThemeContextValue|null>(null);
const STORAGE_KEY="binso-theme";

function resolveTheme(theme:ThemePreference):"light"|"dark"{
 if(theme!=="system")return theme;
 if(typeof window==="undefined")return "light";
 return window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";
}

export default function ThemeProvider({children}:{children:React.ReactNode}){
 const [theme,setThemeState]=useState<ThemePreference>("system");
 const [resolved,setResolved]=useState<"light"|"dark">("light");
 useEffect(()=>{
  const media=window.matchMedia("(prefers-color-scheme: dark)");
  let current:ThemePreference="system";
  const apply=()=>{const next=resolveTheme(current);setResolved(next);document.documentElement.dataset.theme=next;document.documentElement.style.colorScheme=next};
  const timer=window.setTimeout(()=>{
   const stored=localStorage.getItem(STORAGE_KEY) as ThemePreference|null;
   current=stored&&["system","light","dark"].includes(stored)?stored:"system";
   setThemeState(current);
   apply();
  },0);
  const listener=()=>{if(current==="system")apply()};
  media.addEventListener("change",listener);
  return()=>{window.clearTimeout(timer);media.removeEventListener("change",listener)};
 },[]);
 function setTheme(next:ThemePreference){
  localStorage.setItem(STORAGE_KEY,next);
  setThemeState(next);
  const value=resolveTheme(next);setResolved(value);document.documentElement.dataset.theme=value;document.documentElement.style.colorScheme=value;
  window.dispatchEvent(new CustomEvent("binso-theme-changed",{detail:{theme:next,resolved:value}}));
 }
 const value=useMemo(()=>({theme,resolved,setTheme}),[theme,resolved]);
 return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export function useTheme(){const value=useContext(ThemeContext);if(!value)throw new Error("useTheme must be used inside ThemeProvider");return value}
