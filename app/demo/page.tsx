"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Icon, Logo } from "@/components/ui";

type DemoFocus="overview"|"customers"|"documents"|"time";

export default function Demo(){
  const router=useRouter();
  const [step,setStep]=useState(1);
  const [name,setName]=useState("");
  const [company,setCompany]=useState("");
  const [focus,setFocus]=useState<DemoFocus>("overview");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  const next=()=>{
    if(step===2&&(!name.trim()||!company.trim())){
      setError("Bitte Name und Firma erfassen.");
      return;
    }
    setError("");
    setStep(current=>Math.min(3,current+1));
  };

  const start=async()=>{
    setLoading(true);setError("");
    const now=Date.now();
    window.localStorage.setItem("binso.demo.session","1");
    window.localStorage.setItem("binso.demo.name",name.trim()||"Thomas Muster");
    window.localStorage.setItem("binso.demo.company",company.trim()||"Musterwerk AG");
    window.localStorage.setItem("binso.demo.focus",focus);
    window.localStorage.setItem("binso.demo.startedAt",String(now));
    window.localStorage.setItem("binso.demo.expiresAt",String(now+24*60*60*1000));

    try{
      await fetch("/api/demo/session",{method:"POST",headers:{"Content-Type":"application/json"}});
    }catch{
      // UX demo remains available locally while the production backend is intentionally deferred.
    }

    router.push("/willkommen");
    router.refresh();
  };

  return <main className="demo-onboarding-shell">
    <header className="demo-onboarding-header">
      <Link href="/"><Logo/></Link>
      <Link href="/" className="demo-close" aria-label="Demo schliessen"><Icon name="close" size={18}/></Link>
    </header>

    <section className="demo-onboarding">
      <div className="demo-progress" aria-label={"Demo Einrichtung, Schritt "+step+" von 3"}>
        {[1,2,3].map(value=><span key={value} className={step>=value?"active":""} aria-hidden="true"/>)}
      </div>

      {step===1&&<div className="demo-step">
        <span className="eyebrow">BINSO ONE DEMO</span>
        <h1>Binso One selbst ausprobieren.</h1>
        <p>Du gehst durch einen kurzen Einstieg und landest danach in einer vorbereiteten Demo-Firma. Keine Verifikation und keine Kreditkarte.</p>
        <div className="demo-summary-list">
          <div><Icon name="users"/><span><b>Beispielkunden</b><small>Kontakte, Angebote und Rechnungen</small></span></div>
          <div><Icon name="clock"/><span><b>Zeiterfassung</b><small>Timer und manuelle Einträge</small></span></div>
          <div><Icon name="receipt"/><span><b>Belege</b><small>Angebote, Rechnungen und Zahlungen</small></span></div>
        </div>
        <Button onClick={next}>Demo einrichten</Button>
      </div>}

      {step===2&&<div className="demo-step">
        <span className="eyebrow">SCHRITT 2 VON 3</span>
        <h1>Wie soll deine Demo heissen?</h1>
        <p>Diese Angaben werden nur für deine Demo-Ansicht verwendet.</p>
        <div className="demo-form">
          <label><span>Dein Name</span><input value={name} onChange={e=>setName(e.target.value)} placeholder="Thomas Muster" autoFocus/></label>
          <label><span>Firma</span><input value={company} onChange={e=>setCompany(e.target.value)} placeholder="Musterwerk AG"/></label>
        </div>
        {error&&<p className="auth-error">{error}</p>}
        <div className="demo-step-actions">
          <Button variant="secondary" onClick={()=>setStep(1)}>Zurück</Button>
          <Button onClick={next}>Weiter</Button>
        </div>
      </div>}

      {step===3&&<div className="demo-step">
        <span className="eyebrow">SCHRITT 3 VON 3</span>
        <h1>Was möchtest du zuerst ansehen?</h1>
        <p>Du kannst danach jederzeit alle Bereiche öffnen.</p>
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
          <Button onClick={()=>void start()}>{loading?"Demo wird gestartet…":"Demo starten"}</Button>
        </div>
      </div>}

      <small className="demo-privacy">Demo-Daten sind von produktiven Firmendaten getrennt.</small>
    </section>
  </main>;
}
