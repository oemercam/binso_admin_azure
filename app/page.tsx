import Link from "next/link";
import { MarketingFooter, MarketingHeader, ProductPreview } from "@/components/marketing";
import { Button, Icon } from "@/components/ui";

export default function Home() {
  return <>
    <MarketingHeader/>
    <main>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">BINSO ONE</span>
          <h1>Mehr Zeit für das Wesentliche.</h1>
          <p className="hero-lead">Kunden, Angebote, Rechnungen, Zahlungen, Mitarbeiter, Spesen und Arbeitszeiten – einfach organisiert in einer modernen Business-App.</p>
          <div className="hero-actions">
            <Button href="/registrieren">30 Tage kostenlos testen</Button>
            <Button href="/demo" variant="secondary">Demo ansehen</Button>
          </div>
          <div className="trust-row">
            <span><Icon name="lock"/> Schweizer Software</span>
            <span><Icon name="clock"/> In wenigen Minuten startklar</span>
          </div>
        </div>
        <ProductPreview/>
      </section>

      <section id="funktionen" className="marketing-section">
        <div className="section-intro">
          <span className="eyebrow">ALLES AN EINEM ORT</span>
          <h2>Einfach arbeiten. Ohne Umwege.</h2>
          <p>Jeder Prozess ist so aufgebaut, dass du mit möglichst wenigen Klicks ans Ziel kommst.</p>
        </div>
        <div className="feature-grid">
          {[
            ["users","Kunden","Kontakte und Aktivitäten zentral verwalten."],
            ["file","Angebote","Professionelle Angebote in wenigen Schritten."],
            ["receipt","Rechnungen","Erstellen, Vorschau prüfen und versenden."],
            ["wallet","Zahlungen","Offene und bezahlte Rechnungen im Blick."],
            ["clock","Zeiterfassung","Timer starten und Arbeitszeit direkt zuordnen."],
            ["card","Spesen","Belege mobil erfassen und freigeben."],
            ["box","Produkte","Produkte und Dienstleistungen zentral pflegen."],
            ["support","Support","Hilfe direkt in der App – nachvollziehbar und schnell."],
          ].map(([icon,title,txt])=><article key={title}><span className="feature-icon"><Icon name={icon}/></span><h3>{title}</h3><p>{txt}</p></article>)}
        </div>
      </section>

      <section className="product-callout">
        <div>
          <span className="eyebrow">APP-FIRST</span>
          <h2>Auf dem iPhone wie eine echte App.</h2>
          <p>Keine seitliche Navigation, keine verkleinerte Desktop-Ansicht. Binso One nutzt auf Mobile eine klare Bottom Navigation, Touch-first Bedienung und sichere iOS Safe Areas.</p>
          <Button href="/demo">Mobile Demo ansehen</Button>
        </div>
        <div className="phone-showcase">
          <div className="mini-phone">
            <span>9:41</span>
            <h3>Guten Morgen,<br/>Thomas!</h3>
            <div className="mini-kpi">Umsatz <b>CHF 24’500</b></div>
            <div className="mini-kpi">Offene Rechnungen <b>8</b></div>
            <nav><Icon name="home"/><Icon name="users"/><Icon name="receipt"/><Icon name="clock"/><Icon name="more"/></nav>
          </div>
        </div>
      </section>

      <section id="sicherheit" className="marketing-section compact">
        <div className="section-intro">
          <span className="eyebrow">BINSO GMBH</span>
          <h2>Entwickelt und betrieben in der Schweiz.</h2>
          <p>Binso One wird von der Binso GmbH in Appenzell entwickelt und betrieben.</p>
        </div>
      </section>
    </main>
    <MarketingFooter/>
  </>;
}