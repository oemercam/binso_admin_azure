'use client'
import { useEffect,useMemo,useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import { Input,Select } from '@/components/ui/form-controls'
import type { OrganizationMembership,SignupRequest } from '@/types/domain'

type Signup=SignupRequest&{onboardingStatus:'not_started'|'in_progress'|'completed'|'skipped';onboardingStep:number;onboardingCompletedSteps:number[];onboardingModulePreferences:string[];onboardingBusinessSettings:Record<string,string|number|boolean>}
type State={signup:Signup|null;memberships:OrganizationMembership[]}
const modules=[['crm','Kunden'],['quotes','Angebote'],['orders','Aufträge'],['time','Zeiterfassung'],['invoices','Rechnungen'],['finance','Finanzen']]
const steps=['Unternehmen','Module','Geschäftseinstellungen','Team','Fertig']

export default function OnboardingPage(){
 const router=useRouter();const[state,setState]=useState<State|null>(null);const[ready,setReady]=useState(false);const[saving,setSaving]=useState(false);const[error,setError]=useState('')
 const signup=state?.signup??null;const[step,setStep]=useState(1);const[prefs,setPrefs]=useState<string[]>([]);const[settings,setSettings]=useState<Record<string,string|number|boolean>>({currency:'CHF',vatRate:'8.1',paymentDays:30});
 useEffect(()=>{void(async()=>{try{const r=await fetch('/api/onboarding',{cache:'no-store'});const j=await r.json() as State&{error?:string};if(!r.ok)throw new Error(j.error||'Onboarding konnte nicht geladen werden.');setState(j);if(j.signup){setStep(j.signup.onboardingStep||1);setPrefs(j.signup.onboardingModulePreferences||[]);setSettings({currency:'CHF',vatRate:'8.1',paymentDays:30,...j.signup.onboardingBusinessSettings})}}catch(e){setError(e instanceof Error?e.message:'Onboarding konnte nicht geladen werden.')}finally{setReady(true)}})()},[])
 const existing=state?.memberships?.[0];const progress=useMemo(()=>Math.round((step/steps.length)*100),[step])
 async function persist(next:number,status:'in_progress'|'skipped'='in_progress'){if(!signup)return;setSaving(true);try{const completed=Array.from(new Set([...(signup.onboardingCompletedSteps||[]),step])).filter(x=>x<5);const r=await fetch('/api/onboarding',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({signupId:signup.id,step:next,completedSteps:completed,modulePreferences:prefs,businessSettings:settings,status})});const j=await r.json() as {signup?:Signup;error?:string};if(!r.ok||!j.signup)throw new Error(j.error||'Schritt konnte nicht gespeichert werden.');setState(s=>s?{...s,signup:j.signup!}:s);setStep(next)}catch(e){setError(e instanceof Error?e.message:'Schritt konnte nicht gespeichert werden.')}finally{setSaving(false)}}
 async function finish(){if(!signup||saving)return;setSaving(true);setError('');try{await persist(5);const r=await fetch('/api/onboarding',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({signupId:signup.id})});const j=await r.json() as {organizationId?:string;error?:string};if(!r.ok||!j.organizationId)throw new Error(j.error||'Organisation konnte nicht erstellt werden.');router.push('/dashboard?welcome=1');router.refresh()}catch(e){setError(e instanceof Error?e.message:'Organisation konnte nicht erstellt werden.')}finally{setSaving(false)}}
 if(!ready)return null
 if(existing)return <section className="page apple-page"><PageHeader title="Willkommen" description="Deine Organisation ist bereits eingerichtet."/><div className="customer-quick-actions"><button className="button primary" onClick={()=>router.push('/dashboard')}>Zum Dashboard</button></div></section>
 if(!signup)return <section className="page apple-page"><PageHeader title="Willkommen" description="Keine offene Registrierung gefunden."/>{error&&<p className="form-error">{error}</p>}</section>
 return <section className="page apple-page onboarding-v73"><PageHeader title="Binso One einrichten" description="In wenigen Schritten startklar. Du kannst jederzeit fortfahren."/>
  <div className="onboarding-progress"><div><span>Schritt {step} von {steps.length}</span><strong>{steps[step-1]}</strong></div><i><b style={{width:`${progress}%`}}/></i></div>
  <div className="onboarding-step-card">
   {step===1&&<><h2>Unternehmen</h2><p>Diese Angaben stammen aus deiner Registrierung.</p><div className="customer-overview-list"><div><span>Firma</span><strong>{signup.companyName}</strong></div><div><span>Inhaber</span><strong>{signup.ownerName}</strong></div><div><span>E-Mail</span><strong>{signup.email}</strong></div><div><span>Plan</span><strong>{signup.plan}</strong></div></div></>}
   {step===2&&<><h2>Module auswählen</h2><p>Wähle, was du zuerst nutzen möchtest. Das ändert keine Aboberechtigungen.</p><div className="onboarding-module-grid">{modules.map(([id,label])=><label key={id}><Input type="checkbox" checked={prefs.includes(id)} onChange={e=>setPrefs(v=>e.target.checked?[...v,id]:v.filter(x=>x!==id))}/><span>{label}</span></label>)}</div></>}
   {step===3&&<><h2>Geschäftseinstellungen</h2><div className="form-grid"><label><span>Währung</span><Select value={String(settings.currency??'CHF')} onChange={e=>setSettings(v=>({...v,currency:e.target.value}))}><option>CHF</option><option>EUR</option></Select></label><label><span>MWST %</span><Input value={String(settings.vatRate??'8.1')} onChange={e=>setSettings(v=>({...v,vatRate:e.target.value}))}/></label><label><span>Zahlungsziel Tage</span><Input type="number" min="0" max="180" value={String(settings.paymentDays??30)} onChange={e=>setSettings(v=>({...v,paymentDays:Number(e.target.value)}))}/></label></div></>}
   {step===4&&<><h2>Team</h2><p>Mitarbeitende kannst du auch später einladen. Für den Start ist nichts weiter nötig.</p><div className="list-empty">Optionaler Schritt – später unter Organisation → Mitarbeitende verfügbar.</div></>}
   {step===5&&<><h2>Bereit zum Start</h2><p>Deine Organisation wird jetzt erstellt. Danach kannst du direkt mit Kunde, Angebot, Auftrag oder Rechnung beginnen.</p></>}
  </div>
  {error&&<p className="form-error" role="alert">{error}</p>}
  <div className="onboarding-actions">{step>1&&<button className="button secondary" disabled={saving} onClick={()=>void persist(step-1)}>Zurück</button>}<span/>{step<5?<button className="button primary" disabled={saving} onClick={()=>void persist(step+1)}>{saving?'Speichern…':'Weiter'}</button>:<button className="button primary" disabled={saving} onClick={()=>void finish()}>{saving?'Wird eingerichtet…':'Binso One starten'}</button>}</div>
 </section>
}
