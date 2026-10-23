"use client";
import {LocalizedText} from "@/lib/client/locale";
import {FormEvent,useEffect,useState,useRef} from "react";
import {Button, Input, Field, ErrorState,LoadingState} from "@/components/ui";
import {apiGet,apiPost} from "@/lib/client/backend";
import {AuthWorkspace} from '@/components/auth-workspace';
import {PasswordInput} from '@/components/password-input';
import ConfirmDialog from "@/components/confirm-dialog";
import {useBrowserBackGuard} from "@/components/use-browser-back-guard";

export default function Page(){
 const [info,setInfo]=useState<{email:string;organization:string;existingAccount:boolean}|null>(null);
 const [error,setError]=useState<string|null>(null),[password,setPassword]=useState(""),[firstName,setFirstName]=useState(""),[lastName,setLastName]=useState(""),[busy,setBusy]=useState(false),[done,setDone]=useState(false);
  const name=[firstName,lastName].filter(Boolean).join(" "),saving=useRef(false);
  const [discard,setDiscard]=useState(false);
  const leaveBack=useBrowserBackGuard(!done&&!!(name||password),()=>setDiscard(true));

 useEffect(()=>{const token=new URLSearchParams(window.location.search).get('token')??'';apiGet<typeof info>('/api/auth/invitation?token='+encodeURIComponent(token)).then(setInfo).catch(e=>setError(e instanceof Error?e.message:'Einladung konnte nicht geladen werden.'));},[]);
 const submit=async(e:FormEvent)=>{e.preventDefault();if(saving.current)return;saving.current=true;setBusy(true);setError(null);try{await apiPost('/api/auth/invitation',{token:new URLSearchParams(window.location.search).get('token'),password,name,...(!info?.existingAccount?{firstName,lastName}:{})});setPassword("");setDone(true)}catch(e){setError(e instanceof Error?e.message:'Einladung konnte nicht angenommen werden.')}finally{saving.current=false;setBusy(false)}};
 return <><AuthWorkspace><section className="auth-card"><h1><LocalizedText>{done?'Einladung angenommen':'Einladung zu Binso One'}</LocalizedText></h1>{done?<><p><LocalizedText>{"Dein Zugang ist aktiv. Melde dich mit deinem Passwort an."}</LocalizedText></p><Button href="/login"><LocalizedText>{"Zur Anmeldung"}</LocalizedText></Button></>:<>{info?<><p>{info.organization}<LocalizedText>{" hat "}</LocalizedText>{info.email}<LocalizedText>{" eingeladen."}</LocalizedText></p><form onSubmit={submit}>{!info.existingAccount&&<><Field label="Vorname"><Input required maxLength={80} value={firstName} onChange={e=>setFirstName(e.target.value)} autoComplete="given-name"/></Field><Field label="Nachname"><Input required maxLength={80} value={lastName} onChange={e=>setLastName(e.target.value)} autoComplete="family-name"/></Field></>}<Field label={info.existingAccount?'Bestehendes Passwort':'Neues Passwort'}><PasswordInput required minLength={12} maxLength={512} value={password} onChange={e=>setPassword(e.target.value)} autoComplete={info.existingAccount?'current-password':'new-password'}/></Field><p><LocalizedText>{info.existingAccount?'Dein bestehendes Konto wird mit dem Team verknüpft.':'Mindestens 12 Zeichen.'}</LocalizedText></p><Button type="submit" disabled={busy}><LocalizedText>{busy?'Wird gespeichert …':'Einladung annehmen'}</LocalizedText></Button></form></>:!error&&<LoadingState/>}{error&&<ErrorState><LocalizedText>{error}</LocalizedText></ErrorState>}</>}</section></AuthWorkspace><ConfirmDialog open={discard} busy={busy} title="Änderungen verwerfen?" message="Deine Änderungen sind noch nicht gespeichert und gehen verloren." cancelLabel="Weiter bearbeiten" confirmLabel="Änderungen verwerfen" onCancel={()=>setDiscard(false)} onConfirm={()=>{setDiscard(false);leaveBack()}}/></>;
}
