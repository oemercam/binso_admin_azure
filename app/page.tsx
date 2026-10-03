import Link from "next/link";
import { MarketingFooter, MarketingHeader, ProductPreview } from "@/components/marketing";
import { Button, Icon } from "@/components/ui";
import { useI18n } from "@/lib/i18n/provider";

const benefits=[
  ["users","Kunden","Kontakte und Historie sofort griffbereit."],
  ["receipt","Rechnungen","Erstellen, prüfen und Zahlungen verfolgen."],
  ["clock","Zeit","Arbeitszeit direkt dem richtigen Auftrag zuordnen."],
  ["card","Spesen","Belege unterwegs erfassen und sauber weitergeben."],
] as const;

const workflow=[
  ["01","Kunde","Kundendaten einmal sauber erfassen."],
  ["02","Angebot","Leistungen auswählen und Angebot erstellen."],
  ["03","Zeit","Aufwand während der Arbeit direkt erfassen."],
  ["04","Rechnung","Aus Leistungen und Zeit eine Rechnung erstellen."],
] as const;

const plans=[
  {name:"Start",price:"19",description:"Für Selbstständige und kleine Unternehmen.",features:["1 Benutzer","Kunden und Kontakte","Angebote und Rechnungen","Zahlungen","Produkte"],featured:false},
  {name:"Business",price:"49",description:"Für wachsende Schweizer KMU.",features:["Bis 20 Benutzer","Alle Start Funktionen","Mitarbeiter und Spesen","Zeiterfassung","Erweiterte Auswertungen"],featured:true},
  {name:"Pro",price:"89",description:"Für Unternehmen mit erweiterten Anforderungen.",features:["Mehr Benutzer","Alle Business Funktionen","Erweiterte Rollen","Prioritäts-Support","Zukünftige Integrationen"],featured:false},
] as const;

