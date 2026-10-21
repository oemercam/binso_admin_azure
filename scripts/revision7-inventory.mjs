import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import ts from 'typescript';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),compiled=new Map();
function sourceModule(file){
 file=path.resolve(file);if(compiled.has(file))return compiled.get(file);
 const exports={};compiled.set(file,exports);
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 Function('exports','require',code)(exports,name=>name.startsWith('.')||name.startsWith('@/')?sourceModule((name.startsWith('@/')?name.slice(2):path.resolve(path.dirname(file),name))+'.ts'):require(name));return exports;
}
const permissions=sourceModule('lib/permissions.ts'),orientation=sourceModule('lib/page-orientation.ts');
const root='docs/audit/v25-revision7',source=fs.readFileSync(root+'/source.md','utf8');
const headers=[...source.matchAll(/^## (\d+)\. (.+)$/gm)];
if(headers.length!==56||new Set(headers.map(x=>x[1])).size!==56)throw Error('Expected all 56 chapters');
const refs={1:['components/binso-ux.tsx','app/design-system/manifest.json'],2:['components/use-workspace-viewport.ts','components/binso-ux.tsx'],3:['lib/server/fresh-authentication.ts'],4:['components/pages/customers.tsx'],5:['lib/document-lines.ts'],6:['lib/server/email.ts'],7:['lib/server/public-offers.ts'],8:['lib/server/public-offers.ts'],9:['database/migrations/0068_offer_versions_and_public_responses.sql'],10:['lib/server/email.ts'],11:['components/statistics.tsx'],12:['components/pages/time.tsx'],13:['components/app-shell.tsx'],14:['components/pages/notifications.tsx'],15:['lib/server/rbac.ts'],19:['components/locale-switcher.tsx','app/design-system/theme.css'],20:['components/registration/registration-page.tsx'],28:['lib/permissions.ts'],38:['lib/server/provisioning.ts','app/api/auth/register/route.ts'],39:['lib/server/profile-image.ts','components/file-upload.tsx'],40:['components/use-workspace-viewport.ts'],42:['components/statistics.tsx'],43:['lib/server/document-pdf.ts'],44:['lib/server/document-pdf.ts','components/pdf-preview.tsx'],46:['components/marketing.tsx'],48:['components/auth-workspace.tsx'],49:['lib/locales/index.ts','scripts/localization-coverage-test.mjs'],50:['components/ui.tsx'],51:['components/privacy-consent.tsx'],52:['config/legal.ts'],53:['components/pages/support.tsx','app/api/support/tickets/route.ts'],54:['lib/server/http.ts','components/use-process-draft.ts']};
const requirements=[];
for(let i=0;i<headers.length;i++){
 const match=headers[i],chapter=+match[1],body=source.slice(match.index+match[0].length,headers[i+1]?.index??source.length);let seq=0;
 for(const block of body.split(/\r?\n\s*\r?\n/)){
  const text=block.trim();if(!text||/^---$/.test(text)||/^# REVISION/.test(text))continue;
  for(const clause of text.split(/\r?\n(?=[-*]|\d+\.)/).flatMap(part=>part.split(/(?<=[.!?])\s+(?=[A-ZÄÖÜ*«„])/u))){
   if(/^###/.test(clause))continue;
   const id=`R7-${String(chapter).padStart(2,'0')}-${String(++seq).padStart(3,'0')}`;
   requirements.push({id,chapter,title:match[2],priority:match[2].match(/\[(P[^\]]+)\]/)?.[1]??'P0–P2',requirement:clause.trim(),sourceTextSha256:crypto.createHash('sha256').update(clause.trim()).digest('hex'),sourceParagraph:text,status:'nicht_abgenommen',sourceReferences:(refs[chapter]??[]).filter(x=>fs.existsSync(x)),implementation:'Teilfunktionen vorhanden; Klausel einzeln gegen Code und negative Fälle prüfen.',test:'offen',visualComparison:'offen; frühere PR305-Messung gilt nicht für geänderte Revision7-Screens',blocker:'Keine Gesamtfreigabe aus generiertem Inventar ableiten.'});
  }
 }
}
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(x=>x.isDirectory()?walk(path.join(d,x.name)):[path.join(d,x.name).replaceAll('\\','/')]);
const pages=walk('app').filter(x=>/\/page\.tsx$/.test(x));
const tenant=['owner','admin','finance','hr','project_manager','manager','member','reader'];
const operator=['platform_owner','platform_admin','platform_support','platform_billing','platform_auditor'];
const publics=new Set(['','produkt','preise','login','registrieren','passwort-vergessen','passwort-zuruecksetzen','email-bestaetigen','einladung','impressum','datenschutz','agb','auftragsbearbeitung','unterauftragsbearbeiter','wartung','angebot','offline','operator/login']);
const states=['Erstbesuch','Daten vorhanden','leer','laden','Fehler','offline','kein Zugriff','Sitzung abgelaufen','Tastatur','Zurück/Deep-Link','Speichern/Reload/neue Sitzung'];
const routes=pages.map(file=>{const route='/'+file.replace(/^app\//,'').replace(/\/?page\.tsx$/,'').split('/').filter(x=>!/^\(.*\)$/.test(x)).join('/');const group=route.startsWith('/operator')?'operator':publics.has(route.slice(1))?'public':'tenant';return {route,file,surface:group,roles:group==='operator'?operator:group==='public'?['anonymous','authenticated']:tenant,states,viewports:[320,390,768,1024,1440,1920,2560],themes:['light','dark'],locales:['de-CH','fr-CH','it-CH','en'],status:'nicht_abgenommen',kpiAssessment:'offen; Auth/Profil/Rechtliches benötigen keine dekorativen Charts',dataSource:'API-/RLS-Pfad pro Route verifizieren',tests:[],visualEvidence:[],blocker:'Ausführung und fachlich geprüfter Referenzvergleich fehlen'};});
for(const row of routes){
 if(publics.has(row.route.slice(1))){row.surface='public';row.roles=['anonymous','authenticated'];}
 if(row.route.startsWith('/preview/')||row.route.startsWith('/portal')||row.route==='/demo'){row.surface='legacy_entry';row.roles=['anonymous','authenticated'];}
 if(row.route==='/dev/ux-lab'){row.surface='isolated_qa';row.roles=['anonymous','authenticated'];}
 row.purpose=orientation.pageOrientation(row.route)??(row.route.includes('/neu')?'Fachobjekt im vorhandenen Formular anlegen.':row.route.endsWith('/bearbeiten')?'Berechtigtes Fachobjekt bearbeiten.':row.route.includes('[id]')?'Berechtigtes Fachobjekt und kontextbezogene Aktionen.':row.surface==='public'?'Öffentliche Information oder Identity-Prozess; keine dekorativen Geschäftszahlen.':row.surface==='legacy_entry'?'Historischer Einstieg; Weiterleitung bzw. Sperre prüfen, keine alte Demo reaktivieren.':'Zweck und Inhalte anhand des angegebenen Seiten-Owners prüfen.');
 row.roleExpectations=row.roles.map(role=>({role,purpose:row.surface==='tenant'?orientation.pageOrientation(row.route,false,role)??row.purpose:row.purpose,standard:row.surface==='tenant'?permissions.tenantCanOpenPath(role,row.route)&&(!row.route.endsWith('/neu')||permissions.tenantCanCreateAt(role,row.route))?'role_navigation_allowed':'role_navigation_denied':'surface_guard_to_verify',timeOnly:row.surface==='tenant'?permissions.tenantCanOpenPath(role,row.route,'time_only')?'role_navigation_allowed':'role_navigation_denied':'not_applicable',limitation:'Navigationserwartung aus aktuellem Code, kein Nachweis für API, RLS, Tarif, Assignment oder Zustand.'}));
 row.kpiAssessment=row.surface!=='tenant'||row.route.startsWith('/einstellungen')||row.route.endsWith('/neu')||row.route.endsWith('/bearbeiten')?'Keine dekorativen KPI: Information, Identity, Einstellungen oder fokussierte Eingabe. Fachliche Ausnahmen separat prüfen.':'Moduleigene Zahlen, Zeitraum, Währung/Einheit und berechtigte Datenquelle gegen tatsächliche UI/API prüfen; keine Abnahme aus Bestandsliste.';
}
const evidence=JSON.parse(fs.readFileSync(root+'/evidence.json','utf8'));
for(const row of requirements){const observation=evidence.entries[row.id];if(observation?.sourceTextSha256===row.sourceTextSha256)Object.assign(row,observation);}
const csv=rows=>rows.map(row=>row.map(x=>'"'+String(typeof x==='object'?JSON.stringify(x):x).replaceAll('"','""')+'"').join(',')).join('\n')+'\n';
fs.writeFileSync(root+'/requirements.json',JSON.stringify({sourceSha256:crypto.createHash('sha256').update(fs.readFileSync(root+'/source.md')).digest('hex'),chapters:56,requirements},null,2)+'\n');
fs.writeFileSync(root+'/requirements.csv',csv([['ID','Kapitel','Priorität','Anforderung','Ist/Abnahme','Code','Test','Visuell','Blocker'],...requirements.map(x=>[x.id,x.chapter,x.priority,x.requirement,x.status,x.sourceReferences,x.test,x.visualComparison,x.blocker])]));
fs.writeFileSync(root+'/routes.json',JSON.stringify({routes,components:walk('components').filter(x=>/\.tsx$/.test(x)),apis:walk('app/api').filter(x=>x.endsWith('/route.ts')),migrations:walk('database/migrations').filter(x=>x.endsWith('.sql'))},null,2)+'\n');
fs.writeFileSync(root+'/route-role-states.csv',csv([['Route','Rolle','Zustand','Status','Seitenziel','Rollen-Navigation','Nur-Zeit-Profil','KPI','Datenquelle','Visuell','Blocker'],...routes.flatMap(x=>x.roleExpectations.flatMap(expected=>x.states.map(state=>[x.route,expected.role,state,x.status,expected.purpose,expected.standard,expected.timeOnly,x.kpiAssessment,x.dataSource,'offen',x.blocker+'; '+expected.limitation])))]));
console.log(JSON.stringify({chapters:56,requirements:requirements.length,routes:routes.length,routeRoleStateCases:routes.reduce((n,x)=>n+x.roles.length*x.states.length,0)}));
