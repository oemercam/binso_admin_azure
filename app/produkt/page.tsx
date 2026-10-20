import {localizeMetadata} from "@/lib/server/locale";
import {LocalizedText} from "@/lib/client/locale";
import type { Metadata } from "next";
import { MarketingFooter, MarketingHeader, ProductPreview } from "@/components/marketing";
import { Button, Icon } from "@/components/ui";
import {domainConfig} from "@/config/domain";


const baseMetadata: Metadata = {
  title: "Produkt – Business-Software für Schweizer KMU",
  description: "Binso One verbindet Kunden, Angebote, Rechnungen, Zahlungen, Zeiterfassung, Spesen und Mitarbeiter in einer klaren Business-Plattform für Schweizer KMU.",
  alternates: { canonical: "/produkt" },
  openGraph: { title: "Binso One Produkt", description: "Eine Plattform für die wichtigsten Abläufe Schweizer KMU.", url: "/produkt", images: ["/opengraph-image"] },
};
export async function generateMetadata():Promise<Metadata>{return localizeMetadata(baseMetadata,"/produkt");}

const modules=[
  ["users","Kunden","Kontakte, Aktivitäten und Finanzen zentral."],
  ["file","Angebote","Erstellen, prüfen und nachverfolgen."],
  ["receipt","Rechnungen","Live-Vorschau und klare Status."],
  ["wallet","Zahlungen","Eingänge und offene Beträge."],
  ["clock","Zeiterfassung","Timer oder manuelle Erfassung."],
  ["card","Spesen","Quittungen mobil erfassen."],
  ["users","Mitarbeiter","Team und Rollen verwalten."],
  ["box","Produkte","Produkte und Dienstleistungen pflegen."],
] as const;

export default function Product(){
  return <><MarketingHeader/><main className="subpage product-page">
    <section className="product-subhero">
      <div className="subhero-copy">
        <span className="eyebrow"><LocalizedText>{"PRODUKT"}</LocalizedText></span>
        <h1><LocalizedText>{"Eine Plattform. Klare Prozesse."}</LocalizedText></h1>
        <p><LocalizedText>{"Binso One verbindet die wichtigsten Abläufe deines Unternehmens – vom ersten Kundenkontakt bis zur Zahlung."}</LocalizedText></p>
        <div className="reference-actions"><Button href="/registrieren">{domainConfig.trialDays}<LocalizedText>{" Tage kostenlos testen"}</LocalizedText></Button><Button href="/preise" variant="secondary"><LocalizedText>{"Tarife vergleichen"}</LocalizedText></Button></div>
      </div>
      <ProductPreview/>
    </section>

    <section className="product-workflow-block">
      <div className="section-intro">
        <span className="eyebrow"><LocalizedText>{"EIN DURCHGÄNGIGER ABLAUF"}</LocalizedText></span>
        <h2><LocalizedText>{"Vom Kunden bis zur Zahlung."}</LocalizedText></h2>
        <p><LocalizedText>{"Jeder Schritt baut auf den vorhandenen Daten auf."}</LocalizedText></p>
      </div>
      <div className="workflow-list">
        {[
          ["01","Kunde","Stammdaten einmal erfassen"],
          ["02","Angebot","Leistungen auswählen"],
          ["03","Rechnung","Daten direkt übernehmen"],
          ["04","Zahlung","Eingang zuordnen"],
        ].map(([n,t,p])=><article key={n}><span>{n}</span><div><h3>{t}</h3><p>{p}</p></div></article>)}
      </div>
    </section>

    <section className="product-modules">
      <div className="section-intro">
        <span className="eyebrow"><LocalizedText>{"FUNKTIONEN"}</LocalizedText></span>
        <h2><LocalizedText>{"Nur was im Alltag gebraucht wird."}</LocalizedText></h2>
      </div>
      <div className="product-module-list">
        {modules.map(([icon,title,text])=><div key={title}><span><Icon name={icon} size={17}/></span><div><b><LocalizedText>{title}</LocalizedText></b><small><LocalizedText>{text}</LocalizedText></small></div><Icon name="arrow" size={15}/></div>)}
      </div>
    </section>

    <section className="marketing-cta product-page-cta">
      <div><span className="eyebrow"><LocalizedText>{"BINSO ONE"}</LocalizedText></span><h2><LocalizedText>{"Selbst ausprobieren."}</LocalizedText></h2><p><LocalizedText>{"Teste Binso One 14 Tage kostenlos mit deinem eigenen Unternehmen."}</LocalizedText></p></div>
      <div><Button href="/registrieren">{domainConfig.trialDays}<LocalizedText>{" Tage kostenlos testen"}</LocalizedText></Button><Button href="/preise" variant="secondary"><LocalizedText>{"Tarife vergleichen"}</LocalizedText></Button></div>
    </section>
  </main><MarketingFooter/></>
}
