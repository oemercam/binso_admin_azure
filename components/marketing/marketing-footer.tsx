"use client";
import Link from "next/link";
import BrandLogo from "@/components/ui/brand-logo";
import {Heart} from "lucide-react";
import {useLocale} from "@/components/locale-provider";

export default function MarketingFooter(){
 const {t}=useLocale();
 return <footer className="marketing-footer">
  <div className="marketing-footer-main">
   <div className="marketing-footer-brand">
    <BrandLogo/>
    <div className="marketing-footer-brand-copy">
     <strong>{t("Business-Software für Schweizer KMU")}</strong>
     <p>{t("Verkauf, Projekte, Zeit, Finanzen und Personal in einer klaren Plattform.")}</p>
    </div>
   </div>
   <nav className="marketing-footer-links" aria-label={t("Footer Navigation")}>
    <div className="marketing-footer-group"><strong>{t("Produkt")}</strong><Link href="/features">{t("Funktionen")}</Link><Link href="/preise">{t("Preise")}</Link><Link href="/demo">{t("Demo")}</Link><Link href="/sicherheit">{t("Sicherheit")}</Link><Link href="/status">{t("Status")}</Link></div>
    <div className="marketing-footer-group"><strong>{t("Hilfe")}</strong><Link href="/kontakt">{t("Kontakt")}</Link><Link href="/support">{t("Support")}</Link></div>
    <div className="marketing-footer-group"><strong>{t("Rechtliches")}</strong><Link href="/impressum">{t("Impressum")}</Link><Link href="/agb">{t("AGB")}</Link><Link href="/datenschutz">{t("Datenschutz")}</Link><Link href="/cookies">{t("Cookies")}</Link></div>
   </nav>
  </div>
  <div className="marketing-footer-bottom">
   <small>© 2026 <a href="https://binso.ch" target="_blank" rel="noreferrer">Binso GmbH</a></small>
   <span className="marketing-footer-made">{t("Mit Liebe in der Schweiz entwickelt")} <Heart className="footer-heart" size={12} aria-hidden="true"/></span>
  </div>
 </footer>;
}
