"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ConfirmDialog from "@/components/confirm-dialog";
import { startDemoClientSession } from "@/lib/client/backend";
import { Button, Icon, Logo } from "@/components/ui";

export default function Demo(){
  const router=useRouter();
  const [step,setStep]=useState(1);
  const [name,setName]=useState("");
  const [company,setCompany]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [confirmClose,setConfirmClose]=useState(false);

  const next=()=>{
    if(step===2&&(!name.trim()||!company.trim())){
      setError("Bitte Name und Firma erfassen.");
      return;
    }
    setError("");
    setStep(current=>Math.min(2,current+1));
  };

  const start=async()=>{
    if(loading)return;
    if(!name.trim()||!company.trim()){setError("Bitte Name und Firma erfassen.");return;}
    setLoading(true);setError("");
    try{
      await startDemoClientSession({
        name:name.trim()||"Thomas Muster",
        company:company.trim()||"Musterwerk AG",

      });
      router.push("/dashboard");
      router.refresh();
    }catch{
      setError("Demo konnte nicht gestartet werden. Bitte erneut versuchen.");
      setLoading(false);
    }
  };

  return <main className="demo-onboarding-shell">
    <header className="demo-onboarding-header">
      <Link href="/"><Logo/></Link>
      <button type="button" className="demo-close" aria-label="Demo schliessen" onClick={()=>setConfirmClose(true)}><Icon name="close" size={18}/></button>
    </header>

    <section className="demo-onboarding">
      <div className="demo-progress" aria-label={"Demo Einrichtung, Schritt "+step+" von 2"}>
        {[1,2].map(value=><span key={value} className={step>=value?"active":""} aria-hidden="true"/>)}
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
        <span className="eyebrow">SCHRITT 2 VON 2</span>
        <h1>Wie soll deine Demo heissen?</h1>
        <p>Diese Angaben werden nur für deine Demo-Ansicht verwendet.</p>
        <div className="demo-form">
          <label><span>Dein Name</span><input value={name} onChange={e=>setName(e.target.value)} placeholder="Thomas Muster" autoFocus/></label>
          <label><span>Firma</span><input value={company} onChange={e=>setCompany(e.target.value)} placeholder="Musterwerk AG"/></label>
        </div>
        {error&&<p className="auth-error">{error}</p>}
        <div className="demo-step-actions">
          <Button variant="secondary" onClick={()=>setStep(1)}>Zurück</Button>
          <Button onClick={()=>void start()} disabled={loading}>{loading?"Demo wird gestartet…":"Demo starten"}</Button>
        </div>
      </div>}

      <small className="demo-privacy">Demo-Daten sind von produktiven Firmendaten getrennt.</small>
    </section>
    <ConfirmDialog open={confirmClose} title="Demo wirklich abbrechen?" message="Deine Eingaben in der Demo-Einrichtung gehen verloren." confirmLabel="Demo abbrechen" cancelLabel="Weiter bearbeiten" danger onCancel={()=>setConfirmClose(false)} onConfirm={()=>router.push("/")}/>
  </main>;
}
