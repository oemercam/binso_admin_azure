"use client";
import {HelpCircle} from "lucide-react";
import MarketingFrame from "@/components/marketing/marketing-frame";
import PricingCarousel from "@/components/marketing/pricing-carousel";
import {useLocale} from "@/components/locale-provider";

const faqs=[
 ["Kann ich den Plan später wechseln?","Ja. Der Abonnementbereich ist für Upgrade, Downgrade und Kündigung vorbereitet."],
 ["Brauche ich für die Demo eine Kreditkarte?","Nein. Die lokale Demo kann ohne Zahlungsdaten geöffnet werden."],
 ["Sind mehrere Benutzer möglich?","Ja. Benutzer, Einladungen und Rollen werden pro Organisation verwaltet."],
 ["Wo werden die produktiven Daten betrieben?","Für den Produktivbetrieb ist Microsoft Azure mit PostgreSQL und privater Netzwerkarchitektur vorgesehen."],
];
export default function PricingMarketingPage(){const {t}=useLocale();return <MarketingFrame>
 <section className="marketing-subhero"><div className="section-kicker">{t("Preise")}</div><h1>{t("Ein Plan, der mit deinem Unternehmen mitwächst.")}</h1><p>{t("Transparente SaaS-Pläne pro Firma. Starte klein und erweitere, wenn dein Team oder deine Prozesse wachsen.")}</p></section>
 <section className="marketing-section pricing-section pricing-page-section"><PricingCarousel registerBase="/portal/registrieren"/><p className="pricing-note">{t("Preise exkl. MWST. Jährliche Zahlung gemäss aktuell ausgewiesenem Checkout-Preis.")}</p></section>
 <section className="marketing-section"><div className="section-kicker">{t("Häufige Fragen")}</div><h2>{t("Vor dem Start.")}</h2><div className="marketing-faq-grid">{faqs.map(([q,a])=><article key={q}><HelpCircle size={20}/><h3>{t(q)}</h3><p>{t(a)}</p></article>)}</div></section>
 </MarketingFrame>}
