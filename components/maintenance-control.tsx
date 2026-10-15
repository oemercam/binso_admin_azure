"use client";
import {useRef,useState} from "react";
import {useApiQuery} from "@/lib/client/use-api-query";
import {apiPost} from "@/lib/client/backend";
import {LocalizedText} from "@/lib/client/locale";
import {Button,ErrorState,Select,Field,Status} from "./ui";
import {WorkspaceSection} from "./binso-ux";
import ConfirmDialog from "./confirm-dialog";
export function MaintenanceControl({canManage}:{canManage:boolean}){
 const resource=useApiQuery<{enabled:boolean;endsAt:string|null}>("/api/operator/maintenance");
 const [minutes,setMinutes]=useState("60"),[confirm,setConfirm]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const pending=useRef(false);
 const change=async()=>{if(pending.current)return;pending.current=true;setBusy(true);setError("");try{await apiPost("/api/operator/maintenance",{enabled:!resource.data?.enabled,minutes:Number(minutes)});setConfirm(false);resource.refresh();}catch(error){setError(error instanceof Error?error.message:"Ungültige Anfrage.");}finally{pending.current=false;setBusy(false);}};
 return <WorkspaceSection><h2><LocalizedText>{"Wartungsmodus"}</LocalizedText></h2>{resource.error&&<ErrorState onRetry={resource.refresh}>{resource.error}</ErrorState>}{resource.data&&<><Status tone={resource.data.enabled?"warning":"success"}><LocalizedText>{resource.data.enabled?"Aktiv":"Inaktiv"}</LocalizedText></Status>{canManage&&<><Field label="Dauer"><Select value={minutes} onChange={event=>setMinutes(event.target.value)} disabled={busy||resource.data.enabled}><option value="15">15 min</option><option value="30">30 min</option><option value="60">60 min</option><option value="120">120 min</option><option value="240">240 min</option></Select></Field><Button variant={resource.data.enabled?"secondary":"primary"} disabled={busy} onClick={()=>setConfirm(true)}><LocalizedText>{resource.data.enabled?"Wartung beenden":"Wartung aktivieren"}</LocalizedText></Button></>}</>}{error&&<ErrorState>{error}</ErrorState>}<ConfirmDialog open={confirm} title={resource.data?.enabled?"Wartung beenden":"Wartung aktivieren"} message="Der Wartungsmodus unterbricht den Kundenzugriff. Der Adminzugang bleibt erreichbar." confirmLabel="Bestätigen" cancelLabel="Abbrechen" onCancel={()=>{if(!busy)setConfirm(false)}} onConfirm={()=>void change()}/></WorkspaceSection>;
}
