'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {startRegistration,type PublicKeyCredentialCreationOptionsJSON} from '@simplewebauthn/browser';
import {ActionRow,FormSheet,SettingsGroup} from './binso-ux';
import {Button,Field,Input,ErrorState,LoadingState,FormActions} from './ui';
import {LocalizedText,useLocale} from '@/lib/client/locale';
import {localeTags} from '@/lib/locales/config';
import {apiGet,apiPost,apiDelete,apiPatch,apiReadPost} from '@/lib/client/backend';
import {supportsPasskeys,passkeyError} from '@/lib/client/passkeys';
type Passkey={id:string;label:string;created_at:string;last_used_at:string|null};
export function PasskeySettings({demo,onChanged}:{demo:boolean;onChanged:()=>void}){
 const {locale,translate}=useLocale();
 const [recoveryCodes,setRecoveryCodes]=useState<string[]>([]);
 const [keys,setKeys]=useState<Passkey[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [open,setOpen]=useState(false),[target,setTarget]=useState<Passkey|null>(null),[label,setLabel]=useState('');
 const [busy,setBusy]=useState(false),pending=useRef(false);
 const load=useCallback(async()=>{setLoading(true);try{setKeys((await apiGet<{items:Passkey[]}>('/api/auth/passkeys')).items);setError('')}catch(e){setError(e instanceof Error?e.message:'Sicherheitsstatus konnte nicht geladen werden.')}finally{setLoading(false)}},[]);
 useEffect(()=>{let active=true;if(!demo)void apiGet<{items:Passkey[]}>('/api/auth/passkeys').then(result=>{if(active)setKeys(result.items)}).catch(e=>{if(active)setError(e instanceof Error?e.message:'Sicherheitsstatus konnte nicht geladen werden.')}).finally(()=>{if(active)setLoading(false)});return ()=>{active=false}},[demo]);
 const close=()=>{setOpen(false);setTarget(null);setLabel('')};
 const save=async(action:'add'|'rename'|'remove'|'recovery')=>{
  if(pending.current)return;pending.current=true;setBusy(true);setError('');setNotice('');
  try{
   let result:{ok:boolean;notice:string;recoveryCodes?:string[]};
   if(action==='recovery')result=await apiPatch('/api/auth/passkeys',{action:'recovery'});
   else if(action==='rename')result=await apiPatch('/api/auth/passkeys',{action:'rename',id:target?.id,label});
   else if(action==='remove'&&target){
    result=await apiDelete('/api/auth/passkeys',{id:target.id});
   }else{
    const options=await apiReadPost<PublicKeyCredentialCreationOptionsJSON>('/api/auth/passkeys/options',{mode:'register',label});
    const response=await startRegistration({optionsJSON:options});
    result=await apiPost('/api/auth/passkeys/verify',{mode:'register',response});
   }
   setRecoveryCodes(result.recoveryCodes??[]);close();if(result.notice!=='accepted')setNotice('Die Änderung ist gespeichert. Die Sicherheits-E-Mail wurde noch nicht bestätigt.');
   await load();onChanged();
  }catch(e){await load();setError(passkeyError(e))}finally{pending.current=false;setBusy(false)}
 };
 if(demo)return null;
 return <SettingsGroup title="Passkeys">
  <>
   <p className="settings-note"><LocalizedText>{'Melde dich mit Face ID, Fingerabdruck oder deiner Geräteentsperrung an. Richte möglichst einen zweiten Passkey auf einem anderen Gerät ein.'}</LocalizedText></p>
   {loading?<LoadingState/>:<div className="action-list">{keys.map(key=><ActionRow key={key.id} icon="lock" verbatim title={key.label} description={translate('Zuletzt verwendet')} metadata={key.last_used_at?new Date(key.last_used_at).toLocaleString(localeTags[locale]):translate('Noch nie verwendet')} onClick={()=>{setLabel(key.label);setTarget(key);setOpen(true)}}/>)}</div>}
   {supportsPasskeys()&&<Button variant="secondary" disabled={busy} onClick={()=>{setTarget(null);setOpen(true)}}><LocalizedText>{'Passkey hinzufügen'}</LocalizedText></Button>}
   {!!keys.length&&<div className="action-list"><ActionRow icon="lock" title="Neue Wiederherstellungscodes erstellen" disabled={busy} onClick={()=>void save('recovery')}/></div>}
  </>
  {!!recoveryCodes.length&&<section className="settings-form" aria-live="polite"><p><LocalizedText>{'Speichere diese Wiederherstellungscodes an einem sicheren Ort. Sie werden nur einmal angezeigt. Jeder Code ist einmal verwendbar; alte Passkey-Wiederherstellungscodes sind ungültig.'}</LocalizedText></p><ul>{recoveryCodes.map(code=><li key={code}><code translate="no">{code}</code></li>)}</ul><Button variant="secondary" onClick={()=>setRecoveryCodes([])}><LocalizedText>{'Codes sicher gespeichert'}</LocalizedText></Button></section>}
  {notice&&<p role="status" className="settings-note"><LocalizedText>{notice}</LocalizedText></p>}
  {error&&!open&&<ErrorState onRetry={()=>void load()}><LocalizedText>{error}</LocalizedText></ErrorState>}
  <FormSheet open={open} label={target?'Passkey verwalten':'Passkey hinzufügen'} onClose={close} dirty={target?label!==target.label:!!label} busy={busy}>
   <section className="settings-form">
    <Field label="Bezeichnung"><Input value={label} maxLength={100} onChange={e=>setLabel(e.target.value)}/></Field>
    {target&&<p><LocalizedText>{'Beim Entfernen werden alle anderen Sitzungen abgemeldet. Passwort und Authenticator bleiben erhalten.'}</LocalizedText></p>}
    {error&&<ErrorState><LocalizedText>{error}</LocalizedText></ErrorState>}
    <FormActions sheet>{target&&<Button variant="danger" disabled={busy} onClick={()=>void save('remove')}><LocalizedText>{'Passkey entfernen'}</LocalizedText></Button>}<Button disabled={busy||target!==null&&!label.trim()} onClick={()=>void save(target?'rename':'add')}><LocalizedText>{target?'Bezeichnung speichern':'Passkey hinzufügen'}</LocalizedText></Button></FormActions>
   </section>
  </FormSheet>
 </SettingsGroup>;
}
