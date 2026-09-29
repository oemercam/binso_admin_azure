"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import BrandLogo from "@/components/ui/brand-logo";
import {LanguageSwitcher,useLocale} from "@/components/locale-provider";
import MarketingMenuButton from "@/components/marketing/marketing-menu-button";
import {useMarketingReveal} from "@/components/marketing/use-marketing-reveal";
import MarketingFooter from "@/components/marketing/marketing-footer";
import {ArrowRight} from "lucide-react";

export default function MarketingFrame({children}:{children:React.ReactNode}){
 const [menuOpen,setMenuOpen]=useState(false);
 const {t}=useLocale();
 useMarketingReveal();
 useEffect(()=>{document.body.classList.toggle("marketing-menu-open",menuOpen);return()=>document.body.classList.remove("marketing-menu-open")},[menuOpen]);
 const close=()=>setMenuOpen(false);
 return <div className="marketing-shell">
  <header className="marketing-header">
   <Link href="/" className="marketing-logo marketing-logo-image" aria-label="Binso One"><BrandLogo priority/></Link>
   <nav className="marketing-nav"><Link href="/features">{t("Funktionen")}</Link><Link href="/preise">{t("Preise")}</Link><Link href="/sicherheit">{t("Sicherheit")}</Link><Link href="/kontakt">{t("Kontakt")}</Link></nav>
   <div className="marketing-actions"><LanguageSwitcher compact/><Link href="/portal/login">{t("Anmelden")}</Link><Link className="marketing-primary" href="/portal/registrieren">{t("Kostenlos starten")} <ArrowRight size={16}/></Link></div>
   <MarketingMenuButton open={menuOpen} onClick={()=>setMenuOpen(v=>!v)}/>
  </header>
  {menuOpen&&<div className="marketing-mobile-backdrop" onClick={close} aria-hidden="true"/>}
  <aside className={`marketing-mobile-menu ${menuOpen?"open":""}`} aria-hidden={!menuOpen}>
   <div className="marketing-mobile-menu-head"><strong>{t("Navigation")}</strong></div>
   <nav><Link href="/features" onClick={close}>{t("Funktionen")}</Link><Link href="/preise" onClick={close}>{t("Preise")}</Link><Link href="/sicherheit" onClick={close}>{t("Sicherheit")}</Link><Link href="/kontakt" onClick={close}>{t("Kontakt")}</Link></nav>
   <div className="marketing-mobile-language"><LanguageSwitcher /></div>
   <div className="marketing-mobile-actions"><Link href="/portal/login" className="marketing-secondary" onClick={close}>{t("Anmelden")}</Link><Link href="/portal/registrieren?trial=1" className="marketing-primary" onClick={close}>{t("14 Tage kostenlos testen")}</Link></div>
  </aside>
  <main data-reveal>{children}</main>
  <MarketingFooter/>
 </div>
}
