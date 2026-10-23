import fs from 'node:fs';
import path from 'node:path';
import {dependencyGraph,pageRoute} from './ux-inventory.mjs';

// Source inventory, never runtime permission or visual acceptance evidence.
const out=process.argv[2]??'docs/architecture/global-actions-v3';
fs.mkdirSync(out,{recursive:true});
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.posix.join(dir,e.name)):[path.posix.join(dir,e.name)]);
const pages=walk('app').filter(file=>/\/page\.tsx$/.test(file)&&!file.startsWith('app/dev/'));
const actions=[],routes=[];
for(const file of pages){
 const route=pageRoute(file),graph=dependencyGraph(file),surface=route.startsWith('/operator')?'Admin':'Kunden/öffentlich';
 const type=/\/(neu|bearbeiten|edit|new)(\/|$)/.test(route)?'Formular':route.includes('[')?'Detail':'Übersicht/Liste';
 let count=0;
 for(const owner of graph)for(const element of owner.elements){
  const props=element.props.join(' ');
  if(!/^(button|a|Link|Button|IconButton|ActionRow|RowActions|ActionsMenu|CreateAction|RecordRow|ListRow|form)$/.test(element.tag)&&!/(onClick|onSubmit|href)=/.test(props))continue;
  const context=graph.filter(x=>x.file===owner.file).flatMap(x=>x.conditions).filter(x=>/can|allow|role|plan|module|status|readOnly|permission|approved|submitted|invoic/i.test(x.expression));
  const target=element.props.filter(p=>/^(href|onClick|onSubmit|action|onOpen)=/.test(p)).join(' ');
  const newPlace=element.tag==='CreateAction'?'Kontext-Plus':/onSubmit=|type="submit"|Start|Pause|Stop|Freigeben|Bestätigen/.test(props)?'Direkte Prozesssteuerung':/RecordsControls|Filter|Import|Export/.test(owner.name+' '+props)?'Listenwerkzeuge':element.tag==='ActionsMenu'||element.tag==='RowActions'?'Detailheader (Listenfälle einzeln migrieren)':/href=/.test(target)?'Bestehende Navigation':'Fachlichen Kontext prüfen';
  actions.push({route,surface,type,header:type==='Detail'?'V4 Detail: Zurück/Titel/Objektmenü; Laufzeitabnahme offen':'V4 Übersicht: Titel/Suche/Glocke/Avatar; Admin-Funktionslücken offen',navigation:'Bestehende Navigation und Rückweg erhalten; Laufzeitprüfung offen',tenant:'Vorhandene serverseitige Mandantenprüfung; UI-Inventar ersetzt keinen RLS-Nachweis',language:'DE/FR/IT/EN/TR: seitenweise Prüfung offen',istSoll:'Aktueller Auslöser/Props und neuer Aktionsort getrennt; offene Zuordnung bleibt offen',entity:route.split('/').filter(Boolean)[route.startsWith('/operator')?1:0]??'Start',owner:owner.key,line:element.line,trigger:element.tag,props,target,newPlace,guards:context.map(x=>x.expression).join(' | '),permissions:'Bestehende Codebedingungen; serverseitige/rollenabhängige Prüfung nicht ausgeführt',subscription:'Bestehende Modul-/Tarifbedingungen im Owner; einzeln abzugleichen',recordStatus:'Bestehende Statusbedingungen im Owner; einzeln abzugleichen',responsive:'Zentraler Owner; tatsächliche Browserabnahme offen',tests:'Erreichbarkeit, Rollen/Status, Zielentität, Fokus, Mobile/Desktop',status:'Inventarisiert; Migration/Abnahme offen',scope:'Tatsächlich erreichbarer Quellcode; kein Nachweis einer geplanten V26-Funktion'});count++;
 }
 routes.push({route,file,surface,type,actions:count,owners:graph.map(x=>x.key),status:'Statische Inventur; Rollenansichten nicht als geprüft deklarieren'});
}
fs.writeFileSync(out+'/routes.json',JSON.stringify(routes,null,2)+'\n');
const columns=Object.keys(actions[0]??{}),quote=value=>'"'+String(value??'').replaceAll('"','""')+'"';
fs.writeFileSync(out+'/actions.csv','\uFEFF'+[columns.map(quote).join(';'),...actions.map(row=>columns.map(key=>quote(row[key])).join(';'))].join('\n')+'\n');
fs.writeFileSync(out+'/README.md',`# Global Action System V3 – Quellinventur\n\n${routes.length} Routen, ${actions.length} Aktionsvorkommen inklusive gemeinsam erreichbarer Owner. Erzeugt aus dem aktuellen Code, ohne geplante Funktionen aus Konzeptpapieren zu erfinden.\n\nDie Matrix enthält Quellbeleg, Auslöser, Handler/Ziel, vorgeschlagenen Aktionsort und vorhandene Bedingungsausdrücke. Bedingungen sind Owner-Kontext, kein Beweis der individuellen serverseitigen Freigabe. Dynamische Props, konkrete Rollen/Tarife/Status und verschachtelte Entitäten müssen einzeln geprüft werden; unbekannte Werte bleiben ausdrücklich offen. Das Inventar ist vollständig über gefundene Seiten und statisch erreichbare Owner, keine vollständige fachliche oder visuelle Abnahme. Öffentliche Routen sind zur Abgrenzung enthalten.\n\nV26: Nur tatsächlich vorhandener Code ist aufgeführt. Geplante V26-Funktionen werden nicht als implementiert gewertet.\n`);
console.log(JSON.stringify({routes:routes.length,actionOccurrences:actions.length,out}));
