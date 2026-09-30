"use client";

type Props={open:boolean;onClick:()=>void};

export default function MarketingMenuButton({open,onClick}:Props){
 return <button
  type="button"
  className={`marketing-menu-button${open?" is-open":""}`}
  aria-label={open?"Navigation schliessen":"Navigation öffnen"}
  aria-expanded={open}
  aria-controls="marketing-mobile-navigation"
  onClick={onClick}
 >
  <span className="marketing-menu-glyph" aria-hidden="true">
   <span/><span/><span/>
  </span>
 </button>
}
