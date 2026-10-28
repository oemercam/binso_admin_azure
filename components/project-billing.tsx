"use client";
import {useState} from 'react';
import type {BillingTerms} from '@/lib/billing-model';
import {LocalizedText} from '@/lib/client/locale';
import {apiPost} from '@/lib/client/backend';
import {billingModelLabels} from './billing-terms-editor';
import {Button,ErrorState,SectionTitle} from './ui';
import {WorkspaceSection} from './binso-ux';
export function ProjectBilling({id,version,terms,completed,canWrite,onRefresh}:{id:string;version:number;terms?:BillingTerms|null;completed:string[];canWrite:boolean;onRefresh:()=>void}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const complete=async(milestoneId:string)=>{if(busy)return;setBusy(true);setError('');try{await apiPost('/api/projects/'+encodeURIComponent(id)+'/milestones/'+encodeURIComponent(milestoneId),{version});onRefresh()}catch(e){setError(e instanceof Error?e.message:'Die Anfrage konnte nicht verarbeitet werden.')}finally{setBusy(false)}};
 if(!terms)return null;
 return <WorkspaceSection><SectionTitle title="Abrechnungsmodell"/><p><LocalizedText>{billingModelLabels[terms.model]}</LocalizedText></p>{terms.model==='milestone'&&<div className="compact-list">{terms.milestones.map(m=><div key={m.id}><span translate="no">{m.label}</span><Button requiresWrite disabled={!canWrite||busy||m.completed||completed.includes(m.id)} variant="secondary" onClick={()=>void complete(m.id)}><LocalizedText>{m.completed||completed.includes(m.id)?'Erfüllt':'Als erfüllt bestätigen'}</LocalizedText></Button></div>)}</div>}{error&&<ErrorState>{error}</ErrorState>}</WorkspaceSection>;
}
