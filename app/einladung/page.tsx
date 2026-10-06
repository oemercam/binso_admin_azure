"use client";
import {FormEvent,useEffect,useState} from "react";
import {Button,Logo} from "@/components/ui";
import {apiGet,apiPost} from "@/lib/client/backend";
export default function Page(){
 const [info,setInfo]=useState<{email:string;organization:string;existingAccount:boolean}|null>(null);
 const [error,setError]=useState<string|null>(null),[password,setPassword]=useState(""),[name,setName]=useState(""),[busy,setBusy]=useState(false),[done,setDone]=useState(false);
 useEffect(()=>{const token=new URLSearchParams(window.location.search).get('token')??'';apiGet<typeof info>('/api/auth/invitation?token='+encodeURIComponent(token)).then(setInfo).catch(e=>setError(e instanceof Error?e.message:'Einladung konnte nicht geladen werden.'));},[]);
 const submit=async(e:FormEvent)=>{e.preventDefault();setBusy(true);setError(null);try{await apiPost('/api/auth/invitation',{token:new URLSearchParams(window.location.search).get('token'),password,name});setDone(true)}catch(e){setError(e instanceof Error?e.message:'Einladung konnte nicht angenommen werden.')}finally{setBusy(false)}};
 return <main className="auth-page"><section className="auth-card"><Logo/><h1>{done?'Einladung angenommen':'Einladung zu Binso One'}</h1>{done?<><p>Dein Zugang ist aktiv. Melde dich mit deinem Passwort an.</p><Button href="/login">Zur Anmeldung</Button></>:<>{info?<><p>{info.organization} hat {info.email} eingeladen.</p><form onSubmit={submit}>{!info.existingAccount&&<label>Name<input required value={name} onChange={e=>setName(e.target.value)} autoComplete="name"/></label>}<label>{info.existingAccount?'Bestehendes Passwort':'Neues Passwort'}<input required type="password" minLength={12} maxLength={512} value={password} onChange={e=>setPassword(e.target.value)} autoComplete={info.existingAccount?'current-password':'new-password'}/></label><p>{info.existingAccount?'Dein bestehendes Konto wird mit dem Team verknüpft.':'Mindestens 12 Zeichen.'}</p><Button type="submit" disabled={busy}>{busy?'Wird gespeichert …':'Einladung annehmen'}</Button></form></>:!error&&<p role="status">Einladung wird geprüft …</p>}{error&&<p role="alert">{error}</p>}</>}</section></main>;
}
