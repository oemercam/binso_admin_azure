"use client";

import Link from "next/link";
import {ChevronRight,type LucideIcon} from "lucide-react";

type Props={
  href:string;
  label:string;
  icon:LucideIcon;
  active?:boolean;
  badge?:string|number|null;
  showChevron?:boolean;
  onNavigate?:()=>void;
};

export default function MobileNavigationRow({href,label,icon:Icon,active=false,badge=null,showChevron=false,onNavigate}:Props){
 return <Link
  href={href}
  className={active?"mobile-navigation-row active":"mobile-navigation-row"}
  aria-current={active?"page":undefined}
  onClick={event=>{
   if(onNavigate){
    event.preventDefault();
    onNavigate();
   }
  }}
 >
  <Icon className="mobile-navigation-row-icon" size={19} strokeWidth={1.8}/>
  <span className="mobile-navigation-row-label">{label}</span>
  {badge!==null&&badge!==undefined&&badge!==""?<span className="mobile-navigation-row-badge">{badge}</span>:showChevron?<ChevronRight className="mobile-navigation-row-chevron" size={16}/>:null}
 </Link>;
}
