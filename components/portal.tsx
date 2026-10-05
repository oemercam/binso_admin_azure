"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {Button,Icon,Logo} from "@/components/ui";

export function PortalHome(){
  const router=useRouter();
  const [checking,setChecking]=useState(true);

  useEffect(()=>{
    let active=true;
    fetch("/api/auth/session",{cache:"no-store"})
      .then(response=>response.json())
      .then(payload=>{
        if(!active)return;
        if(payload?.authenticated){
          router.replace("/dashboard");
          return;
        }
        setChecking(false);
      })
      .catch(()=>{if(active)setChecking(false)});
    return()=>{active=false};
  },[router]);

  if(checking)return <PortalLoading/>;

  return <PortalFrame>
    <span className="portal-kicker">BINSO ONE</span>
    <h1>Willkommen bei Binso One.</h1>
    <p>Melde dich sicher an, erstelle ein Firmenkonto oder starte zuerst die Demo.</p>

    <div className="portal-primary-actions">
      <Button href="/login">Anmelden</Button>
      <Button href="/registrieren" variant="secondary">Account erstellen</Button>
    </div>

    <div className="portal-demo-card">
      <span className="portal-demo-icon"><Icon name="home" size={18}/></span>
      <div><b>Binso One zuerst ansehen</b><small>Ohne Verifikation und ohne Kreditkarte durch die Demo klicken.</small></div>
      <Button href="/demo" variant="secondary">Demo starten</Button>
    </div>

    <div className="portal-links">
      <Link href="/">Zur Website</Link>
      <Link href="/preise">Preise</Link>
      <Link href="/#sicherheit">Sicherheit</Link>
      <Link href="/datenschutz">Datenschutz</Link>
    </div>
  </PortalFrame>;
}

function PortalFrame({children}:{children:React.ReactNode}){
  return <main className="portal-page">
    <header className="portal-header">
      <Link href="/"><Logo/></Link>
      <Link href="/" className="portal-close" aria-label="Zur Website"><Icon name="close" size={17}/></Link>
    </header>
    <section className="portal-card">{children}</section>
    <footer className="portal-footer">Binso GmbH · Appenzell · Schweiz</footer>
  </main>;
}

function PortalLoading(){
  return <main className="portal-page portal-loading" aria-label="Binso One wird geöffnet">
    <div><Logo/><span>Binso One wird geöffnet …</span></div>
  </main>;
}
