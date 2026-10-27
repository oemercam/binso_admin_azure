'use client';
import {useEffect,useRef,useState} from 'react';
import {useRouter,useSearchParams} from 'next/navigation';
import {useApiQuery} from '@/lib/client/use-api-query';
import {apiPatch} from '@/lib/client/backend';
import {usePageAccess} from '@/lib/client/page-access';
import {LocalizedText} from '@/lib/client/locale';
import {safeAppPath} from '@/lib/navigation';
import {requiredSetupTasks,setupStepIssues,type SetupStep} from '@/lib/setup-readiness';
import {setupFieldIds} from '@/lib/action-readiness';
import {AppShell} from './app-shell';
import {FormPage,SettingsGroup} from './binso-ux';
import {Button,ErrorState,Field,FormActions,Input,LoadingState} from './ui';
import ConfirmDialog from './confirm-dialog';
import {allowDraftNavigation,useBrowserBackGuard} from './use-browser-back-guard';
import {useProcessDraft} from './use-process-draft';
import {SetupProgress} from './setup-guide';
type Company=Record<string,unknown>;
const editableSetupFields=['name','legal_name','street','building_number','postal_code','city','country_code','iban'] as const;
/** One full page and one atomic save; optional preferences remain in settings. */
export function SetupProcess(){
 const router=useRouter(),search=useSearchParams(),{write}=usePageAccess();
 const query=useApiQuery<{item:Company}>('/api/settings/company');
 const returnTo=safeAppPath(search.get('returnTo'),'/dashboard');
 const [saved,setSaved]=useState<Company|null>(null),[draft,setDraft]=useState<Company>({});
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[finished,setFinished]=useState(false);
 const [destination,setDestination]=useState<string|null>(null),[discard,setDiscard]=useState(false);
 const pending=useRef(false),base=saved??query.data?.item??{},company={...base,...draft};
 const dirty=Object.keys(draft).some(key=>String(draft[key]??'')!==String(base[key]??''));
 const recovery=useProcessDraft({process:'company:setup',value:draft,dirty,enabled:!query.loading&&!query.error&&!finished&&write,onRestore:value=>{
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.entries(value).some(([key,item])=>!editableSetupFields.includes(key as typeof editableSetupFields[number])||typeof item!=='string'||item.length>320))return;
  setDraft(value);
 }});
 const exit=(href:string)=>{if(pending.current)return;if(dirty){setDestination(href);setDiscard(true)}else {recovery.clear();router.push(href)}};
 const leave=useBrowserBackGuard(dirty||busy,()=>{if(!pending.current){setDestination(null);setDiscard(true)}},dirty||busy,href=>{if(!pending.current){const url=new URL(href,window.location.href);setDestination(url.origin===window.location.origin?safeAppPath(url.pathname+url.search+url.hash,returnTo):returnTo);setDiscard(true)}});
 const value=(key:string)=>String(company[key]??(key==='country_code'?'CH':''));
 const change=(key:string,value:string)=>setDraft(previous=>({...previous,[key]:key==='country_code'?value.toUpperCase():value}));
 const issues=(['name','address','bank'] as SetupStep[]).flatMap(step=>setupStepIssues(company,step));
 useEffect(()=>{if(query.loading||query.error||finished||!recovery.ready)return;const old=search.get('setupStep');const target=window.location.hash.slice(1)||setupFieldIds[old==='bank'?'iban':old==='address'?'street':'name'];const frame=requestAnimationFrame(()=>document.getElementById(target)?.focus({preventScroll:true}));return()=>cancelAnimationFrame(frame)},[query.loading,query.error,finished,recovery.ready,search]);
 const save=async()=>{
  if(pending.current||!write||!recovery.ready||query.loading||query.error)return;
  if(issues.length){setError(issues[0].message);document.getElementById(setupFieldIds[issues[0].field])?.focus();return;}
  pending.current=true;setBusy(true);setError('');
  try{
   const response=await apiPatch<{item:Company}>('/api/settings/company',{name:value('name'),legalName:value('legal_name'),street:value('street'),buildingNumber:value('building_number'),postalCode:value('postal_code'),city:value('city'),countryCode:value('country_code')||'CH',iban:value('iban'),qrIban:value('qr_iban'),completeCompanySetup:true,completeOnboarding:true});
   const missing=(['name','address','bank'] as SetupStep[]).flatMap(step=>setupStepIssues(response.item,step));
   if(missing.length)throw new Error(missing[0].message);
   recovery.clear();setSaved(response.item);setDraft({});query.refresh();setFinished(true);
  }catch(reason){setError(reason instanceof Error?reason.message:'Einstellungen konnten nicht gespeichert werden.')}
  finally{pending.current=false;setBusy(false)}
 };
 const field=(key:string,label:string,id?:string,options?:{autoComplete?:string;maxLength?:number;type?:string})=><Field key={key} label={label}><Input id={id} value={value(key)} onChange={event=>change(key,event.target.value)} disabled={busy||!write||!recovery.ready} {...options}/></Field>;
 return <AppShell title="Firma vervollständigen" active="einstellungen" editing={!finished} orientationText={null} loading={query.loading} unsavedChanges={false} backHref={returnTo} backLabel="Übersicht">
 {query.loading?<LoadingState/>:query.error?<ErrorState onRetry={query.refresh}>{query.error}</ErrorState>:finished?<section className="surface" role="status"><h2><LocalizedText>Deine Rechnungsangaben sind vollständig</LocalizedText></h2><Button onClick={()=>{allowDraftNavigation();router.push(returnTo)}}>Zur Übersicht</Button></section>:<FormPage open guarded={false} dirty={dirty} busy={busy} label="Firma vervollständigen" onClose={()=>exit(returnTo)}>
 <form noValidate className="settings-form setup-process-form" onSubmit={event=>{event.preventDefault();void save()}}>
 <SetupProgress tasks={requiredSetupTasks(company)} compact/>
 <SettingsGroup title="Unternehmen"><div className="form-grid two">{field('name','Firmenname',setupFieldIds.name,{autoComplete:'organization'})}{field('legal_name','Rechtlicher Firmenname',setupFieldIds.legalName,{maxLength:70})}<p className="settings-note full"><LocalizedText>Nur ausfüllen, wenn der rechtliche Name vom Firmennamen abweicht.</LocalizedText></p></div></SettingsGroup>
 <SettingsGroup title="Adresse"><div className="form-grid two">{field('street','Strasse',setupFieldIds.street,{autoComplete:'address-line1',maxLength:70})}{field('building_number','Hausnummer',undefined,{maxLength:16})}{field('postal_code','PLZ',setupFieldIds.postalCode,{autoComplete:'postal-code',maxLength:16})}{field('city','Ort',setupFieldIds.city,{autoComplete:'address-level2',maxLength:35})}{field('country_code','Land (Ländercode)',setupFieldIds.countryCode,{autoComplete:'country',maxLength:2})}</div></SettingsGroup>
 <SettingsGroup title="Zahlungskonto"><div className="form-grid two">{field('iban','IBAN',setupFieldIds.iban,{autoComplete:'off'})}</div></SettingsGroup>
 {error&&<ErrorState>{error}</ErrorState>}
 <FormActions><Button variant="secondary" disabled={busy} onClick={()=>exit(returnTo)}>Abbrechen</Button><Button requiresWrite type="submit" disabled={busy||!write||!recovery.ready}>{busy?'Wird gespeichert…':'Einrichtung abschliessen'}</Button></FormActions>
 </form></FormPage>}
 <ConfirmDialog open={discard} busy={busy} title="Änderungen verwerfen?" message="Deine Änderungen sind noch nicht gespeichert und gehen verloren." confirmLabel="Verwerfen" onCancel={()=>setDiscard(false)} onConfirm={()=>{recovery.clear();allowDraftNavigation();setDraft({});setDiscard(false);if(destination)router.push(destination);else leave()}}/>
 </AppShell>;
}
