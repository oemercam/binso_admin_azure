'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {startRegistration,type PublicKeyCredentialCreationOptionsJSON} from '@simplewebauthn/browser';
import {ActionRow,FormSheet,SettingsGroup} from './binso-ux';
import {Button,Field,Input,ErrorState,LoadingState} from './ui';
import {LocalizedText} from '@/lib/client/locale';
import {apiGet,apiPost} from '@/lib/client/backend';
type Passkey={id:string;label:string;created_at:string;last_used_at:string|null};
export function PasskeySettings({enabled,demo,onChanged}:{enabled:boolean;demo:boolean;onChanged:()=>void}){
 const [keys,setKeys]=useState<Passkey[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [open,setOpen]=useState(false),[target,setTarget]=useState<Passkey|null>(null),[password,setPassword]=useState(''),[code,setCode]=useState(''),[label,setLabel]=useState('');
 const [busy,setBusy]=useState(false),pending=useRef(false);
 const load=useCallback(async()=>{setLoading(true);try{setKeys((await apiGet<{items:Passkey[]}>('/api/auth/passkeys')).items);setError('')}catch(e){setError(e instanceof Error?e.message:'Sicherheitsstatus konnte nicht geladen werden.')}finally{setLoading(false)}},[]);
 useEffect(()=>{let active=true;if(enabled&&!demo)void apiGet<{items:Passkey[]}>('/api/auth/passkeys').then(result=>{if(active)setKeys(result.items)}).catch(e=>{if(active)setError(e instanceof Error?e.message:'Sicherheitsstatus konnte nicht geladen werden.')}).finally(()=>{if(active)setLoading(false)});return ()=>{active=false}},[enabled,demo]);
 const close=()=>{setOpen(false);setTarget(null);setPassword('');setCode('');setLabel('')};
 const save=async()=>{
  if(pending.current)return;pending.current=true;setBusy(true);setError('');setNotice('');
  try{
   let result:{ok:boolean;notice:string};
   if(target){
    const response=await fetch('/api/auth/passkeys',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:target.id,password,code}),signal:AbortSignal.timeout(20000)});
    const payload=await response.json();if(!response.ok)throw new Error(payload.message??'Änderung konnte nicht gespeichert werden.');result=payload;
   }else{
    const options=await apiPost<PublicKeyCredentialCreationOptionsJSON>('/api/auth/passkeys/options',{mode:'register',password,code,label});
    setPassword('');setCode('');
    const response=await startRegistration({optionsJSON:options});
    result=await apiPost('/api/auth/passkeys/verify',{mode:'register',response});
   }
   close();if(result.notice!=='accepted')setNotice('Die Änderung ist gespeichert. Die Sicherheits-E-Mail wurde noch nicht bestätigt.');
   await load();onChanged();
  }catch(e){await load();setError(e instanceof Error?e.message:'Änderung konnte nicht gespeichert werden.')}finally{pending.current=false;setBusy(false)}
 };
 if(demo)return null;
 return <SettingsGroup title="Passkeys">
  {!enabled?<p className="settings-note"><LocalizedText>{'Bitte zuerst den Authenticator einrichten.'}</LocalizedText></p>:<>
   {loading?<LoadingState/>:<div className="action-list">{keys.map(key=><ActionRow key={key.id} icon="lock" title={key.label} onClick={()=>{setTarget(key);setOpen(true)}}/>)}</div>}
   <Button variant="secondary" onClick={()=>{setTarget(null);setOpen(true)}}><LocalizedText>{'Passkey hinzufügen'}</LocalizedText></Button>
  </>}
  {notice&&<p role="status" className="settings-note"><LocalizedText>{notice}</LocalizedText></p>}
  {error&&!open&&<ErrorState onRetry={()=>void load()}><LocalizedText>{error}</LocalizedText></ErrorState>}
  <FormSheet open={open} label={target?'Passkey entfernen':'Passkey hinzufügen'} onClose={close} dirty={!!(password||code||label)} busy={busy}>
   <section className="settings-form">
    {target?<p><LocalizedText>{'Beim Entfernen werden alle anderen Sitzungen abgemeldet. Passwort und Authenticator bleiben erhalten.'}</LocalizedText></p>:<Field label="Bezeichnung"><Input value={label} maxLength={100} onChange={e=>setLabel(e.target.value)}/></Field>}
    <Field label="Aktuelles Passwort"><Input type="password" value={password} autoComplete="current-password" onChange={e=>setPassword(e.target.value)}/></Field>
    <Field label="Authenticator-Code"><Input value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))} inputMode="numeric" autoComplete="one-time-code"/></Field>
    {error&&<ErrorState><LocalizedText>{error}</LocalizedText></ErrorState>}
    <Button disabled={busy||!password||code.length!==6} onClick={()=>void save()}><LocalizedText>{target?'Passkey entfernen':'Passkey hinzufügen'}</LocalizedText></Button>
   </section>
  </FormSheet>
 </SettingsGroup>;
}
