import type { Metadata } from "next";
import { MarketingFooter, MarketingHeader, ProductPreview } from "@/components/marketing";
import { Button, Icon } from "@/components/ui";
import {domainConfig} from "@/config/domain";


export const metadata: Metadata = {
  title: "Produkt – Business-Software für Schweizer KMU",
  description: "Binso One verbindet Kunden, Angebote, Rechnungen, Zahlungen, Zeiterfassung, Spesen und Mitarbeiter in einer klaren Business-Plattform für Schweizer KMU.",
  alternates: { canonical: "/produkt" },
  openGraph: { title: "Binso One Produkt", description: "Eine Plattform für die wichtigsten Abläufe Schweizer KMU.", url: "/produkt", images: ["/opengraph-image"] },
};
const modules=[
  ["users","Kunden","Kontakte, Aktivitäten und Belege zentral."],
  ["file","Angebote","Erstellen, prüfen und nachverfolgen."],
  ["receipt","Rechnungen","Live-Vorschau und klare Status."],
  ["wallet","Zahlungen","Eingänge und offene Beträge."],
  ["clock","Zeiterfassung","Timer oder manuelle Erfassung."],
  ["card","Spesen","Belege mobil erfassen."],
  ["users","Mitarbeiter","Team und Rollen verwalten."],
  ["box","Produkte","Produkte und Dienstleistungen pflegen."],
] as const;

export default function Product(){
  return <><MarketingHeader/><main className="subpage product-page">
    <section className="product-subhero">
      <div className="subhero-copy">
        <span className="eyebrow">PRODUKT</span>
        <h1>Eine Plattform. Klare Prozesse.</h1>
        <p>Binso One verbindet die wichtigsten Abläufe deines Unternehmens – vom ersten Kundenkontakt bis zur Zahlung.</p>
        <div className="hero-actions"><Button href="/registrieren">{domainConfig.trialDays} Tage kostenlos testen</Button><Button href="/demo" variant="secondary">Demo starten</Button></div>
      </div>
      <ProductPreview/>
    </section>

    <section className="product-workflow-block">
      <div className="section-intro">
        <span className="eyebrow">EIN DURCHGÄNGIGER ABLAUF</span>
        <h2>Vom Kunden bis zur Zahlung.</h2>
        <p>Jeder Schritt baut auf den vorhandenen Daten auf.</p>
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
        <span className="eyebrow">FUNKTIONEN</span>
        <h2>Nur was im Alltag gebraucht wird.</h2>
      </div>
      <div className="product-module-list">
        {modules.map(([icon,title,text])=><div key={title}><span><Icon name={icon} size={17}/></span><div><b>{title}</b><small>{text}</small></div><Icon name="arrow" size={15}/></div>)}
      </div>
    </section>

    <section className="marketing-cta product-page-cta">
      <div><span className="eyebrow">BINSO ONE</span><h2>Selbst ausprobieren.</h2><p>Starte direkt mit der Demo oder richte dein eigenes Konto ein.</p></div>
      <div><Button href="/registrieren">{domainConfig.trialDays} Tage kostenlos testen</Button><Button href="/demo" variant="secondary">Demo starten</Button></div>
    </section>
  </main><MarketingFooter/></>
}
