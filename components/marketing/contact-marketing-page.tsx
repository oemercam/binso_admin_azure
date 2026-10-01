"use client";

import Link from "next/link";
import {Building2,Headphones,Mail,MapPin,Phone} from "lucide-react";
import MarketingFrame from "@/components/marketing/marketing-frame";
import {useLocale} from "@/components/locale-provider";
import {siteConfig} from "@/lib/site-config";

export default function ContactMarketingPage(){
 const {t}=useLocale();
 const a=siteConfig.address;
 const maps=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${a.street}, ${a.postalCode} ${a.city}, ${a.country}`)}`;
 return <MarketingFrame>
  <section className="marketing-subhero contact-hero">
   <div className="section-kicker">{t("Kontakt")}</div>
   <h1>{t("Wie können wir helfen?")}</h1>
   <p>{t("Fragen zu Binso One, Testzugängen oder einer Zusammenarbeit beantworten wir direkt. Bestehende Kunden können Supportanfragen nach der Anmeldung im Kundenportal erfassen.")}</p>
  </section>
  <section className="marketing-section contact-section">
   <div className="contact-grid">
    <article className="contact-card"><span className="contact-icon"><Mail size={20}/></span><div><h2>{t("Allgemeine Anfragen")}</h2><p>{t("Für Fragen zu Binso One, Angeboten, Testzugängen und Zusammenarbeit.")}</p><a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a></div></article>
    <article className="contact-card"><span className="contact-icon"><Phone size={20}/></span><div><h2>{t("Telefon")}</h2><p>{t("Für eine direkte Kontaktaufnahme mit Binso GmbH.")}</p><a href={`tel:${siteConfig.phoneHref}`}>{siteConfig.phoneDisplay}</a></div></article>
    <article className="contact-card"><span className="contact-icon"><Headphones size={20}/></span><div><h2>{t("Support für Kunden")}</h2><p>{t("Technische und fachliche Anfragen werden im Kundenportal als Supportfall erfasst und bleiben dort nachvollziehbar.")}</p><Link href="/support">{t("Zum Support")}</Link></div></article>
    <article className="contact-card"><span className="contact-icon"><MapPin size={20}/></span><div><h2>{t("Standort")}</h2><p>{siteConfig.company}<br/>{a.street}<br/>{a.postalCode} {a.city}, {t(a.country)}</p><a href={maps} target="_blank" rel="noreferrer">{t("Standort anzeigen")}</a></div></article>
   </div>
   <div className="contact-company-strip"><span className="contact-icon"><Building2 size={20}/></span><div><strong>{siteConfig.company}</strong><span>{t("Schweizer Anbieter von Binso One")}</span></div><dl><div><dt>{t("UID")}</dt><dd>{siteConfig.uid}</dd></div><div><dt>{t("Web")}</dt><dd><a href="https://www.binso.ch">www.binso.ch</a></dd></div></dl></div>
  </section>
 </MarketingFrame>;
}
