import {LocalizedText,LocalizedElement} from "@/lib/client/locale";
import Link from "next/link";
import { MarketingFooter, MarketingHeader, MarketingFaq, ProductPreview, ProductScreen, ProductGallery } from "@/components/marketing";
import { Button, Icon } from "@/components/ui";
import { domainConfig } from "@/config/domain";
import { plans as subscriptionPlans } from "@/lib/plans";

const benefits=[
  ["users","Kunden","Kontakte und Historie sofort griffbereit."],
  ["receipt","Rechnungen","Erstellen, prüfen und Zahlungen verfolgen."],
  ["clock","Zeit","Arbeitszeit direkt dem richtigen Auftrag zuordnen."],
  ["card","Spesen","Quittungen unterwegs erfassen und sauber weitergeben."],
] as const;

const workflow=[
  ["01","Kunde","Kundendaten einmal sauber erfassen."],
  ["02","Angebot","Leistungen auswählen und Angebot erstellen."],
  ["03","Projekt & Zeit","Arbeit organisieren und Leistungen erfassen."],
  ["04","Rechnung","Aus Leistungen und Zeit eine Rechnung erstellen."],
  ["05","Zahlung","Zahlungseingänge und offene Beträge verfolgen."],
] as const;

export default function Home() {
  const structuredData={
    "@context":"https://schema.org",
    "@graph":[{
    "@type":"SoftwareApplication",
    name:"Binso One",
    applicationCategory:"BusinessApplication",
    operatingSystem:"Web, iOS PWA, Android PWA",
    offers:{
      "@type":"AggregateOffer",
      priceCurrency:"CHF",
      lowPrice:String(Math.min(...subscriptionPlans.map(plan=>plan.monthly))),
      highPrice:String(Math.max(...subscriptionPlans.map(plan=>plan.monthly))),
      offerCount:"3"
    },
    publisher:{"@id":"https://www.binso.ch/#organization"}
    },{
      "@type":"Organization",
      "@id":"https://www.binso.ch/#organization",
      name:"Binso GmbH",
      url:"https://www.binso.ch",
      logo:"https://www.binso.ch/brand/logo-black.svg",
      address:{
        "@type":"PostalAddress",
        streetAddress:"Weissbadstrasse 8b",
        postalCode:"9050",
        addressLocality:"Appenzell",
        addressCountry:"CH"
      }
    },{
      "@type":"WebSite",
      "@id":"https://www.binso.ch/#website",
      url:"https://www.binso.ch",
      name:"Binso One",
      publisher:{"@id":"https://www.binso.ch/#organization"},
      inLanguage:["de-CH","fr-CH","it-CH","en-CH"]
    }]
  };
  return <>
    <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
    <MarketingHeader/>
    <main>
      <section className="hero flow-marketing-hero">
        <div className="hero-copy">
          <span className="eyebrow landing-kicker"><span/><LocalizedText>{" DEIN BUSINESS. KLAR ORGANISIERT."}</LocalizedText></span>
          <h1><LocalizedText>{"Dein Geschäft."}</LocalizedText><br/><LocalizedText>{"Ein klarer Überblick."}</LocalizedText></h1>
          <p className="hero-lead"><LocalizedText>{"Vom ersten Kundenkontakt bis zur bezahlten Rechnung. Eine übersichtliche App für dein Unternehmen – am Schreibtisch und unterwegs."}</LocalizedText></p>
          <div className="hero-actions">
            <Button href="/registrieren">{domainConfig.trialDays}<LocalizedText>{" Tage kostenlos testen"}</LocalizedText></Button>
            <Button href="/demo" variant="secondary"><LocalizedText>{"Demo starten"}</LocalizedText></Button>
          </div>
          <div className="trust-row">
            <span><Icon name="lock"/><LocalizedText>{" Keine Kreditkarte für die Testphase"}</LocalizedText></span>
            <span><Icon name="clock"/><LocalizedText>{" 14 Tage testen · danach selbst entscheiden"}</LocalizedText></span>
          </div>
        </div>
        <div className="flow-product-stack"><div className="flow-product-note"><Icon name="receipt"/><h2><LocalizedText>{"Rechnungen"}</LocalizedText></h2><p><LocalizedText>{"Erstellen, prüfen und Zahlungen verfolgen."}</LocalizedText></p></div><div className="flow-product-note"><Icon name="clock"/><h2><LocalizedText>{"Zeiterfassung"}</LocalizedText></h2><p><LocalizedText>{"Zeit dort erfassen, wo sie entsteht."}</LocalizedText></p></div></div>
      </section>

      <LocalizedElement as="section" className="marketing-benefits" aria-label="Vorteile">
        {benefits.map(([icon,title,text])=><article key={title}>
          <span><Icon name={icon} size={18}/></span>
          <div><b><LocalizedText>{title}</LocalizedText></b><p><LocalizedText>{text}</LocalizedText></p></div>
        </article>)}
      </LocalizedElement>

      <section id="funktionen" className="marketing-section feature-showcase">
        <div className="feature-showcase-copy">
          <div className="section-intro">
            <span className="eyebrow"><LocalizedText>{"ALLES AN EINEM ORT"}</LocalizedText></span>
            <h2><LocalizedText>{"Einfach arbeiten. Ohne Umwege."}</LocalizedText></h2>
            <p><LocalizedText>{"Die wichtigsten Abläufe eines Schweizer KMU sind in einer Oberfläche verbunden."}</LocalizedText></p>
          </div>
          <div className="feature-list">
            {[
              ["Kunden","Kontakte, Notizen und Finanzen zentral.","/kunden"],
              ["Angebote","Schnell erstellen und nachverfolgen.","/angebote"],
              ["Rechnungen","Saubere Vorschau und klare Status.","/rechnungen"],
              ["Zahlungen","Eingänge und offene Beträge im Blick.","/zahlungen"],
              ["Zeiterfassung","Timer oder manuelle Erfassung.","/zeit"],
              ["Mitarbeiter","Teamdaten und Zuständigkeiten.","/mitarbeiter"],
            ].map(([title,text,href])=><Link className="feature-list-link" href={href} key={title}><span><b><LocalizedText>{title}</LocalizedText></b><small><LocalizedText>{text}</LocalizedText></small></span><Icon name="arrow" size={15}/></Link>)}
          </div>
          <Link className="marketing-text-link" href="/produkt"><LocalizedText>{"Alle Funktionen ansehen "}</LocalizedText><Icon name="arrow" size={15}/></Link>
        </div>
        <ProductGallery/>
      </section>

      <section className="workflow-section">
        <div className="workflow-copy">
          <div className="section-intro">
            <span className="eyebrow"><LocalizedText>{"VOM KUNDEN BIS ZUR RECHNUNG"}</LocalizedText></span>
            <h2><LocalizedText>{"Ein Ablauf. Kein Systemwechsel."}</LocalizedText></h2>
            <p><LocalizedText>{"Die wichtigsten Schritte bauen direkt aufeinander auf."}</LocalizedText></p>
          </div>
          <div className="workflow-list">
            {workflow.map(([nr,title,text])=><article key={nr}>
              <span>{nr}</span>
              <div><h3><LocalizedText>{title}</LocalizedText></h3><p><LocalizedText>{text}</LocalizedText></p></div>
            </article>)}
          </div>
        </div>
        <ProductScreen screen="invoices" title="Binso One Rechnungsübersicht" variant="desktop"/>
      </section>

      <section className="product-callout">
        <div>
          <span className="eyebrow"><LocalizedText>{"DEIN BÜRO FÜR UNTERWEGS"}</LocalizedText></span>
          <h2><LocalizedText>{"Gleicher Überblick. Überall."}</LocalizedText></h2>
          <p><LocalizedText>{"Kunden nachschlagen, Zeit erfassen und Rechnungen prüfen. Direkt auf deinem Smartphone oder als installierbare Web-App."}</LocalizedText></p>
          <Button href="/demo"><LocalizedText>{"Demo starten"}</LocalizedText></Button>
        </div>
        <figure className="landing-phone-preview"><ProductPreview compact/><figcaption><LocalizedText>{"Die wichtigsten Aufgaben immer griffbereit."}</LocalizedText></figcaption></figure>
      </section>

      <section className="marketing-section pricing-section" id="preise">
        <div className="section-intro">
          <span className="eyebrow"><LocalizedText>{"PREISE"}</LocalizedText></span>
          <h2><LocalizedText>{"Einfach starten. Später erweitern."}</LocalizedText></h2>
          <p><LocalizedText>{"Alle Pläne bleiben bewusst übersichtlich. Keine versteckten Pflichtmodule."}</LocalizedText></p>
        </div>
        <div className="pricing-grid marketing-pricing-grid">
          {subscriptionPlans.map(plan=><article className={plan.popular?"price-card featured":"price-card"} key={plan.id}>
            {plan.popular&&<span className="popular"><LocalizedText>{"BELIEBT"}</LocalizedText></span>}
            <h3>{plan.name}</h3>
            <p><LocalizedText>{plan.description}</LocalizedText></p>
            <div className="price"><strong><LocalizedText>{"CHF "}</LocalizedText>{plan.monthly}</strong><span><LocalizedText>{"/ Monat"}</LocalizedText></span></div><p><small><LocalizedText>{"oder CHF "}</LocalizedText>{plan.yearly}<LocalizedText>{" / Jahr · exkl. MWST, sofern geschuldet"}</LocalizedText></small></p>
            <Button href={`/registrieren?plan=${plan.id}&billing=monthly`} variant={plan.popular?"primary":"secondary"}>{domainConfig.trialDays}<LocalizedText>{" Tage kostenlos testen"}</LocalizedText></Button><Link className="marketing-text-link" href={`/registrieren?plan=${plan.id}&billing=yearly`}><LocalizedText>{"Jährlich starten"}</LocalizedText></Link>
            <ul>{plan.features.map(feature=><li key={feature}><Icon name="check" size={14}/><span><LocalizedText>{feature}</LocalizedText></span></li>)}</ul>
          </article>)}
        </div>
      </section>

      <section id="sicherheit" className="marketing-section security-split">
        <div>
          <span className="eyebrow"><LocalizedText>{"SCHWEIZ"}</LocalizedText></span>
          <h2><LocalizedText>{"Entwickelt für Schweizer KMU."}</LocalizedText></h2>
          <p><LocalizedText>{"Binso One wird von der Binso GmbH in Appenzell entwickelt. Klare Prozesse, reduzierte Oberfläche und Schweizer Schreibweise stehen im Mittelpunkt."}</LocalizedText></p>
        </div>
        <div className="security-points">
          <div><Icon name="lock"/><span><b><LocalizedText>{"Sicher aufgebaut"}</LocalizedText></b><small><LocalizedText>{"Klare Rollen, getrennte Bereiche und nachvollziehbare Aktionen."}</LocalizedText></small></span></div>
          <div><Icon name="receipt"/><span><b><LocalizedText>{"Für Schweizer Abläufe"}</LocalizedText></b><small><LocalizedText>{"CHF, Schweizer Datumsformat und KMU-orientierte Prozesse."}</LocalizedText></small></span></div>
          <div><Icon name="support"/><span><b><LocalizedText>{"Direkter Support"}</LocalizedText></b><small><LocalizedText>{"Support direkt aus der Anwendung."}</LocalizedText></small></span></div>
        </div>
      </section>

      <section className="marketing-section faq-section">
        <div className="section-intro">
          <span className="eyebrow"><LocalizedText>{"FAQ"}</LocalizedText></span>
          <h2><LocalizedText>{"Die wichtigsten Fragen."}</LocalizedText></h2>
        </div>
        <MarketingFaq>
          <details><summary><LocalizedText>{"Kann ich Binso One zuerst ausprobieren?"}</LocalizedText></summary><p><LocalizedText>{"Ja. Du kannst die Demo starten und die Oberfläche ohne produktive Firmendaten kennenlernen."}</LocalizedText></p></details>
          <details><summary><LocalizedText>{"Brauche ich eine Kreditkarte für den Test?"}</LocalizedText></summary><p><LocalizedText>{"Nein. Die 14-tägige Testphase startet ohne Kreditkarte. Erst wenn du einen Plan aktivierst, wirst du zu Stripe Checkout weitergeleitet."}</LocalizedText></p></details><details><summary><LocalizedText>{"Was passiert nach den 14 Tagen?"}</LocalizedText></summary><p><LocalizedText>{"Ohne aktiviertes Abo bleibt dein Konto erhalten, wechselt aber in den Nur-Lesen-Modus. Du kannst danach jederzeit einen Plan aktivieren und weiterarbeiten."}</LocalizedText></p></details>
          <details><summary><LocalizedText>{"Funktioniert Binso One auf dem Smartphone?"}</LocalizedText></summary><p><LocalizedText>{"Ja. Mobile und PWA sind als eigene App-Oberfläche gestaltet und nicht als verkleinerte Desktop-Version."}</LocalizedText></p></details>
          <details><summary><LocalizedText>{"Kann ich mein Abo kündigen?"}</LocalizedText></summary><p><LocalizedText>{"Ja. Ein aktives Abonnement kann über das bereitgestellte Stripe Customer Portal auf das Ende der laufenden Abrechnungsperiode gekündigt werden. Der bezahlte Zugriff bleibt bis dahin bestehen."}</LocalizedText></p></details>
        </MarketingFaq>
      </section>

      <section className="marketing-cta">
        <div><span className="eyebrow"><LocalizedText>{"BINSO ONE"}</LocalizedText></span><h2><LocalizedText>{"Einfach selbst ansehen."}</LocalizedText></h2><p><LocalizedText>{"Starte direkt mit der Demo oder richte dein eigenes Konto ein."}</LocalizedText></p></div>
        <div><Button href="/registrieren">{domainConfig.trialDays}<LocalizedText>{" Tage kostenlos testen"}</LocalizedText></Button><Button href="/demo" variant="secondary"><LocalizedText>{"Demo starten"}</LocalizedText></Button></div>
      </section>
    </main>
    <MarketingFooter/>
  </>;
}
