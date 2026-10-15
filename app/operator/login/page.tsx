"use client";

import {LocalizedText} from "@/lib/client/locale";
import Link from "next/link";
import {useSearchParams} from "next/navigation";
import {useState} from "react";
import {Button, Logo, ErrorState} from "@/components/ui";

export default function OperatorLogin(){
  const search=useSearchParams();
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const denied=search.get("error")==="entra_access_denied";

  const startMicrosoft=()=>{
    const next=search.get("next");
    const target=next?.startsWith("/operator")?next:"/operator";
    const path=`/.auth/login/aad?post_login_redirect_uri=${encodeURIComponent(`/api/operator/sso/callback?next=${encodeURIComponent(target)}`)}`;
    window.location.assign(new URL(path,window.location.origin).toString());
  };

  const startDemo=async()=>{
    if(loading)return;
    setLoading(true);setError("");
    try{
      const response=await fetch("/api/operator/demo-session",{method:"POST",headers:{"Content-Type":"application/json"}});
      if(!response.ok)throw new Error();
      window.location.replace("/operator");
    }catch{
      setError("One Admin Demo konnte nicht gestartet werden.");setLoading(false);
    }
  };

  return <main className="auth-page"><section className="auth-card operator-login-card">
    <Link href="/"><Logo/></Link>
    <span className="eyebrow"><LocalizedText>{"ONE ADMIN"}</LocalizedText></span>
    <h1><LocalizedText>{"Admin Portal"}</LocalizedText></h1>
    <p><LocalizedText>{"Interner Zugang für Binso-Mitarbeitende über Microsoft Entra ID."}</LocalizedText></p>
    <Button onClick={startMicrosoft}><LocalizedText>{"Mit Microsoft anmelden"}</LocalizedText></Button>
    <p className="operator-login-note"><LocalizedText>{"Microsoft verwaltet Anmeldung, Microsoft Authenticator/MFA und Kontosicherheit. Zugriff erhalten nur im Binso-Entra-Tenant autorisierte Personen mit einer zugewiesenen Binso-One-App-Rolle."}</LocalizedText></p>
    {(denied||error)&&<ErrorState className="auth-error"><LocalizedText>{error||"Microsoft-Anmeldung erfolgreich, aber deinem Konto ist keine gültige Binso-One-Adminrolle zugewiesen."}</LocalizedText></ErrorState>}
    <div className="auth-divider"><span><LocalizedText>{"Demo"}</LocalizedText></span></div>
    <Button onClick={()=>void startDemo()} disabled={loading} variant="secondary"><LocalizedText>{loading?"Demo wird geöffnet…":"Admin Demo öffnen"}</LocalizedText></Button>
    <p className="auth-bottom"><Link href="/"><LocalizedText>{"Zurück zu Binso One"}</LocalizedText></Link></p>
  </section></main>;
}