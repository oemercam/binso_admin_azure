"use client";
import {useEffect} from "react";
import {useTheme,type ThemePreference} from "@/components/theme-provider";
import {apiFetch,isProductionMode} from "@/lib/client/runtime";
import {appEvents,subscribeAppEvent} from "@/lib/client/app-events";
export default function AccountPreferenceSync(){const {theme,setTheme}=useTheme();useEffect(()=>{if(!isProductionMode())return;let active=true;const timer=window.setTimeout(()=>{void apiFetch<{user:{theme?:ThemePreference}}>("/api/me").then(r=>{if(active&&r.user.theme&&r.user.theme!==theme)setTheme(r.user.theme)}).catch(()=>{})},0);const unsub=subscribeAppEvent(appEvents.themeChanged,((event:Event)=>{const next=(event as CustomEvent<{theme?:ThemePreference}>).detail?.theme;if(next)void apiFetch("/api/me",{method:"PATCH",body:JSON.stringify({theme:next})}).catch(()=>{})}) as EventListener);return()=>{active=false;window.clearTimeout(timer);unsub()}},[setTheme,theme]);return null}
