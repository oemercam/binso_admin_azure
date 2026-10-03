"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {Button,Logo} from "@/components/ui";
export default function VerifyEmail(){
 const [state,setState]=useState<"loading"|"ok"|"error">("loading");
 useEffect(()=>{
  const token=new URLSearchParams(window.location.search).get("token");
  if(!token)return;
  let active=true;
  fetch("/api/auth/verify-email",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token})})
   .then(r=>{if(active)setState(r.ok?"ok":"error")})
   .catch(()=>{if(active)setState("error")});
  return()=>{active=false};
 },[]);
 const token=typeof window!=="undefined"?new URLSearchParams(window.location.search).get("token"):null;
 const view=!token?"error":state;
 return <main className="auth-page"><section className="auth-card"><Logo/>{view==="loading"?<><h1>E-Mail wird bestätigt…</h1><p>Einen Moment bitte.</p></>:view==="ok"?<><h1>E-Mail bestätigt</h1><p>Deine E-Mail-Adresse wurde erfolgreich bestätigt.</p><Button href="/dashboard">Binso One öffnen</Button></>:<><h1>Link ungültig oder abgelaufen</h1><p>Der Bestätigungslink konnte nicht verwendet werden.</p><Link href="/login">Zur Anmeldung</Link></>}</section></main>;
}