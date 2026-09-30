"use client";
import Link from "next/link";
import BrandLogo from "@/components/ui/brand-logo";
import {useLocale} from "@/components/locale-provider";

export default function MarketingFooter(){
 const {t}=useLocale();
 return <footer className="marketing-footer">
  <div className="marketing-footer-desktop">
   <div className="marketing-footer-main">
    <div className="marketing-footer-brand">
     <BrandLogo/>
     <div className="marketing-footer-brand-copy">
      <strong>{t("Business-Software für Schweizer KMU")}</strong>
      <p>{t("Verkauf, Projekte, Zeit, Finanzen und Personal in einer klaren Plattform.")}</p>
     </div>
    </div>
    <nav className="marketing-footer-links" aria-label={t("Footer Navigation")}>
     <div className="marketing-footer-group"><strong>{t("Produkt")}</strong><Link href="/features">{t("Funktionen")}</Link><Link href="/preise">{t("Preise")}</Link><Link href="/demo?start=1">{t("Demo")}</Link><Link href="/sicherheit">{t("Sicherheit")}</Link><Link href="/status">{t("Status")}</Link></div>
     <div className="marketing-footer-group"><strong>{t("Hilfe")}</strong><Link href="/kontakt">{t("Kontakt")}</Link><Link href="/support">{t("Support")}</Link></div>
     <div className="marketing-footer-group"><strong>{t("Rechtliches")}</strong><Link href="/impressum">{t("Impressum")}</Link><Link href="/agb">{t("AGB")}</Link><Link href="/datenschutz">{t("Datenschutz")}</Link><Link href="/cookies">{t("Cookies")}</Link></div>
    </nav>
   </div>
   <div className="marketing-footer-bottom">
    <small>© 2026 <a href="https://binso.ch" target="_blank" rel="noreferrer">Binso GmbH</a></small>
   </div>
  </div>

  <div className="marketing-footer-mobile">
   <div className="marketing-footer-mobile-brand"><BrandLogo/></div>
   <p className="marketing-footer-mobile-slogan">{t("Business-Software für Schweizer KMU")}</p>
   <nav className="marketing-footer-mobile-legal" aria-label={t("Rechtliches")}>
    <Link href="/agb">{t("AGB")}</Link>
    <span aria-hidden="true">·</span>
    <Link href="/datenschutz">{t("Datenschutz")}</Link>
    <span aria-hidden="true">·</span>
    <Link href="/impressum">{t("Impressum")}</Link>
   </nav>
   <small className="marketing-footer-mobile-copyright">© 2026 <a href="https://binso.ch" target="_blank" rel="noreferrer">Binso GmbH</a></small>
  </div>
 </footer>;
}