export default function Home() {
  "use client";
  const {locale,messages:m}=useI18n();
  const hero={de:["Mehr Zeit für das Wesentliche.","Kunden, Angebote, Rechnungen, Zahlungen, Mitarbeiter, Spesen und Arbeitszeiten – klar organisiert in einer modernen Business-App.","Schweizer Business-Software","In wenigen Minuten startklar"],fr:["Plus de temps pour l’essentiel.","Clients, offres, factures, paiements, collaborateurs, frais et temps de travail – clairement organisés dans une application moderne.","Logiciel de gestion suisse","Prêt en quelques minutes"],it:["Più tempo per ciò che conta.","Clienti, offerte, fatture, pagamenti, collaboratori, spese e ore di lavoro – organizzati con chiarezza in un’app moderna.","Software gestionale svizzero","Operativo in pochi minuti"],en:["More time for what matters.","Customers, quotes, invoices, payments, employees, expenses and working time – clearly organised in one modern business app.","Swiss business software","Ready in minutes"],tr:["Önemli işlere daha fazla zaman.","Müşteriler, teklifler, faturalar, ödemeler, çalışanlar, masraflar ve çalışma süreleri modern bir iş uygulamasında düzenli şekilde yönetilir.","İsviçre iş yazılımı","Dakikalar içinde hazır"]}[locale];
  const structuredData={
    "@context":"https://schema.org",
    "@type":"SoftwareApplication",
    name:"Binso One",
    applicationCategory:"BusinessApplication",
    operatingSystem:"Web, iOS PWA, Android PWA",
    offers:{
      "@type":"AggregateOffer",
      priceCurrency:"CHF",
      lowPrice:"19",
      highPrice:"89",
      offerCount:"3"
    },
    publisher:{
      "@type":"Organization",
      name:"Binso GmbH",
      url:"https://www.binso.ch",
      address:{
        "@type":"PostalAddress",
        streetAddress:"Weissbadstrasse 8b",
        postalCode:"9050",
        addressLocality:"Appenzell",
        addressCountry:"CH"
      }
    }
  };
  return <>
    <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
    <MarketingHeader/>
    <main>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">BINSO ONE</span>
          <h1>{hero[0]}</h1>
          <p className="hero-lead">{hero[1]}</p>
          <div className="hero-actions">
            <Button href="/registrieren">{m.marketing.trial}</Button>
            <Button href="/demo" variant="secondary">{m.marketing.demo}</Button>
          </div>
          <div className="trust-row">
            <span><Icon name="lock"/> {hero[2]}</span>
            <span><Icon name="clock"/> {hero[3]}</span>
          </div>
        </div>
        <ProductPreview/>
      </section>

      <section className="marketing-benefits" aria-label="Vorteile">
        {benefits.map(([icon,title,text])=><article key={title}>
          <span><Icon name={icon} size={18}/></span>
          <div><b>{title}</b><p>{text}</p></div>
        </article>)}
      </section>

      <section id="funktionen" className="marketing-section feature-showcase">
        <div className="feature-showcase-copy">
          <div className="section-intro">
            <span className="eyebrow">ALLES AN EINEM ORT</span>
            <h2>Einfach arbeiten. Ohne Umwege.</h2>
            <p>Die wichtigsten Abläufe eines Schweizer KMU sind in einer Oberfläche verbunden.</p>
          </div>
          <div className="feature-list">
            {[
              ["Kunden","Kontakte, Notizen und Belege zentral.","/kunden"],
              ["Angebote","Schnell erstellen und nachverfolgen.","/angebote"],
              ["Rechnungen","Saubere Vorschau und klare Status.","/rechnungen"],
              ["Zahlungen","Eingänge und offene Beträge im Blick.","/zahlungen"],
              ["Zeiterfassung","Timer oder manuelle Erfassung.","/zeit"],
              ["Mitarbeiter","Teamdaten und Zuständigkeiten.","/mitarbeiter"],
            ].map(([title,text,href])=><Link className="feature-list-link" href={href} key={title}><span><b>{title}</b><small>{text}</small></span><Icon name="arrow" size={15}/></Link>)}
          </div>
          <Link className="marketing-text-link" href="/produkt">Alle Funktionen ansehen <Icon name="arrow" size={15}/></Link>
        </div>
        <div className="section-product-shot desktop-shot">
          <iframe src="/preview/rechnungen" title="Binso One Rechnungen" tabIndex={-1}/>
        </div>
      </section>

      <section className="workflow-section">
        <div className="workflow-copy">
          <div className="section-intro">
            <span className="eyebrow">VOM KUNDEN BIS ZUR RECHNUNG</span>
            <h2>Ein Ablauf. Kein Systemwechsel.</h2>
            <p>Die wichtigsten Schritte bauen direkt aufeinander auf.</p>
          </div>
          <div className="workflow-list">
            {workflow.map(([nr,title,text])=><article key={nr}>
              <span>{nr}</span>
              <div><h3>{title}</h3><p>{text}</p></div>
            </article>)}
          </div>
        </div>
        <div className="section-product-shot mobile-shot">
          <iframe src="/preview/zeit" title="Binso One Zeiterfassung" tabIndex={-1}/>
        </div>
      </section>

      <section className="product-callout">
        <div>
          <span className="eyebrow">APP-FIRST</span>
          <h2>Auf Mobile wie eine echte App.</h2>
          <p>Klare Bottom Navigation, Touch-first Bedienung, sichere iOS Safe Areas und reduzierte Ansichten statt verkleinerter Desktop-Seiten.</p>
          <Button href="/demo">{m.marketing.demo}</Button>
        </div>
        <div className="mobile-callout-copy">
          <div><b>Start</b><span>Übersicht und Schnellzugriffe</span></div>
          <div><b>Kunden</b><span>Kontakte und Aktivitäten</span></div>
          <div><b>Belege</b><span>Angebote, Rechnungen, Zahlungen</span></div>
          <div><b>Zeit</b><span>Timer und Einträge</span></div>
          <div><b>Mehr</b><span>Produkte, Spesen, Team, Einstellungen</span></div>
        </div>
      </section>

      <section className="marketing-section pricing-section" id="preise">
        <div className="section-intro">
          <span className="eyebrow">PREISE</span>
          <h2>Einfach starten. Später erweitern.</h2>
          <p>Alle Pläne bleiben bewusst übersichtlich. Keine versteckten Pflichtmodule.</p>
        </div>
        <div className="pricing-grid marketing-pricing-grid">
          {plans.map(plan=><article className={plan.featured?"price-card featured":"price-card"} key={plan.name}>
            {plan.featured&&<span className="popular">BELIEBT</span>}
            <h3>{plan.name}</h3>
            <p>{plan.description}</p>
            <div className="price"><strong>CHF {plan.price}</strong><span>/ Monat</span></div>
            <Button href="/registrieren" variant={plan.featured?"primary":"secondary"}>30 Tage kostenlos testen</Button>
            <ul>{plan.features.map(feature=><li key={feature}><Icon name="check" size={14}/><span>{feature}</span></li>)}</ul>
          </article>)}
        </div>
      </section>

      <section id="sicherheit" className="marketing-section security-split">
        <div>
          <span className="eyebrow">SCHWEIZ</span>
          <h2>Entwickelt für Schweizer KMU.</h2>
          <p>Binso One wird von der Binso GmbH in Appenzell entwickelt. Klare Prozesse, reduzierte Oberfläche und Schweizer Schreibweise stehen im Mittelpunkt.</p>
        </div>
        <div className="security-points">
          <div><Icon name="lock"/><span><b>Sicher aufgebaut</b><small>Klare Rollen, getrennte Bereiche und nachvollziehbare Aktionen.</small></span></div>
          <div><Icon name="receipt"/><span><b>Für Schweizer Abläufe</b><small>CHF, Schweizer Datumsformat und KMU-orientierte Prozesse.</small></span></div>
          <div><Icon name="support"/><span><b>Direkter Support</b><small>Support direkt aus der Anwendung.</small></span></div>
        </div>
      </section>

      <section className="marketing-section faq-section">
        <div className="section-intro">
          <span className="eyebrow">FAQ</span>
          <h2>Die wichtigsten Fragen.</h2>
        </div>
        <div className="faq-list">
          <details><summary>Kann ich Binso One zuerst ausprobieren?</summary><p>Ja. Du kannst die Demo starten und die Oberfläche ohne produktive Firmendaten kennenlernen.</p></details>
          <details><summary>Brauche ich eine Kreditkarte für den Test?</summary><p>Nein. Für die Testphase ist keine Kreditkarte notwendig.</p></details>
          <details><summary>Funktioniert Binso One auf dem Smartphone?</summary><p>Ja. Mobile und PWA sind als eigene App-Oberfläche gestaltet und nicht als verkleinerte Desktop-Version.</p></details>
          <details><summary>Kann ich später den Plan wechseln?</summary><p>Ja. Der Plan kann später an die Grösse und Anforderungen deines Unternehmens angepasst werden.</p></details>
        </div>
      </section>

      <section className="marketing-cta">
        <div><span className="eyebrow">BINSO ONE</span><h2>Einfach selbst ansehen.</h2><p>Starte direkt mit der Demo oder richte dein eigenes Konto ein.</p></div>
        <div><Button href="/registrieren">30 Tage kostenlos testen</Button><Button href="/demo" variant="secondary">{m.marketing.demo}</Button></div>
      </section>
    </main>
    <MarketingFooter/>
  </>;
}
