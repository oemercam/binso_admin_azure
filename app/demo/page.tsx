"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ConfirmDialog from "@/components/confirm-dialog";
import { startDemoClientSession } from "@/lib/client/backend";
import { Button, Icon, Logo } from "@/components/ui";
import { useI18n } from "@/lib/i18n/provider";

type DemoFocus="overview"|"customers"|"documents"|"time";

export default function Demo(){
  const router=useRouter();
  const {locale,messages:m}=useI18n();
  const t={
    de:["Bitte Name und Firma erfassen.","Demo konnte nicht gestartet werden. Bitte erneut versuchen.","Binso One selbst ausprobieren.","Du gehst durch einen kurzen Einstieg und landest danach in einer vorbereiteten Demo-Firma. Keine Verifikation und keine Kreditkarte.","Demo einrichten","Wie soll deine Demo heissen?","Diese Angaben werden nur für deine Demo-Ansicht verwendet.","Dein Name","Firma","Weiter","Was möchtest du zuerst ansehen?","Du kannst danach jederzeit alle Bereiche öffnen.","Demo wird gestartet…","Demo-Daten sind von produktiven Firmendaten getrennt."],
    fr:["Veuillez saisir votre nom et votre entreprise.","Impossible de démarrer la démo. Veuillez réessayer.","Essayez Binso One vous-même.","Après une courte introduction, vous accédez à une entreprise de démonstration préparée. Aucune vérification ni carte de crédit.","Configurer la démo","Comment souhaitez-vous nommer votre démo ?","Ces informations sont utilisées uniquement pour votre vue de démonstration.","Votre nom","Entreprise","Continuer","Que souhaitez-vous voir en premier ?","Vous pourrez ensuite accéder à toutes les sections à tout moment.","Démarrage de la démo…","Les données de démonstration sont séparées des données d’entreprise productives."],
    it:["Inserisci nome e azienda.","Impossibile avviare la demo. Riprova.","Prova Binso One in prima persona.","Dopo una breve introduzione accederai a un’azienda demo preparata. Nessuna verifica e nessuna carta di credito.","Configura demo","Come vuoi chiamare la tua demo?","Questi dati vengono usati solo per la tua vista demo.","Il tuo nome","Azienda","Continua","Cosa vuoi vedere per prima cosa?","In seguito potrai aprire tutte le sezioni in qualsiasi momento.","Avvio demo…","I dati demo sono separati dai dati aziendali produttivi."],
    en:["Please enter your name and company.","The demo could not be started. Please try again.","Try Binso One yourself.","After a short introduction, you enter a prepared demo company. No verification and no credit card.","Set up demo","What should your demo be called?","These details are used only for your demo view.","Your name","Company","Continue","What would you like to see first?","You can open all areas at any time afterwards.","Starting demo…","Demo data is separated from production company data."],
    tr:["Lütfen adınızı ve şirketinizi girin.","Demo başlatılamadı. Lütfen tekrar deneyin.","Binso One’ı kendiniz deneyin.","Kısa bir başlangıçtan sonra hazırlanmış bir demo şirketine geçersiniz. Doğrulama ve kredi kartı gerekmez.","Demoyu hazırla","Demonuzun adı ne olsun?","Bu bilgiler yalnızca demo görünümünüz için kullanılır.","Adınız","Şirket","Devam","Önce neyi görmek istersiniz?","Daha sonra tüm bölümleri istediğiniz zaman açabilirsiniz.","Demo başlatılıyor…","Demo verileri gerçek şirket verilerinden ayrıdır."]
  }[locale];
  const [step,setStep]=useState(1);
  const [name,setName]=useState("");
  const [company,setCompany]=useState("");
  const [focus,setFocus]=useState<DemoFocus>("overview");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [confirmClose,setConfirmClose]=useState(false);

  const next=()=>{
    if(step===2&&(!name.trim()||!company.trim())){
      setError(t[0]);
      return;
    }
    setError("");
    setStep(current=>Math.min(3,current+1));
  };

  const start=async()=>{
    if(loading)return;
    setLoading(true);setError("");
    try{
      await startDemoClientSession({
        name:name.trim()||"Thomas Muster",
        company:company.trim()||"Musterwerk AG",
        focus,
      });
      router.push("/willkommen");
      router.refresh();
    }catch{
      setError(t[1]);
      setLoading(false);
    }
  };

  return <main className="demo-onboarding-shell">
    <header className="demo-onboarding-header">
      <Link href="/"><Logo/></Link>
      <button type="button" className="demo-close" aria-label="Demo schliessen" onClick={()=>setConfirmClose(true)}><Icon name="close" size={18}/></button>
    </header>

    <section className="demo-onboarding">
      <div className="demo-progress" aria-label={"Demo Einrichtung, Schritt "+step+" von 3"}>
        {[1,2,3].map(value=><span key={value} className={step>=value?"active":""} aria-hidden="true"/>)}
      </div>

      {step===1&&<div className="demo-step">
        <span className="eyebrow">BINSO ONE DEMO</span>
        <h1>{t[2]}</h1>
        <p>{t[3]}</p>
        <div className="demo-summary-list">
          <div><Icon name="users"/><span><b>Beispielkunden</b><small>Kontakte, Angebote und Rechnungen</small></span></div>
          <div><Icon name="clock"/><span><b>Zeiterfassung</b><small>Timer und manuelle Einträge</small></span></div>
          <div><Icon name="receipt"/><span><b>Belege</b><small>Angebote, Rechnungen und Zahlungen</small></span></div>
        </div>
        <Button onClick={next}>{t[4]}</Button>
      </div>}

      {step===2&&<div className="demo-step">
        <span className="eyebrow">SCHRITT 2 VON 3</span>
        <h1>{t[5]}</h1>
        <p>{t[6]}</p>
        <div className="demo-form">
          <label><span>{t[7]}</span><input value={name} onChange={e=>setName(e.target.value)} placeholder="Thomas Muster" autoFocus/></label>
          <label><span>{t[8]}</span><input value={company} onChange={e=>setCompany(e.target.value)} placeholder="Musterwerk AG"/></label>
        </div>
        {error&&<p className="auth-error">{error}</p>}
        <div className="demo-step-actions">
          <Button variant="secondary" onClick={()=>setStep(1)}>{m.common.back}</Button>
          <Button onClick={next}>{t[9]}</Button>
        </div>
      </div>}

      {step===3&&<div className="demo-step">
        <span className="eyebrow">SCHRITT 3 VON 3</span>
        <h1>{t[10]}</h1>
        <p>{t[11]}</p>
        <div className="demo-focus-list">
          {([
            ["overview","home","Übersicht","Dashboard und Schnellzugriffe"],
            ["customers","users","Kunden","Kunden, Kontakte und Aktivitäten"],
            ["documents","receipt","Belege","Angebote, Rechnungen und Zahlungen"],
            ["time","clock","Zeiterfassung","Timer und Einträge"],
          ] as const).map(([value,icon,title,text])=><button type="button" key={value} className={focus===value?"selected":""} onClick={()=>setFocus(value)}>
            <span className="demo-focus-icon"><Icon name={icon}/></span>
            <span><b>{title}</b><small>{text}</small></span>
            {focus===value?<Icon name="check" size={17}/>:<Icon name="arrow" size={17}/>}
          </button>)}
        </div>
        {error&&<p className="auth-error">{error}</p>}
        <div className="demo-step-actions">
          <Button variant="secondary" onClick={()=>setStep(2)}>Zurück</Button>
          <Button onClick={()=>void start()}>{loading?t[12]:m.marketing.demo}</Button>
        </div>
      </div>}

      <small className="demo-privacy">{t[13]}</small>
    </section>
    <ConfirmDialog open={confirmClose} title="Demo wirklich abbrechen?" message="Deine Eingaben in der Demo-Einrichtung gehen verloren." confirmLabel="Demo abbrechen" cancelLabel="Weiter bearbeiten" danger onCancel={()=>setConfirmClose(false)} onConfirm={()=>router.push("/")}/>
  </main>;
}
