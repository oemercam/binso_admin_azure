'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {startRegistration,type PublicKeyCredentialCreationOptionsJSON} from '@simplewebauthn/browser';
import {ActionRow,FormSheet,SettingsGroup} from './binso-ux';
import {Button,Field,Input,ErrorState,LoadingState} from './ui';
import {LocalizedText} from '@/lib/client/locale';
import {apiGet,apiPost,apiDelete} from '@/lib/client/backend';
type Passkey={id:string;label:string;created_at:string;last_used_at:string|null};
export function PasskeySettings({demo,onChanged}:{demo:boolean;onChanged:()=>void}){
 const [keys,setKeys]=useState<Passkey[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [open,setOpen]=useState(false),[target,setTarget]=useState<Passkey|null>(null),[label,setLabel]=useState('');
 const [busy,setBusy]=useState(false),pending=useRef(false);
 const load=useCallback(async()=>{setLoading(true);try{setKeys((await apiGet<{items:Passkey[]}>('/api/auth/passkeys')).items);setError('')}catch(e){setError(e instanceof Error?e.message:'Sicherheitsstatus konnte nicht geladen werden.')}finally{setLoading(false)}},[]);
 useEffect(()=>{let active=true;if(!demo)void apiGet<{items:Passkey[]}>('/api/auth/passkeys').then(result=>{if(active)setKeys(result.items)}).catch(e=>{if(active)setError(e instanceof Error?e.message:'Sicherheitsstatus konnte nicht geladen werden.')}).finally(()=>{if(active)setLoading(false)});return ()=>{active=false}},[demo]);
 const close=()=>{setOpen(false);setTarget(null);setLabel('')};
 const save=async()=>{
  if(pending.current)return;pending.current=true;setBusy(true);setError('');setNotice('');
  try{
   let result:{ok:boolean;notice:string};
   if(target){
    result=await apiDelete('/api/auth/passkeys',{id:target.id});
   }else{
    const options=await apiPost<PublicKeyCredentialCreationOptionsJSON>('/api/auth/passkeys/options',{mode:'register',label});
    const response=await startRegistration({optionsJSON:options});
    result=await apiPost('/api/auth/passkeys/verify',{mode:'register',response});
   }
   close();if(result.notice!=='accepted')setNotice('Die Änderung ist gespeichert. Die Sicherheits-E-Mail wurde noch nicht bestätigt.');
   await load();onChanged();
  }catch(e){await load();setError(e instanceof Error?e.message:'Änderung konnte nicht gespeichert werden.')}finally{pending.current=false;setBusy(false)}
 };
 if(demo)return null;
 return <SettingsGroup title="Passkeys">
  <>
   {loading?<LoadingState/>:<div className="action-list">{keys.map(key=><ActionRow key={key.id} icon="lock" title={key.label} onClick={()=>{setTarget(key);setOpen(true)}}/>)}</div>}
   <Button variant="secondary" onClick={()=>{setTarget(null);setOpen(true)}}><LocalizedText>{'Passkey hinzufügen'}</LocalizedText></Button>
  </>
  {notice&&<p role="status" className="settings-note"><LocalizedText>{notice}</LocalizedText></p>}
  {error&&!open&&<ErrorState onRetry={()=>void load()}><LocalizedText>{error}</LocalizedText></ErrorState>}
  <FormSheet open={open} label={target?'Passkey entfernen':'Passkey hinzufügen'} onClose={close} dirty={!!label} busy={busy}>
   <section className="settings-form">
    {target?<p><LocalizedText>{'Beim Entfernen werden alle anderen Sitzungen abgemeldet. Passwort und Authenticator bleiben erhalten.'}</LocalizedText></p>:<Field label="Bezeichnung"><Input value={label} maxLength={100} onChange={e=>setLabel(e.target.value)}/></Field>}
    {error&&<ErrorState><LocalizedText>{error}</LocalizedText></ErrorState>}
    <Button disabled={busy} onClick={()=>void save()}><LocalizedText>{target?'Passkey entfernen':'Passkey hinzufügen'}</LocalizedText></Button>
   </section>
  </FormSheet>
 </SettingsGroup>;
}
