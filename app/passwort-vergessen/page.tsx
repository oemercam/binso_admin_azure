"use client";

import {LocalizedText} from "@/lib/client/locale";
import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import {Button, Logo, Input, Field, ErrorState} from "@/components/ui";

export default function Page() {
  const pending=useRef(false);
  const [email,setEmail]=useState("");
  const [loading,setLoading]=useState(false);
  const [sent,setSent]=useState(false);
  const [error,setError]=useState("");

  const submit=async(event:FormEvent)=>{
    event.preventDefault();if(pending.current)return;pending.current=true;
    setLoading(true);setError("");
    try{
      const response=await fetch("/api/auth/recover",{method:"POST",signal:AbortSignal.timeout(15000),headers:{"Content-Type":"application/json"},body:JSON.stringify({email})});
      const payload=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(typeof payload?.message==="string"?payload.message:"Link konnte nicht gesendet werden.");
      setSent(true);
    }catch(error){
      setError(error instanceof Error?error.message:"Link konnte nicht gesendet werden.");
    }finally{pending.current=false;setLoading(false);}
  };

  return <main className="auth-page">
    <section className="auth-card">
      <Logo/>
      <h1><LocalizedText>{"Passwort zurücksetzen"}</LocalizedText></h1>
      {sent?<><p><LocalizedText>{"Die Anfrage wurde entgegengenommen. Prüfe deinen Posteingang. Wenn kein Link ankommt, versuche es später erneut."}</LocalizedText></p><Button href="/login"><LocalizedText>{"Zur Anmeldung"}</LocalizedText></Button></>:<>
        <p><LocalizedText>{"Gib deine E-Mail-Adresse ein. Wir senden dir einen Link zum Zurücksetzen."}</LocalizedText></p>
        <form onSubmit={submit}>
          <Field label="E-Mail"><Input required autoFocus value={email} onChange={e=>setEmail(e.target.value)} type="email" inputMode="email" autoComplete="email" placeholder="name@firma.ch"/></Field>
          {error&&<ErrorState className="auth-error"><LocalizedText>{error}</LocalizedText></ErrorState>}
          <Button type="submit" disabled={loading}><LocalizedText>{loading?"Wird gesendet…":"Link senden"}</LocalizedText></Button>
        </form>
        <p className="auth-bottom"><Link href="/login"><LocalizedText>{"Zurück zur Anmeldung"}</LocalizedText></Link></p>
      </>}
    </section>
  </main>;
}