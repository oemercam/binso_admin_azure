"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Button, Logo } from "@/components/ui";

export default function Page() {
  const [email,setEmail]=useState("");
  const [loading,setLoading]=useState(false);
  const [sent,setSent]=useState(false);
  const [error,setError]=useState("");

  const submit=async(event:FormEvent)=>{
    event.preventDefault();
    setLoading(true);setError("");
    try{
      const response=await fetch("/api/auth/recover",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email})});
      const payload=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(typeof payload?.message==="string"?payload.message:"Link konnte nicht gesendet werden.");
      setSent(true);
    }catch(error){
      setError(error instanceof Error?error.message:"Link konnte nicht gesendet werden.");
    }finally{setLoading(false);}
  };

  return <main className="auth-page">
    <section className="auth-card">
      <Logo/>
      <h1>Passwort zurücksetzen</h1>
      {sent?<><p>Falls ein Konto mit dieser E-Mail-Adresse existiert, haben wir einen Link zum Zurücksetzen gesendet.</p><Button href="/login">Zur Anmeldung</Button></>:<>
        <p>Gib deine E-Mail-Adresse ein. Wir senden dir einen Link zum Zurücksetzen.</p>
        <form onSubmit={submit}>
          <label>E-Mail<input required autoFocus value={email} onChange={e=>setEmail(e.target.value)} type="email" inputMode="email" autoComplete="email" placeholder="name@firma.ch"/></label>
          {error&&<p className="auth-error" role="alert">{error}</p>}
          <Button type="submit">{loading?"Wird gesendet…":"Link senden"}</Button>
        </form>
        <p className="auth-bottom"><Link href="/login">Zurück zur Anmeldung</Link></p>
      </>}
    </section>
  </main>;
}