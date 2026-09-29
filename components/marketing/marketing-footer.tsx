"use client";
import Link from "next/link";
import BrandLogo from "@/components/ui/brand-logo";
import {LanguageSwitcher,useLocale} from "@/components/locale-provider";

export default function MarketingFooter(){
 const {t}=useLocale();
 return <footer className="marketing-footer">
  <div className="marketing-footer-brand">
   <BrandLogo/>
   <span>{t("KMU-Plattform für die Schweiz")}</span>
  </div>
  <nav className="marketing-footer-links" aria-label={t("Produkt und Unternehmen")}>
   <div><strong>{t("Produkt")}</strong><Link href="/features">{t("Funktionen")}</Link><Link href="/preise">{t("Preise")}</Link><Link href="/status">{t("Status")}</Link></div>
   <div><strong>{t("Unternehmen")}</strong><Link href="/kontakt">{t("Kontakt")}</Link><Link href="/support">{t("Support")}</Link><Link href="/impressum">{t("Impressum")}</Link></div>
   <div><strong>{t("Rechtliches")}</strong><Link href="/agb">{t("AGB")}</Link><Link href="/datenschutz">{t("Datenschutz")}</Link><Link href="/cookies">{t("Cookies")}</Link></div>
  </nav>
  <div className="marketing-footer-bottom"><LanguageSwitcher compact/><small>© 2026 Binso GmbH</small></div>
 </footer>;
}
