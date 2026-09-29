"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import BrandLogo from "@/components/ui/brand-logo";
import {LanguageSwitcher} from "@/components/locale-provider";
import MarketingMenuButton from "@/components/marketing/marketing-menu-button";
import {useMarketingReveal} from "@/components/marketing/use-marketing-reveal";
import {ArrowRight,X} from "lucide-react";

export default function MarketingFrame({children}:{children:React.ReactNode}){
 const [menuOpen,setMenuOpen]=useState(false);
 useMarketingReveal();
 useEffect(()=>{document.body.classList.toggle("marketing-menu-open",menuOpen);return()=>document.body.classList.remove("marketing-menu-open")},[menuOpen]);
 const close=()=>setMenuOpen(false);
 return <div className="marketing-shell">
  <header className="marketing-header">
   <Link href="/" className="marketing-logo marketing-logo-image" aria-label="Binso One"><BrandLogo priority/></Link>
   <nav className="marketing-nav"><Link href="/features">Funktionen</Link><Link href="/preise">Preise</Link><Link href="/sicherheit">Sicherheit</Link><Link href="/kontakt">Kontakt</Link></nav>
   <div className="marketing-actions"><LanguageSwitcher compact/><Link href="/portal/login">Anmelden</Link><Link className="marketing-primary" href="/portal/registrieren">Kostenlos starten <ArrowRight size={16}/></Link></div>
   <MarketingMenuButton open={menuOpen} onClick={()=>setMenuOpen(v=>!v)}/>
  </header>
  {menuOpen&&<div className="marketing-mobile-backdrop" onClick={close} aria-hidden="true"/>}
  <aside className={`marketing-mobile-menu ${menuOpen?"open":""}`} aria-hidden={!menuOpen}>
   <div className="marketing-mobile-menu-head"><strong>Navigation</strong><button type="button" aria-label="Navigation schliessen" onClick={close}><X size={20}/></button></div>
   <nav><Link href="/features" onClick={close}>Funktionen</Link><Link href="/preise" onClick={close}>Preise</Link><Link href="/sicherheit" onClick={close}>Sicherheit</Link><Link href="/kontakt" onClick={close}>Kontakt</Link></nav>
   <div className="marketing-mobile-language"><LanguageSwitcher /></div>
   <div className="marketing-mobile-actions"><Link href="/portal/login" className="marketing-secondary" onClick={close}>Anmelden</Link><Link href="/portal/registrieren?trial=1" className="marketing-primary" onClick={close}>14 Tage kostenlos testen</Link></div>
  </aside>
  <main data-reveal>{children}</main>
  <footer className="marketing-footer"><div><BrandLogo/><span>KMU-Plattform für die Schweiz</span></div><div><Link href="/features">Funktionen</Link><Link href="/preise">Preise</Link><Link href="/kontakt">Kontakt</Link><Link href="/status">Status</Link><Link href="/impressum">Impressum</Link><Link href="/agb">AGB</Link><Link href="/datenschutz">Datenschutz</Link><Link href="/cookies">Cookies</Link></div><small>© 2026 Binso GmbH</small></footer>
 </div>
}
