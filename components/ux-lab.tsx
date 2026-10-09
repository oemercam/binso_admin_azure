"use client";

import {useState} from "react";
import {PageAccessContext} from "@/lib/client/page-access";
import {PageHeading,DetailHeading,ActionRow,ActionSheet,FormSheet,FilterSheet,ListRow} from "./binso-ux";
import {HeaderPanel,type HeaderPanelKind} from "./header-panel";
import {SearchPanel,NotificationPanel,AccountPanel} from "./header-panel-content";
import {Avatar} from "./avatar";
import {FormWizard} from "./form-wizard";
import {DocumentPageViewer} from "./pdf-preview";
import {Button,EmptyState,Field,Input,Select,Textarea,Toggle,Status,IconButton} from "./ui";

/** Local development only. No API calls, authentication or production records. */
export function UxLab(){
 const [panel,setPanel]=useState<HeaderPanelKind|null>(null),[sheet,setSheet]=useState<"action"|"form"|"filter"|"wizard"|null>(null);
 const [query,setQuery]=useState(""),[value,setValue]=useState(""),[checked,setChecked]=useState(false),[step,setStep]=useState(0);
 const [file,setFile]=useState<Blob|null>(null),[filter,setFilter]=useState<"all"|"unread">("all");
 const close=()=>setPanel(null),closeSheet=()=>setSheet(null);
 const fields=<><Field label="Name"><Input value={value} onChange={e=>setValue(e.target.value)}/></Field><Field label="Auswahl"><Select><option>Beispiel</option></Select></Field><Field label="Beschreibung"><Textarea/></Field></>;
 return <PageAccessContext.Provider value={{write:true,canOpen:()=>true}}><main className="ux-lab">
  <div className="desktop-appbar"><PageHeading title="UX-Lab"/><IconButton label="Suche" icon="search" onClick={()=>setPanel("search")}/><IconButton label="Benachrichtigungen" icon="bell" onClick={()=>setPanel("notifications")}/><IconButton label="Konto" icon="user" onClick={()=>setPanel("account")}/></div>
  <header className="mobile-header"><b>UX-Lab</b><IconButton label="Suche" icon="search" onClick={()=>setPanel("search")}/><IconButton label="Benachrichtigungen" icon="bell" onClick={()=>setPanel("notifications")}/><IconButton label="Konto" icon="user" onClick={()=>setPanel("account")}/></header>
  <p>Entwicklungsreferenz mit ausschliesslich synthetischen Beispielen.</p><DetailHeading title="Detailheader" status="Aktiv" tone="success"/>
  <section><h2>Avatar und Status</h2>{["Nina Müller","Alex Muster","Ömer Cam","", "Sarah Meier"].map((name,i)=><Avatar key={i} name={name} identity={name} size="large"/>)}{(["success","warning","danger","info","neutral"] as const).map(tone=><Status key={tone} tone={tone}>{tone}</Status>)}</section>
  <section><h2>Felder und Schalter</h2><div className="form-grid two">{fields}</div><Toggle checked={checked} onChange={()=>setChecked(!checked)} label="Beispiel"/></section>
  <section><h2>Listen und Leerzustand</h2><ListRow title="Beispieldatensatz" meta="Synthetische Metadaten" value="CHF 185.00" status="Offen"/><EmptyState compact title="Keine Einträge" text=""/><EmptyState title="Keine Ergebnisse" text="Passe die Suche an."/></section>
  <section><h2>Sheets</h2><div className="quick-grid">{(["action","form","filter","wizard"] as const).map(kind=><Button key={kind} variant="secondary" onClick={()=>{setPanel(null);setSheet(kind)}}>{kind}</Button>)}</div></section>
  <section><h2>DocumentPageViewer</h2><Input type="file" accept="application/pdf" onChange={e=>setFile(e.target.files?.[0]??null)}/>{file?<div className="ux-lab-viewer"><DocumentPageViewer file={file}/></div>:<EmptyState compact title="Lokales Test-PDF auswählen" text=""/>}</section>
  {panel&&<HeaderPanel key={panel} kind={panel} label={panel==="search"?"Suche":panel==="notifications"?"Benachrichtigungen":"Konto"} onClose={close}>{panel==="search"?<SearchPanel query={query} onQuery={setQuery} items={[]} loading={false} error={null} onClose={close}/>:panel==="account"?<AccountPanel profile={{name:"Nina Müller",identity:"lab-person",avatar:""}} demo={false} logoutBusy={false} onLogout={close} onClose={close}/>:<NotificationPanel items={[]} loading={false} error={null} filter={filter} onFilter={setFilter} onRead={()=>{}} onReadAll={()=>{}} onRetry={()=>{}} onClose={close}/>}</HeaderPanel>}
  <ActionSheet open={sheet==="action"} label="ActionSheet" onClose={closeSheet}><ActionRow title="Bearbeiten" icon="edit" onClick={closeSheet} navigation/><ActionRow title="Löschen" icon="close" onClick={closeSheet} danger/></ActionSheet>
  <FormSheet open={sheet==="form"} label="FormSheet" onClose={closeSheet} actions={<><Button variant="secondary" onClick={closeSheet}>Abbrechen</Button><Button onClick={closeSheet}>Speichern</Button></>}>{fields}</FormSheet>
  <FilterSheet open={sheet==="filter"} label="FilterSheet" onClose={closeSheet} actions={<Button onClick={closeSheet}>Anwenden</Button>}>{fields}</FilterSheet>
  <FormSheet open={sheet==="wizard"} wizard label="WizardSheet" onClose={closeSheet}><FormWizard labels={["Angaben","Prüfen"]} step={step} onStep={setStep} action={<Button onClick={closeSheet}>Speichern</Button>}><div hidden={step!==0}>{fields}</div><div hidden={step!==1}>{value||"Keine Angaben"}</div></FormWizard></FormSheet>
 </main></PageAccessContext.Provider>;
}
