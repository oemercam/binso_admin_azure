"use client";
import {Laptop, Moon, Sun} from "lucide-react";
import {useTheme,type ThemePreference} from "@/components/theme-provider";
import {useLocale} from "@/components/locale-provider";
const options:{value:ThemePreference;label:string;icon:typeof Sun}[]=[{value:"light",label:"Hell",icon:Sun},{value:"dark",label:"Dunkel",icon:Moon},{value:"system",label:"System",icon:Laptop}];
export default function ThemeToggle({compact=false}:{compact?:boolean}){const {theme,setTheme}=useTheme();const {t}=useLocale();return <div className={compact?"theme-toggle compact":"theme-toggle"} aria-label={t("Darstellung")}>{options.map(o=>{const Icon=o.icon;return <button type="button" key={o.value} className={theme===o.value?"active":""} onClick={()=>setTheme(o.value)} aria-pressed={theme===o.value} title={t(o.label)}><Icon size={15}/>{!compact&&<span>{t(o.label)}</span>}</button>})}</div>}
