"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Icon, Logo } from "@/components/ui";
import { clearDemoClientSession } from "@/lib/client/backend";
import { useI18n } from "@/lib/i18n/provider";
import { LanguageSwitcher } from "@/components/language-switcher";

async function responseMessage(response:Response,fallback:string){
  const payload=await response.json().catch(()=>({}));
  return {
    ok:response.ok,
    message:typeof payload?.message==="string"?payload.message:fallback,
    payload,
  };
}

export function PortalHome(){
  const router=useRouter();
  const {locale}=useI18n();
  const t={de:["KUNDENPORTAL","Willkommen bei Binso One.","Melde dich an, erstelle ein Konto oder starte direkt eine Demo.","Anmelden","Account erstellen","Binso One zuerst ansehen","Ohne Verifikation und ohne Kreditkarte durch die komplette Demo klicken.","Demo starten","Zur Website","Preise","Sicherheit"],fr:["PORTAIL CLIENT","Bienvenue sur Binso One.","Connectez-vous, créez un compte ou lancez directement une démo.","Connexion","Créer un compte","Découvrir Binso One","Explorez la démo complète sans vérification ni carte de crédit.","Démarrer la démo","Site web","Prix","Sécurité"],it:["PORTALE CLIENTI","Benvenuto in Binso One.","Accedi, crea un account o avvia direttamente una demo.","Accedi","Crea account","Scopri Binso One","Esplora la demo completa senza verifica né carta di credito.","Avvia demo","Sito web","Prezzi","Sicurezza"],en:["CUSTOMER PORTAL","Welcome to Binso One.","Sign in, create an account or start a demo right away.","Sign in","Create account","Explore Binso One","Explore the complete demo without verification or a credit card.","Start demo","Website","Pricing","Security"],tr:["MÜŞTERİ PORTALI","Binso One’a hoş geldiniz.","Giriş yapın, hesap oluşturun veya doğrudan demoyu başlatın.","Giriş yap","Hesap oluştur","Binso One’ı keşfet","Doğrulama veya kredi kartı olmadan tüm demoyu inceleyin.","Demoyu başlat","Web sitesi","Fiyatlar","Güvenlik"]}[locale];
  const [checking,setChecking]=useState(true);

  useEffect(()=>{
    let active=true;
    fetch("/api/auth/session",{cache:"no-store"})
      .then(response=>response.json())
      .then(payload=>{
        if(!active) return;
        if(payload?.authenticated){
          router.replace(payload?.demo?"/dashboard":"/dashboard");
          return;
        }
        setChecking(false);
      })
      .catch(()=>{if(active)setChecking(false)});
    return()=>{active=false};
  },[router]);

  if(checking) return <PortalLoading/>;

  return <PortalFrame>
    <LanguageSwitcher/><span className="portal-kicker">{t[0]}</span>
    <h1>{t[1]}</h1>
    <p>{t[2]}</p>

    <div className="portal-primary-actions">
      <Button href="/portal/login">{t[3]}</Button>
      <Button href="/portal/registrieren" variant="secondary">{t[4]}</Button>
    </div>

    <div className="portal-demo-card">
      <span className="portal-demo-icon"><Icon name="home" size={18}/></span>
      <div><b>{t[5]}</b><small>{t[6]}</small></div>
      <Button href="/demo" variant="secondary">{t[7]}</Button>
    </div>

    <div className="portal-links">
      <Link href="/">{t[8]}</Link>
      <Link href="/preise">{t[9]}</Link>
      <Link href="/#sicherheit">{t[10]}</Link>
    </div>
  </PortalFrame>;
}

export function PortalLogin(){
  const router=useRouter();
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [show,setShow]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [backendConfigured,setBackendConfigured]=useState<boolean|null>(null);

  useEffect(()=>{
    fetch("/api/auth/session",{cache:"no-store"})
      .then(response=>response.json())
      .then(payload=>setBackendConfigured(Boolean(payload?.configured)))
      .catch(()=>setBackendConfigured(false));
  },[]);

  const submit=async(event:FormEvent)=>{
    event.preventDefault();
    setLoading(true);
    setError("");
    try{
      if(backendConfigured===false){
        await startDemoSession({name:email.split("@")[0]||"Demo",company:"Demo Firma",focus:"overview"});
        router.push("/dashboard");
        router.refresh();
        return;
      }

      const response=await fetch("/api/auth/login",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({email,password}),
      });
      const result=await responseMessage(response,"Anmeldung nicht möglich.");
      if(!result.ok) throw new Error(result.message);
      clearDemoClientSession();
      router.push("/dashboard");
      router.refresh();
    }catch(error){
      setError(error instanceof Error?error.message:"Anmeldung nicht möglich.");
      setLoading(false);
    }
  };

  return <PortalFrame compact>
    <span className="portal-kicker">KUNDENPORTAL</span>
    <h1>Anmelden</h1>
    <p>Öffne dein Binso One Konto.</p>
    {backendConfigured===false&&<div className="portal-demo-notice"><b>Demo-Betrieb</b><span>Die produktive Datenbank ist noch nicht verbunden. Die Anmeldung öffnet deshalb eine isolierte Demo-Sitzung.</span></div>}

    <form className="portal-form" onSubmit={submit}>
      <label>E-Mail<input required type="email" inputMode="email" autoComplete="email" value={email} onChange={event=>setEmail(event.target.value)} placeholder="name@firma.ch"/></label>
      <label>Passwort
        <div className="password-field">
          <input required type={show?"text":"password"} autoComplete="current-password" value={password} onChange={event=>setPassword(event.target.value)} placeholder="••••••••"/>
          <button type="button" onClick={()=>setShow(value=>!value)}>{show?"Ausblenden":"Anzeigen"}</button>
        </div>
      </label>
      <div className="form-link"><Link href="/passwort-vergessen">Passwort vergessen?</Link></div>
      {error&&<p className="auth-error" role="alert">{error}</p>}
      <Button type="submit">{loading?"Anmeldung läuft…":"Anmelden"}</Button>
    </form>

    <div className="portal-divider"><span>oder</span></div>
    <Button href="/demo" variant="secondary">Demo starten</Button>
    <p className="portal-bottom">Noch kein Konto? <Link href="/portal/registrieren">Account erstellen</Link></p>
  </PortalFrame>;
}

