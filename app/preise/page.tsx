import {localizeMetadata} from "@/lib/server/locale";
import {LocalizedText} from "@/lib/client/locale";
import type { Metadata } from "next";
import Link from "next/link";
import { MarketingFooter, MarketingHeader } from "@/components/marketing";
import { Button, Icon } from "@/components/ui";
import { domainConfig } from "@/config/domain";
import { plans } from "@/lib/plans";

const baseMetadata: Metadata = {
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
export async function generateMetadata():Promise<Metadata>{return localizeMetadata(baseMetadata,"/preise");}


export default function Prices(){
  return <><MarketingHeader/><main className="subpage pricing-page">
    <div className="subhero">
      <span className="eyebrow"><LocalizedText>{"PREISE"}</LocalizedText></span>
      <h1><LocalizedText>{"Einfach. Transparent. Fair."}</LocalizedText></h1>
      <p>{domainConfig.trialDays}<LocalizedText>{" Tage kostenlos testen. Kein komplizierter Einstieg, klare Preise und jederzeit einsehbarer Plan."}</LocalizedText></p>
      <div className="pricing-trust">
        <span><Icon name="check" size={16}/>{domainConfig.trialDays}<LocalizedText>{" Tage kostenlos"}</LocalizedText></span>
        <span><Icon name="check" size={16}/><LocalizedText>{"Keine Einrichtungsgebühr"}</LocalizedText></span>
        <span><Icon name="check" size={16}/><LocalizedText>{"CHF-Abrechnung über Stripe"}</LocalizedText></span>
      </div>
    </div>
    <div className="pricing-grid">
      {plans.map(plan=><article className={plan.popular?"price-card featured":"price-card"} key={plan.id}>
        {plan.popular&&<span className="popular"><LocalizedText>{"BELIEBT"}</LocalizedText></span>}
        <div className="plan-name"><h2>{plan.name}</h2>{plan.popular&&<small><LocalizedText>{"Empfohlen für KMU"}</LocalizedText></small>}</div>
        <p><LocalizedText>{plan.description}</LocalizedText></p>
        <div className="price"><strong><LocalizedText>{"CHF "}</LocalizedText>{plan.monthly}</strong><span><LocalizedText>{"/ Monat"}</LocalizedText></span></div>
        <p><small><LocalizedText>{"oder CHF "}</LocalizedText>{plan.yearly}<LocalizedText>{" / Jahr · exkl. MWST, sofern geschuldet"}</LocalizedText></small></p>
        <Button href={`/registrieren?plan=${plan.id}&billing=monthly`} variant={plan.popular?"primary":"secondary"}>{domainConfig.trialDays}<LocalizedText>{" Tage kostenlos testen"}</LocalizedText></Button><Link className="marketing-text-link" href={`/registrieren?plan=${plan.id}&billing=yearly`}><LocalizedText>{"Jährlich starten"}</LocalizedText></Link>
        <ul>{plan.features.map(feature=><li key={feature}><Icon name="check" size={15}/><LocalizedText>{feature}</LocalizedText></li>)}</ul>
      </article>)}
    </div>
    <section className="pricing-foot"><div><h2><LocalizedText>{"Alle Pläne starten mit 14 Tagen Testphase."}</LocalizedText></h2><p><LocalizedText>{"Keine Kreditkarte nötig. Ohne aktiviertes Abo wechselt das Konto nach der Testphase in den Nur-Lesen-Modus; deine Daten bleiben erhalten."}</LocalizedText></p><small><LocalizedText>{"Geschäftskundenangebot. Alle Preise in CHF, exkl. gesetzlich geschuldeter MWST. Der verbindliche Gesamtbetrag wird vor dem kostenpflichtigen Abschluss im Stripe Checkout angezeigt."}</LocalizedText></small></div><Button href="/registrieren" variant="secondary"><LocalizedText>{"Jetzt starten"}</LocalizedText></Button></section>
  </main><MarketingFooter/></>;
}
