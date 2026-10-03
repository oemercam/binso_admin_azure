"use client";

import { MarketingFooter, MarketingHeader, ProductPreview } from "@/components/marketing";
import { Button, Icon } from "@/components/ui";
import { useI18n } from "@/lib/i18n/provider";

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
  const {locale,messages:m}=useI18n();
  const t={de:["Eine Plattform. Klare Prozesse.","Binso One verbindet die wichtigsten Abläufe deines Unternehmens – vom ersten Kundenkontakt bis zur Zahlung.","{t[2]}","{t[3]}","{t[4]}","FUNKTIONEN","{t[6]}","{t[7]}","{t[8]}"],fr:["Une plateforme. Des processus clairs.","Binso One relie les principaux processus de votre entreprise, du premier contact client au paiement.","UN PROCESSUS CONTINU","Du client au paiement.","Chaque étape s’appuie sur les données existantes.","FONCTIONS","Uniquement ce qui est utile au quotidien.","Essayez vous-même.","Démarrez la démo ou créez votre propre compte."],it:["Una piattaforma. Processi chiari.","Binso One collega i principali processi della tua azienda, dal primo contatto con il cliente al pagamento.","UN FLUSSO CONTINUO","Dal cliente al pagamento.","Ogni fase utilizza i dati già disponibili.","FUNZIONI","Solo ciò che serve davvero ogni giorno.","Provalo direttamente.","Avvia la demo o crea il tuo account."],en:["One platform. Clear processes.","Binso One connects your company’s key workflows, from the first customer contact through to payment.","ONE CONTINUOUS WORKFLOW","From customer to payment.","Every step builds on existing data.","FEATURES","Only what you need in everyday work.","Try it yourself.","Start the demo directly or create your own account."],tr:["Tek platform. Net süreçler.","Binso One, ilk müşteri temasından ödemeye kadar şirketinizin temel süreçlerini birbirine bağlar.","KESİNTİSİZ BİR SÜREÇ","Müşteriden ödemeye.","Her adım mevcut verilerin üzerine kurulur.","ÖZELLİKLER","Günlük işte gerçekten gerekenler.","Kendiniz deneyin.","Demoyu hemen başlatın veya kendi hesabınızı oluşturun."]}[locale];
  return <><MarketingHeader/><main className="subpage product-page">
    <section className="product-subhero">
      <div className="subhero-copy">
        <span className="eyebrow">PRODUKT</span>
        <h1>{t[0]}</h1>
        <p>{t[1]}</p>
        <div className="hero-actions"><Button href="/registrieren">{m.marketing.trial}</Button><Button href="/demo" variant="secondary">{m.marketing.demo}</Button></div>
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
        <span className="eyebrow">{t[5]}</span>
        <h2>Nur was im Alltag gebraucht wird.</h2>
      </div>
      <div className="product-module-list">
        {modules.map(([icon,title,text])=><div key={title}><span><Icon name={icon} size={17}/></span><div><b>{title}</b><small>{text}</small></div><Icon name="arrow" size={15}/></div>)}
      </div>
    </section>

    <section className="marketing-cta product-page-cta">
      <div><span className="eyebrow">BINSO ONE</span><h2>Selbst ausprobieren.</h2><p>Starte direkt mit der Demo oder richte dein eigenes Konto ein.</p></div>
      <div><Button href="/registrieren">30 Tage kostenlos testen</Button><Button href="/demo" variant="secondary">Demo starten</Button></div>
    </section>
  </main><MarketingFooter/></>
}
