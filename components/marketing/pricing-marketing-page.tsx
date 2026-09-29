import Link from "next/link";
import {ArrowRight,Check,HelpCircle} from "lucide-react";
import MarketingFrame from "@/components/marketing/marketing-frame";
import {plans} from "@/lib/plans";

const faqs=[
 ["Kann ich den Plan später wechseln?","Ja. Der Abonnementbereich ist für Upgrade, Downgrade und Kündigung vorbereitet."],
 ["Brauche ich für die Demo eine Kreditkarte?","Nein. Die lokale Demo kann ohne Zahlungsdaten geöffnet werden."],
 ["Sind mehrere Benutzer möglich?","Ja. Benutzer, Einladungen und Rollen werden pro Organisation verwaltet."],
 ["Wo werden die produktiven Daten betrieben?","Für den Produktivbetrieb ist Microsoft Azure mit PostgreSQL und privater Netzwerkarchitektur vorgesehen."],
];
export default function PricingMarketingPage(){return <MarketingFrame>
 <section className="marketing-subhero"><div className="section-kicker">Preise</div><h1>Ein Plan, der mit deinem Unternehmen mitwächst.</h1><p>Transparente SaaS-Pläne pro Firma. Starte klein und erweitere, wenn dein Team oder deine Prozesse wachsen.</p></section>
 <section className="marketing-section pricing-section pricing-page-section"><div className="pricing-grid">{plans.map(p=><article key={p.id} className={p.popular?"pricing-card popular":"pricing-card"}>{p.popular&&<div className="popular-badge">Empfohlen</div>}<h2>{p.name}</h2><p>{p.description}</p><div className="price"><strong>CHF {p.monthly}</strong><span>/ Monat</span></div><Link className={p.popular?"marketing-primary plan-button":"marketing-secondary plan-button"} href={`/registrieren?plan=${p.id}`}>{p.name} wählen <ArrowRight size={15}/></Link><div className="plan-features">{p.features.map(f=><span key={f}><Check size={15}/>{f}</span>)}</div></article>)}</div><p className="pricing-note">Preise exkl. MWST. Jährliche Zahlung gemäss aktuell ausgewiesenem Checkout-Preis.</p></section>
 <section className="marketing-section"><div className="section-kicker">Häufige Fragen</div><h2>Vor dem Start.</h2><div className="marketing-faq-grid">{faqs.map(([q,a])=><article key={q}><HelpCircle size={20}/><h3>{q}</h3><p>{a}</p></article>)}</div></section>
 </MarketingFrame>}
