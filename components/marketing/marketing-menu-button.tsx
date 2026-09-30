"use client";

import {useLocale} from "@/components/locale-provider";

type Props={open:boolean;onClick:()=>void};

export default function MarketingMenuButton({open,onClick}:Props){
 const {t}=useLocale();
 return <button
  type="button"
  className={`marketing-menu-button${open?" is-open":""}`}
  aria-label={t(open?"Navigation schliessen":"Navigation öffnen")}
  aria-expanded={open}
  aria-controls="marketing-mobile-navigation"
  onClick={onClick}
 >
  <span className="marketing-menu-glyph" aria-hidden="true">
   <span/><span/><span/>
  </span>
 </button>
}
