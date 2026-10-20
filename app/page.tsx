import {plans as subscriptionPlans} from "@/lib/plans";
import {LocalizedText} from "@/lib/client/locale";
import {MarketingHeader,MarketingFooter,ProductPreview,ReferenceFeatures,ProductCapabilities} from "@/components/marketing";
import {Button} from "@/components/ui";

export default function Home(){
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

 return <><script type="application/ld+json">{JSON.stringify(structuredData)}</script><MarketingHeader/><main className="reference-landing">
  <section className="reference-hero">
   <div><div className="eyebrow"><LocalizedText>{"DEIN SCHWEIZER GESCHÄFTSALLTAG"}</LocalizedText></div><h1><LocalizedText>{"Dein Geschäft."}</LocalizedText><br/><LocalizedText>{"Ein klarer"}</LocalizedText><br/><LocalizedText>{"Überblick."}</LocalizedText></h1><p><LocalizedText>{"Von der ersten Anfrage bis zur bezahlten Rechnung. Organisiere Kunden, Aufträge und Finanzen in einem Arbeitsbereich."}</LocalizedText></p><div className="reference-actions"><Button href="/registrieren"><LocalizedText>{"14 Tage kostenlos testen"}</LocalizedText></Button><Button href="/produkt" variant="secondary"><LocalizedText>{"Funktionen ansehen"}</LocalizedText></Button></div><small><LocalizedText>{"Web & PWA · Am Schreibtisch und unterwegs"}</LocalizedText></small></div>
   <ProductPreview/>
  </section>
  <ProductCapabilities/>
  <section className="reference-section" id="funktionen"><div className="eyebrow"><LocalizedText>{"EIN ZUSAMMENHÄNGENDER ARBEITSABLAUF"}</LocalizedText></div><h2><LocalizedText>{"Weniger wechseln."}</LocalizedText><br/><LocalizedText>{"Mehr erledigen."}</LocalizedText></h2><p className="reference-muted"><LocalizedText>{"Informationen bleiben dort verbunden, wo du sie brauchst."}</LocalizedText></p><ReferenceFeatures/></section>
  <section className="reference-section reference-divider" id="ablauf"><h2><LocalizedText>{"Ein Ablauf. Vom Kontakt bis zur Zahlung."}</LocalizedText></h2><div className="reference-workflow">{[
   ['01','Kunde','Kontakt erfassen und Informationen bündeln.'],['02','Angebot','Leistungen anbieten und den Entscheid verfolgen.'],['03','Auftrag & Zeit','Arbeiten organisieren und Leistungen erfassen.'],['04','Rechnung','Positionen übernehmen und Rechnung erstellen.'],['05','Zahlung','Zahlungseingänge und offene Beträge verfolgen.']
  ].map(([number,title,text])=><div key={number}><span>{number}</span><h3><LocalizedText>{title}</LocalizedText></h3><p className="reference-muted"><LocalizedText>{text}</LocalizedText></p></div>)}</div></section>
  <section className="reference-section reference-divider reference-split"><div><div className="eyebrow"><LocalizedText>{"PASSEND ZU DEINEM ARBEITSTAG"}</LocalizedText></div><h2><LocalizedText>{"Im Büro die Übersicht."}</LocalizedText><br/><LocalizedText>{"Unterwegs direkt handeln."}</LocalizedText></h2><p className="reference-muted"><LocalizedText>{"Eine grosszügige Desktop-Arbeitsfläche und eine eigene mobile Bedienung für Smartphone und PWA."}</LocalizedText></p></div><div><details open><summary><LocalizedText>{"Desktop-Arbeitsbereich"}</LocalizedText></summary><p><LocalizedText>{"Klare Navigation, übersichtliche Daten und kontextbezogene Aktionen."}</LocalizedText></p></details><details><summary><LocalizedText>{"Mobile & PWA"}</LocalizedText></summary><p><LocalizedText>{"Kompakte Ansichten für Kundendaten, Zeiterfassung und schnelle Aufgaben unterwegs."}</LocalizedText></p></details><details><summary><LocalizedText>{"Schweizer Geschäftsalltag"}</LocalizedText></summary><p><LocalizedText>{"CHF, MWST und QR-Rechnungen"}</LocalizedText></p></details></div></section>
  <section className="reference-section reference-divider reference-split" id="plans"><div><div className="eyebrow">START · BUSINESS · PRO</div><h2><LocalizedText>{"Der passende Umfang"}</LocalizedText><br/><LocalizedText>{"für dein Unternehmen."}</LocalizedText></h2><p className="reference-muted"><LocalizedText>{"Monatlich oder jährlich. Lerne BINSO ONE im 14-tägigen Test kennen."}</LocalizedText></p><Button href="/preise" variant="secondary"><LocalizedText>{"Tarife vergleichen →"}</LocalizedText></Button></div><div><h3><LocalizedText>{"Häufige Fragen"}</LocalizedText></h3><details><summary><LocalizedText>{"Kann ich Binso One zuerst ausprobieren?"}</LocalizedText></summary><p><LocalizedText>{"Ja. Du kannst Binso One 14 Tage kostenlos mit deinem eigenen Unternehmen testen. Eine Kreditkarte ist zum Testbeginn nicht erforderlich."}</LocalizedText></p></details><details><summary><LocalizedText>{"Kann mein Team mitarbeiten?"}</LocalizedText></summary><p><LocalizedText>{"Benutzerrollen und gemeinsame Firmen-Arbeitsbereiche"}</LocalizedText></p></details><details><summary><LocalizedText>{"Muss ich eine App installieren?"}</LocalizedText></summary><p><LocalizedText>{"Du kannst BINSO ONE im Browser nutzen. Die PWA ermöglicht den Zugriff vom Homescreen."}</LocalizedText></p></details></div></section>
  <section className="reference-closing reference-divider"><h2><LocalizedText>{"Bring Klarheit in deinen Geschäftsalltag."}</LocalizedText></h2><div className="reference-actions"><Button href="/registrieren"><LocalizedText>{"14 Tage testen"}</LocalizedText></Button><Button href="/preise" variant="secondary"><LocalizedText>{"Tarife vergleichen"}</LocalizedText></Button></div></section>
 </main><MarketingFooter/></>;
}
