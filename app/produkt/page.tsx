import { MarketingFooter, MarketingHeader, ProductPreview } from "@/components/marketing";
import { Button, Icon } from "@/components/ui";

const modules=[
  ["users","Kunden","Kundendaten, Kontakte, Belege und Aktivitäten an einem Ort."],
  ["file","Angebote","Angebote erstellen und mit einem Schritt in Rechnungen übernehmen."],
  ["receipt","Rechnungen","Responsive Live-Vorschau, klare Status und schnelle Zahlungserfassung."],
  ["wallet","Zahlungen","Zahlungseingänge zuordnen und offene Beträge sofort erkennen."],
  ["users","Mitarbeiter","Team und Rollen übersichtlich verwalten."],
  ["card","Spesen","Belege mobil erfassen, prüfen und freigeben."],
  ["clock","Zeiterfassung","Arbeitszeit per Timer oder manuell erfassen."],
  ["box","Produkte","Produkte und Dienstleistungen für Angebote und Rechnungen pflegen."],
  ["support","Support","Tickets direkt in Binso One erstellen und nachverfolgen."],
];

export default function Product(){
  return <><MarketingHeader/><main className="subpage product-page">
    <div className="subhero"><span className="eyebrow">PRODUKT</span><h1>Eine Plattform. Klare Prozesse.</h1><p>Binso One verbindet die wichtigsten Abläufe deines Unternehmens – vom ersten Kundenkontakt bis zur Zahlung.</p><div className="hero-actions"><Button href="/registrieren">30 Tage kostenlos testen</Button><Button href="/demo" variant="secondary">Demo öffnen</Button></div></div>
    <ProductPreview/>
    <section className="workflow-section">
      <span className="eyebrow">EIN DURCHGÄNGIGER ABLAUF</span>
      <div className="workflow-strip">
        {[
          ["01","Kunde","Stammdaten einmal erfassen"],
          ["02","Angebot","Leistungen auswählen"],
          ["03","Rechnung","Daten direkt übernehmen"],
          ["04","Zahlung","Eingang zuordnen"],
        ].map(([n,t,p],i)=><article key={n}><span>{n}</span><div><b>{t}</b><small>{p}</small></div>{i<3&&<Icon name="arrow" size={18}/>}</article>)}
      </div>
    </section>
    <div className="feature-grid large">{modules.map(([i,t,p])=><article key={t}><span className="feature-icon"><Icon name={i}/></span><h3>{t}</h3><p>{p}</p></article>)}</div>
    <section className="product-cta"><div><span className="eyebrow">BINSO ONE</span><h2>Bereit für weniger Administration?</h2><p>Starte mit realistischen Beispieldaten oder teste Binso One 30 Tage kostenlos.</p></div><div><Button href="/registrieren">Kostenlos testen</Button><Button href="/demo" variant="secondary">Demo ansehen</Button></div></section>
  </main><MarketingFooter/></>
}