"use client";

import { useEffect, useState } from "react";
import { Button, Logo } from "@/components/ui";

export default function VerifyEmailPage(){
  const [state,setState]=useState<"loading"|"success"|"invalid">("loading");

  useEffect(()=>{
    const token=new URLSearchParams(window.location.search).get("token");
    if(!token){queueMicrotask(()=>setState("invalid"));return;}
    fetch("/api/auth/verify-email",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({token}),
    }).then(response=>response.ok?setState("success"):setState("invalid")).catch(()=>setState("invalid"));
  },[]);

  return <main className="auth-page"><section className="auth-card">
    <Logo/>
    {state==="loading"?<><h1>E-Mail wird bestätigt</h1><p>Einen Moment bitte.</p></>:state==="success"?<><h1>E-Mail bestätigt</h1><p>Deine E-Mail-Adresse wurde erfolgreich bestätigt.</p><Button href="/dashboard">Binso One öffnen</Button></>:<><h1>Link nicht gültig</h1><p>Der Bestätigungslink ist ungültig, abgelaufen oder wurde bereits verwendet.</p><Button href="/login">Zur Anmeldung</Button></>}
  </section></main>;
}