export function PortalRegister(){
  const router=useRouter();
  const [companyName,setCompanyName]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [show,setShow]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [confirmation,setConfirmation]=useState(false);
  const [backendConfigured,setBackendConfigured]=useState<boolean|null>(null);

  useEffect(()=>{
    fetch("/api/auth/session",{cache:"no-store"})
      .then(response=>response.json())
      .then(payload=>setBackendConfigured(Boolean(payload?.configured)))
      .catch(()=>setBackendConfigured(false));
  },[]);

  const submit=async(event:FormEvent)=>{
    event.preventDefault();
    setLoading(true);
    setError("");
    try{
      if(backendConfigured===false){
        await startDemoSession({name:email.split("@")[0]||"Demo",company:companyName,focus:"overview"});
        router.push("/willkommen");
        router.refresh();
        return;
      }

      const response=await fetch("/api/auth/register",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({companyName,email,password}),
      });
      const result=await responseMessage(response,"Registrierung nicht möglich.");
      if(!result.ok) throw new Error(result.message);
      clearDemoClientSession();
      if(result.payload?.requiresConfirmation){
        setConfirmation(true);
        setLoading(false);
        return;
      }
      router.push("/willkommen");
      router.refresh();
    }catch(error){
      setError(error instanceof Error?error.message:"Registrierung nicht möglich.");
      setLoading(false);
    }
  };

  if(confirmation) return <PortalFrame compact>
    <span className="portal-kicker">KUNDENPORTAL</span>
    <h1>E-Mail bestätigen</h1>
    <p>Öffne den Bestätigungslink und melde dich danach im Kundenportal an.</p>
    <Button href="/portal/login">Zur Anmeldung</Button>
  </PortalFrame>;

  return <PortalFrame compact>
    <span className="portal-kicker">KUNDENPORTAL</span>
    <h1>Account erstellen</h1>
    <p>Nur die wichtigsten Angaben. Den Rest richtest du danach in Binso One ein.</p>
    {backendConfigured===false&&<div className="portal-demo-notice"><b>Demo-Registrierung</b><span>Die Angaben werden nur für deine isolierte Demo verwendet. Es wird noch kein produktives Konto erstellt.</span></div>}

    <form className="portal-form" onSubmit={submit}>
      <label>Firmenname<input required autoFocus value={companyName} onChange={event=>setCompanyName(event.target.value)} placeholder="Meine Firma GmbH"/></label>
      <label>E-Mail<input required type="email" inputMode="email" autoComplete="email" value={email} onChange={event=>setEmail(event.target.value)} placeholder="name@firma.ch"/></label>
      <label>Passwort
        <div className="password-field">
          <input required minLength={8} type={show?"text":"password"} autoComplete="new-password" value={password} onChange={event=>setPassword(event.target.value)} placeholder="Mindestens 8 Zeichen"/>
          <button type="button" onClick={()=>setShow(value=>!value)}>{show?"Ausblenden":"Anzeigen"}</button>
        </div>
      </label>
      {error&&<p className="auth-error" role="alert">{error}</p>}
      <Button type="submit">{loading?"Account wird erstellt…":"Account erstellen"}</Button>
    </form>

    <div className="portal-divider"><span>oder</span></div>
    <Button href="/demo" variant="secondary">Ohne Verifikation Demo starten</Button>
    <p className="portal-bottom">Bereits registriert? <Link href="/portal/login">Anmelden</Link></p>
  </PortalFrame>;
}

async function startDemoSession({name,company,focus}:{name:string;company:string;focus:string}){
  const now=Date.now();
  window.localStorage.setItem("binso.demo.session","1");
  window.localStorage.setItem("binso.demo.name",name.trim()||"Demo");
  window.localStorage.setItem("binso.demo.company",company.trim()||"Demo Firma");
  window.localStorage.setItem("binso.demo.focus",focus);
  window.localStorage.setItem("binso.demo.startedAt",String(now));
  window.localStorage.setItem("binso.demo.expiresAt",String(now+24*60*60*1000));

  const response=await fetch("/api/demo/session",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
  });
  if(!response.ok) throw new Error("Demo-Sitzung konnte nicht gestartet werden.");
}

function PortalFrame({children,compact=false}:{children:React.ReactNode;compact?:boolean}){
  return <main className="portal-page">
    <header className="portal-header">
      <Link href="/"><Logo/></Link>
      <Link href="/" className="portal-close" aria-label="Zur Website"><Icon name="close" size={17}/></Link>
    </header>
    <section className={compact?"portal-card compact":"portal-card"}>
      {children}
    </section>
    <footer className="portal-footer">Binso GmbH · Appenzell · Schweiz</footer>
  </main>;
}

function PortalLoading(){
  return <main className="portal-page portal-loading" aria-label="Kundenportal wird geöffnet">
    <div><Logo/><span>Kundenportal wird geöffnet …</span></div>
  </main>;
}
