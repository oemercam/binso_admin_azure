'use client';
import {useEffect,useState} from 'react';
import {SettingsGroup} from './binso-ux';
import {Button,FormActions,ErrorState} from './ui';
import {LocalizedText} from '@/lib/client/locale';
import {apiGet,apiPatch} from '@/lib/client/backend';
import {supportsPasskeys} from '@/lib/client/passkeys';

/** Non-modal, after verified onboarding; dismissal belongs to the real account. */
export function PasskeySetupOffer({enabled}:{enabled:boolean}){
 const [show,setShow]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{let active=true;if(enabled&&supportsPasskeys())void apiGet<{offer:boolean}>('/api/auth/passkeys').then(value=>{if(active)setShow(value.offer===true)}).catch(()=>{});return()=>{active=false;};},[enabled]);
 const later=async()=>{if(busy)return;setBusy(true);try{await apiPatch('/api/auth/passkeys',{action:'later'});setShow(false);}catch{setError('Änderung konnte nicht gespeichert werden.');}finally{setBusy(false);}};
 if(!enabled||!show)return null;
 return <SettingsGroup title="Schneller und sicherer anmelden"><p><LocalizedText>{'Melde dich künftig mit Face ID, Fingerabdruck oder deiner Geräteentsperrung an.'}</LocalizedText></p>{error&&<ErrorState><LocalizedText>{error}</LocalizedText></ErrorState>}<FormActions><Button href="/einstellungen/sicherheit"><LocalizedText>{'Passkey einrichten'}</LocalizedText></Button><Button variant="secondary" disabled={busy} onClick={()=>void later()}><LocalizedText>{'Später'}</LocalizedText></Button></FormActions></SettingsGroup>;
}
