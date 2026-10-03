"use client";

import { MarketingFooter, MarketingHeader } from "@/components/marketing";
import { Button, Icon } from "@/components/ui";
import { useI18n } from "@/lib/i18n/provider";

const plans=[
  {n:"Start",p:"19",d:"Für Selbstständige und kleine Unternehmen.",f:["1 Benutzer","Kunden und Kontakte","Angebote und Rechnungen","Zahlungen","Produkte"]},
  {n:"Business",p:"49",d:"Für wachsende Schweizer KMU.",f:["Bis 20 Benutzer","Alle Start Funktionen","Mitarbeiter und Spesen","Zeiterfassung","Erweiterte Auswertungen"],hot:true},
  {n:"Pro",p:"89",d:"Für Unternehmen mit erweiterten Anforderungen.",f:["Mehr Benutzer","Alle Business Funktionen","Erweiterte Rollen","Prioritäts-Support","Zukünftige Integrationen"]},
];

export default function Prices(){
  const {locale,messages:m}=useI18n();
  const t={de:["Einfach. Transparent. Fair.","30 Tage kostenlos testen. Kein komplizierter Einstieg, klare monatliche Preise und jederzeit einsehbarer Plan.","BELIEBT","/ Monat","Demo starten"],fr:["Simple. Transparent. Équitable.","Essayez gratuitement pendant 30 jours. Une mise en route simple, des prix mensuels clairs et un plan toujours visible.","POPULAIRE","/ mois","Démarrer la démo"],it:["Semplice. Trasparente. Equo.","Prova gratis per 30 giorni. Avvio semplice, prezzi mensili chiari e piano sempre visibile.","POPOLARE","/ mese","Avvia demo"],en:["Simple. Transparent. Fair.","Try free for 30 days. Simple onboarding, clear monthly pricing and a plan you can view at any time.","POPULAR","/ month","Start demo"],tr:["Basit. Şeffaf. Adil.","30 gün ücretsiz deneyin. Kolay başlangıç, net aylık fiyatlar ve her zaman görülebilen plan.","POPÜLER","/ ay","Demoyu başlat"]}[locale];
  return <><MarketingHeader/><main className="subpage pricing-page">
    <div className="subhero"><span className="eyebrow">PREISE</span><h1>{t[0]}</h1><p>{t[1]}</p><div className="pricing-trust"><span><Icon name="check" size={16}/>30 Tage kostenlos</span><span><Icon name="check" size={16}/>Keine Einrichtungsgebühr</span><span><Icon name="check" size={16}/>CHF-Abrechnung</span></div></div>
    <div className="pricing-grid">{plans.map(x=><article className={x.hot?"price-card featured":"price-card"} key={x.n}>{x.hot&&<span className="popular">{t[2]}</span>}<div className="plan-name"><h2>{x.n}</h2>{x.hot&&<small>Empfohlen für KMU</small>}</div><p>{x.d}</p><div className="price"><strong>CHF {x.p}</strong><span>{t[3]}</span></div><Button href="/registrieren" variant={x.hot?"primary":"secondary"}>{m.marketing.trial}</Button><ul>{x.f.map(f=><li key={f}><Icon name="check" size={15}/>{f}</li>)}</ul></article>)}</div>
    <section className="pricing-foot"><div><h2>Alle Pläne starten einfach.</h2><p>Registrieren, Firmennamen erfassen und direkt mit Demo- oder eigenen Daten loslegen.</p></div><Button href="/demo" variant="secondary">{t[4]}</Button></section>
  </main><MarketingFooter/></>
}