"use client";
import {useState} from "react";import {Send} from "lucide-react";import {apiFetch,isProductionMode} from "@/lib/client/runtime";import {createFeedback} from "@/lib/pilot-store";import {notify} from "@/lib/notify";
export default function FeedbackForm({compact=false,onDone}:{compact?:boolean;onDone?:()=>void}){
 const [v,setV]=useState({rating:0,category:"Allgemein",text:"",contact:false});const [busy,setBusy]=useState(false);
 async function submit(){if(!v.rating||!v.text.trim()){notify("Bitte Bewertung und Feedback ausfüllen.","danger");return}setBusy(true);try{const input={...v,context:typeof window!=="undefined"?window.location.pathname:""};if(isProductionMode())await apiFetch("/api/feedback",{method:"POST",body:JSON.stringify(input)});else createFeedback(input);localStorage.setItem("binso-feedback-last",Date.now().toString());notify("Danke für dein Feedback.");onDone?.()}catch(e){notify(e instanceof Error?e.message:"Feedback konnte nicht gesendet werden.","danger")}finally{setBusy(false)}}
 return <div className={compact?"feedback-form compact":"feedback-form"}><div className="feedback-stars" aria-label="Bewertung">{[1,2,3,4,5].map(n=><button key={n} className={v.rating>=n?"active":""} onClick={()=>setV({...v,rating:n})} aria-label={`${n} von 5`}>★</button>)}</div><label><span>Kategorie</span><select value={v.category} onChange={e=>setV({...v,category:e.target.value})}><option>Allgemein</option><option>Bedienung</option><option>Funktion fehlt</option><option>Fehler</option><option>Idee</option></select></label><label><span>Was können wir verbessern?</span><textarea rows={compact?4:7} value={v.text} onChange={e=>setV({...v,text:e.target.value})} placeholder="Dein Feedback …"/></label><label className="feedback-contact">
  <input
    className="feedback-contact-checkbox"
    type="checkbox"
    checked={v.contact}
    onChange={e=>setV({...v,contact:e.target.checked})}
  />
  <span className="feedback-contact-text">Binso darf mich zu diesem Feedback kontaktieren.</span>
</label><button className="primary-button" onClick={submit} disabled={busy}><Send size={16}/>{busy?"Wird gesendet …":"Feedback senden"}</button></div>
}
