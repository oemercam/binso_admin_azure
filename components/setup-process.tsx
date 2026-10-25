'use client';
import {useEffect,useRef,useState} from 'react';
import {useRouter,useSearchParams} from 'next/navigation';
import {useApiQuery} from '@/lib/client/use-api-query';
import {apiGet,apiPatch} from '@/lib/client/backend';
import {usePageAccess} from '@/lib/client/page-access';
import {LocalizedText,useTranslation} from '@/lib/client/locale';
import {safeAppPath} from '@/lib/navigation';
import {requiredSetupTasks,setupProcessDestination,setupSteps,setupStepIssues,type SetupStep} from '@/lib/setup-readiness';
import {setupDestination,setupFieldIds} from '@/lib/action-readiness';
import {domainConfig} from '@/config/domain';
import {AppShell} from './app-shell';
import {SetupProgress} from './setup-guide';
import {ActionRow,DetailDisclosure} from './binso-ux';
import {Button,ErrorState,Field,FormActions,Input,LoadingState,Select,Textarea} from './ui';
import ConfirmDialog from './confirm-dialog';
import {allowDraftNavigation,useBrowserBackGuard} from './use-browser-back-guard';

type Company=Record<string,unknown>;
/** Guided composition of the existing company/document APIs and central controls. */
export function SetupProcess(){
 const router=useRouter(),search=useSearchParams(),t=useTranslation(),{write}=usePageAccess();
 const query=useApiQuery<{item:Company}>('/api/settings/company');
 const requested=search.get('setupStep'),returnTo=safeAppPath(search.get('returnTo'),'/dashboard');
 const step:SetupStep=setupSteps.includes(requested as SetupStep)?requested as SetupStep:'name';
 const [saved,setSaved]=useState<Company|null>(null),[draft,setDraft]=useState<Company>({});
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[finished,setFinished]=useState(false);
 const [destination,setDestination]=useState<string|null>(null),[discard,setDiscard]=useState(false);
 const pending=useRef(false),base=saved??query.data?.item??{},company={...base,...draft};
 const dirty=Object.keys(draft).some(key=>String(draft[key]??'')!==String(base[key]??''));
 const exit=(href:string)=>{if(pending.current)return;if(dirty){setDestination(href);setDiscard(true)}else router.push(href)};
 const leave=useBrowserBackGuard(dirty||busy,()=>{if(!pending.current){setDestination(null);setDiscard(true)}},dirty||busy,href=>{if(!pending.current){const url=new URL(href,window.location.href);setDestination(url.origin===window.location.origin?safeAppPath(url.pathname+url.search+url.hash,returnTo):returnTo);setDiscard(true)}});
 const value=(key:string)=>String(company[key]??(key==='country_code'?'CH':'')),change=(key:string,value:string)=>setDraft(previous=>({...previous,[key]:key==='country_code'?value.toUpperCase():value}));
 const tasks=requiredSetupTasks(base,returnTo),allComplete=tasks.every(task=>task.complete);
 const activeIssues=setupStepIssues(company,step),focusField=setupStepIssues(base,step)[0]?.field??(step==='name'?'name':step==='address'?'street':'iban');
 useEffect(()=>{if(query.loading||query.error||finished)return;const frame=requestAnimationFrame(()=>document.getElementById(setupFieldIds[focusField])?.focus({preventScroll:true}));return()=>cancelAnimationFrame(frame)},[step,focusField,query.loading,query.error,finished]);
 useEffect(()=>{let active=true;queueMicrotask(()=>{if(active){setError('');setNotice('')}});return()=>{active=false}},[step]);
 const save=async()=>{
  if(pending.current||!write||query.loading||query.error)return;
  // Bank validation precedes the existing fresh-authentication dialog; server
  // validation and authorization remain authoritative and unchanged.
  if(step==='bank'&&activeIssues.length){setError(activeIssues[0].message);document.getElementById(setupFieldIds[activeIssues[0].field])?.focus();return;}
  if(!value('name').trim()){setError('Firmenname ist erforderlich.');return;}
  pending.current=true;setBusy(true);setError('');setNotice('');
  try{
   const payload=step==='bank'?{vatRate:Number(company.vat_rate??8.1),paymentTermsDays:Number(company.payment_terms_days??30),iban:value('iban'),qrIban:value('qr_iban'),invoiceIntroText:value('invoice_intro_text'),invoiceFooterText:value('invoice_footer_text'),quoteIntroText:value('quote_intro_text'),quoteFooterText:value('quote_footer_text')}:{name:value('name'),legalName:value('legal_name'),street:value('street'),buildingNumber:value('building_number'),postalCode:value('postal_code'),city:value('city'),countryCode:value('country_code')||'CH',uid:value('uid'),email:value('email'),phone:value('phone'),completeOnboarding:search.get('onboarding')==='1'};
   const response=await apiPatch<{item:Company}>(step==='bank'?'/api/settings/documents':'/api/settings/company',payload);
   const next=step==='bank'?(await apiGet<{item:Company}>('/api/settings/company')).item:{...company,...response.item};setSaved(next);setDraft({});query.refresh();
   const issues=setupStepIssues(next,step);
   if(issues.length){setNotice('Teilstand gespeichert. Für Rechnungen fehlen noch gültige Pflichtangaben.');document.getElementById(setupFieldIds[issues[0].field])?.focus();return;}
   const nextTasks=requiredSetupTasks(next),missing=nextTasks.find(task=>!task.complete);
   if(!missing){setFinished(true);return;}
   const nextStep=setupSteps.slice(setupSteps.indexOf(step)+1).find(candidate=>!nextTasks.find(task=>task.id===candidate)?.complete)??missing.id as SetupStep;
   setNotice('Gespeichert.');allowDraftNavigation();router.replace(setupProcessDestination(nextStep,returnTo));
  }catch(reason){setError(reason instanceof Error?reason.message:'Einstellungen konnten nicht gespeichert werden.')}
  finally{pending.current=false;setBusy(false)}
 };
 const field=(key:string,label:string,id?:string,options?:{autoComplete?:string;maxLength?:number;type?:string})=><Field key={key} label={label} error={notice&&activeIssues.some(issue=>setupFieldIds[issue.field]===id)?'Für Rechnungen erforderlich':undefined}><Input id={id} value={value(key)} onChange={event=>change(key,event.target.value)} disabled={busy} {...options}/></Field>;
 return <AppShell title={finished?'Rechnungsangaben vollständig':['Unternehmen','Adresse','Zahlungskonto'][setupSteps.indexOf(step)]} active="einstellungen" orientationText={null} loading={query.loading} backHref={returnTo} backLabel="Übersicht">
  {query.loading?<LoadingState/>:query.error?<ErrorState onRetry={query.refresh}>{query.error}</ErrorState>:<div className="setup-process">
   {finished?<section className="surface" role="status"><h2><LocalizedText>Deine Rechnungsangaben sind vollständig</LocalizedText></h2><Button onClick={()=>{allowDraftNavigation();router.push(returnTo)}}>Zur Übersicht</Button></section>:<>
    <SetupProgress tasks={tasks} active={step}/>
    <p className="settings-note"><LocalizedText>Bereich</LocalizedText> {setupSteps.indexOf(step)+1} / 3 · <LocalizedText>Pflichtangaben für Rechnungen</LocalizedText></p>
    <form noValidate className="settings-form setup-process-form" onSubmit={event=>{event.preventDefault();return save()}}>
     <div className="form-grid two">
      {step==='name'&&<>{field('name','Firmenname',setupFieldIds.name,{autoComplete:'organization'})}{field('legal_name','Rechtlicher Firmenname',setupFieldIds.legalName,{maxLength:70})}<p className="settings-note full"><LocalizedText>Nur ausfüllen, wenn der rechtliche Name vom Firmennamen abweicht.</LocalizedText></p></>}
      {step==='address'&&<>{field('street','Strasse',setupFieldIds.street,{autoComplete:'address-line1',maxLength:70})}{field('building_number','Hausnummer',undefined,{maxLength:16})}{field('postal_code','PLZ',setupFieldIds.postalCode,{autoComplete:'postal-code',maxLength:16})}{field('city','Ort',setupFieldIds.city,{autoComplete:'address-level2',maxLength:35})}{field('country_code','Land (Ländercode)',setupFieldIds.countryCode,{autoComplete:'country',maxLength:2})}</>}
      {step==='bank'&&<>{field('iban','IBAN',setupFieldIds.iban,{autoComplete:'off'})}<div className="full"><DetailDisclosure label="QR-IBAN verwenden" defaultOpen={Boolean(value('qr_iban'))}>{field('qr_iban','QR-IBAN',setupFieldIds.qrIban)}<p className="settings-note"><LocalizedText>Nur ausfüllen, wenn deine Bank eine QR-IBAN bereitstellt.</LocalizedText></p></DetailDisclosure></div></>}
     </div>
     <DetailDisclosure label="Optional ergänzen" defaultOpen={false}>
      {step!=='bank'?<div className="form-grid two">{field('uid','UID')}{field('email','E-Mail',undefined,{type:'email'})}{field('phone','Telefon',undefined,{type:'tel'})}<ActionRow title="Firmenlogo" icon="upload" href={setupDestination('logo',setupProcessDestination(step,returnTo))}/></div>:<div className="form-grid two"><Field label="Standard-MwSt."><Select value={value('vat_rate')||'8.1'} onChange={event=>change('vat_rate',event.target.value)}>{domainConfig.vatRates.map(rate=><option key={rate} value={rate}>{rate} %</option>)}</Select></Field>{field('payment_terms_days','Standard-Zahlungsfrist',setupFieldIds.paymentTerms,{type:'number'})}{['invoice_intro_text','invoice_footer_text','quote_intro_text','quote_footer_text'].map((key,index)=><Field key={key} label={['Rechnung – Einleitung','Rechnung – Schlusstext','Angebot – Einleitung','Angebot – Schlusstext'][index]}><Textarea value={value(key)} onChange={event=>change(key,event.target.value)} maxLength={2000}/></Field>)}</div>}
     </DetailDisclosure>
     {error&&<ErrorState>{error}</ErrorState>}{notice&&<p role="status" className="settings-note"><LocalizedText>{notice}</LocalizedText>{activeIssues.length>0&&' '+[...new Set(activeIssues.map(issue=>t({name:'Firmenname',legalName:'Rechtlicher Firmenname',street:'Strasse',postalCode:'PLZ',city:'Ort',countryCode:'Land (Ländercode)',iban:'IBAN',qrIban:'QR-IBAN'}[issue.field])))].join(' · ')}</p>}
     <div className="setup-process-actions"><FormActions><Button variant="secondary" disabled={busy} onClick={()=>exit(returnTo)}>Später fortsetzen</Button><Button type="submit" requiresWrite disabled={busy||!write}>{busy?'Wird gespeichert…':allComplete?'Angaben bestätigen':t('Speichern und weiter')}</Button></FormActions></div>
    </form>
   </>}
  </div>}
  <ConfirmDialog open={discard} busy={busy} title="Änderungen verwerfen?" message="Deine Änderungen sind noch nicht gespeichert und gehen verloren." confirmLabel="Verwerfen" onCancel={()=>setDiscard(false)} onConfirm={()=>{allowDraftNavigation();setDraft({});setDiscard(false);if(destination)router.push(destination);else leave()}}/>
 </AppShell>;
}
