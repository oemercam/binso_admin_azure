import type { Metadata } from "next";
import Link from "next/link";
import { MarketingFooter, MarketingHeader } from "@/components/marketing";
import { Button, Icon } from "@/components/ui";
import { domainConfig } from "@/config/domain";
import { plans } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Preise – Binso One",
  description: `Transparente Preise für Binso One. Business-Software für Schweizer KMU ab CHF ${plans[0].monthly} pro Monat, mit ${domainConfig.trialDays} Tagen kostenloser Testphase.`,
  alternates: { canonical: "/preise" },
  openGraph: {
    title: "Binso One Preise",
    description: `Transparente Pläne für Schweizer KMU – ${domainConfig.trialDays} Tage kostenlos testen.`,
    url: "/preise",
    images: ["/opengraph-image"]
  },
};

export default function Prices(){
  return <><MarketingHeader/><main className="subpage pricing-page">
    <div className="subhero">
      <span className="eyebrow">PREISE</span>
      <h1>Einfach. Transparent. Fair.</h1>
      <p>{domainConfig.trialDays} Tage kostenlos testen. Kein komplizierter Einstieg, klare Preise und jederzeit einsehbarer Plan.</p>
      <div className="pricing-trust">
        <span><Icon name="check" size={16}/>{domainConfig.trialDays} Tage kostenlos</span>
        <span><Icon name="check" size={16}/>Keine Einrichtungsgebühr</span>
        <span><Icon name="check" size={16}/>CHF-Abrechnung über Stripe</span>
      </div>
    </div>
    <div className="pricing-grid">
      {plans.map(plan=><article className={plan.popular?"price-card featured":"price-card"} key={plan.id}>
        {plan.popular&&<span className="popular">BELIEBT</span>}
        <div className="plan-name"><h2>{plan.name}</h2>{plan.popular&&<small>Empfohlen für KMU</small>}</div>
        <p>{plan.description}</p>
        <div className="price"><strong>CHF {plan.monthly}</strong><span>/ Monat</span></div>
        <p><small>oder CHF {plan.yearly} / Jahr · exkl. MWST, sofern geschuldet</small></p>
        <Button href={`/registrieren?plan=${plan.id}&billing=monthly`} variant={plan.popular?"primary":"secondary"}>{domainConfig.trialDays} Tage kostenlos testen</Button><Link className="marketing-text-link" href={`/registrieren?plan=${plan.id}&billing=yearly`}>Jährlich starten</Link>
        <ul>{plan.features.map(feature=><li key={feature}><Icon name="check" size={15}/>{feature}</li>)}</ul>
      </article>)}
    </div>
    <section className="pricing-foot"><div><h2>Alle Pläne starten mit 14 Tagen Testphase.</h2><p>Keine Kreditkarte nötig. Ohne aktiviertes Abo wechselt das Konto nach der Testphase in den Nur-Lesen-Modus; deine Daten bleiben erhalten.</p><small>Geschäftskundenangebot. Alle Preise in CHF, exkl. gesetzlich geschuldeter MWST. Der verbindliche Gesamtbetrag wird vor dem kostenpflichtigen Abschluss im Stripe Checkout angezeigt.</small></div><Button href="/demo" variant="secondary">Demo ohne Registrierung</Button></section>
  </main><MarketingFooter/></>;
}
