'use client';
import {useEffect,useState,useRef} from 'react';
import {useLocale,LocalizedText} from '@/lib/client/locale';
import {apiGet,apiPost,apiDelete} from '@/lib/client/backend';
import {Button,ErrorState,LoadingState} from './ui';
type DeviceConfig={enabled:boolean;publicKey:string|null;registered:boolean;stored:boolean};
export function PushDeviceSettings(){
 const {locale}=useLocale(),[config,setConfig]=useState<DeviceConfig|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),lock=useRef(false);
 useEffect(()=>{let active=true;apiGet<DeviceConfig>('/api/notifications/push').then(value=>{if(active)setConfig(value)}).catch(()=>{if(active)setError('Einstellungen konnten nicht geladen werden.')});return()=>{active=false}},[]);
 const toggle=async()=>{
  if(lock.current||!config||!config.enabled&&!config.stored)return;
  lock.current=true;setBusy(true);setError('');
  try{
   if(config.stored&&(!config.enabled||config.registered)){
    // Revocation remains possible with disabled/missing configuration or browser APIs.
    await apiDelete('/api/notifications/push');
    setConfig({...config,registered:false,stored:false});
    if('serviceWorker' in navigator){const registration=await navigator.serviceWorker.getRegistration('/');await (await registration?.pushManager.getSubscription())?.unsubscribe();}
    return;
   }
   if(!('serviceWorker' in navigator)||!('PushManager' in window)||!('Notification' in window))throw Error('Push wird auf diesem Gerät nicht unterstützt.');
   // iOS requires the permission request within the original user gesture, before registration awaits.
   const permission=Notification.permission==='granted'?'granted':await Notification.requestPermission();
   if(permission!=='granted')throw Error('Push benötigt eine Browserfreigabe. Aktiviere Benachrichtigungen in den Geräteeinstellungen.');
   const registration=await navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'});
   await navigator.serviceWorker.ready;
   const raw=atob(config.publicKey!.replaceAll('-','+').replaceAll('_','/')),key=Uint8Array.from(raw,c=>c.charCodeAt(0));
   let previous=await registration.pushManager.getSubscription();
   if(previous){
    const existing=previous.options.applicationServerKey?new Uint8Array(previous.options.applicationServerKey):null;
    if(!existing||existing.length!==key.length||existing.some((byte,index)=>byte!==key[index])){
     if(!await previous.unsubscribe())throw Error('Einstellung konnte nicht gespeichert werden.');
     previous=null;
    }
   }
   const subscription=previous??await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:key});
   try{await apiPost('/api/notifications/push',{subscription:subscription.toJSON(),locale});setConfig({...config,registered:true,stored:true})}
   catch(error){if(!previous)await subscription.unsubscribe();throw error}
  }catch(error){setError(error instanceof Error?error.message:'Einstellung konnte nicht gespeichert werden.')}
  finally{lock.current=false;setBusy(false)}
 };
 const removable=!!config?.stored&&(!config.enabled||config.registered);
 return <>{error&&<ErrorState>{error}</ErrorState>}{!config&&!error?<LoadingState/>:config?.enabled||config?.stored?<Button variant="secondary" disabled={busy} onClick={()=>void toggle()}><LocalizedText>{removable?'Push auf diesem Gerät deaktivieren':'Push auf diesem Gerät aktivieren'}</LocalizedText></Button>:<p><LocalizedText>Push-Zustellung ist noch nicht verfügbar.</LocalizedText></p>}</>;
}
