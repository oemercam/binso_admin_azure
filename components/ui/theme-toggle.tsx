"use client";
import {Laptop, Moon, Sun} from "lucide-react";
import {useTheme,type ThemePreference} from "@/components/theme-provider";
const options:{value:ThemePreference;label:string;icon:typeof Sun}[]=[{value:"light",label:"Hell",icon:Sun},{value:"dark",label:"Dunkel",icon:Moon},{value:"system",label:"System",icon:Laptop}];
export default function ThemeToggle({compact=false}:{compact?:boolean}){const {theme,setTheme}=useTheme();return <div className={compact?"theme-toggle compact":"theme-toggle"} aria-label="Darstellung">{options.map(o=>{const Icon=o.icon;return <button type="button" key={o.value} className={theme===o.value?"active":""} onClick={()=>setTheme(o.value)} aria-pressed={theme===o.value} title={o.label}><Icon size={15}/>{!compact&&<span>{o.label}</span>}</button>})}</div>}
