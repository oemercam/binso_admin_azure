import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {inventory} from './ux-inventory.mjs';
const catalog=inventory(),commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
// Regeneration updates the graph, never erases manually recorded review evidence.
const previous=fs.existsSync('docs/audit/v24/page-matrix.json')?JSON.parse(fs.readFileSync('docs/audit/v24/page-matrix.json','utf8')):null;
const pages=catalog.routes.map(r=>({file:r.file,route:r.route,family:r.family,components:r.pageComponents,layouts:r.layouts,roles:r.permission,actions:r.widgets.filter(w=>/Sheet|Dialog|Menu|Wizard|Search|Filter/.test(w.tag)),dimensions:{widths:[320,360,390,430,768,1280,1920],themes:['light','dark'],states:['loading','empty','error','forbidden','long-text'],languages:['de-CH','fr-CH','it-CH','en'],devices:['browser emulation','physical iOS PWA','physical Android PWA']},status:'nicht geprüft',evidence:[],cause:'Keine visuelle Ursache nachgewiesen; statischer Komponentengraph siehe Komponenten.',correction:'Laufzeitprüfung gegen freigegebene Referenzen erforderlich'}));
for(const page of pages){const old=previous?.pages.find(p=>p.file===page.file);if(old)for(const field of ['status','evidence','cause','correction'])if(old[field]!==undefined)page[field]=old[field];}
fs.writeFileSync('docs/audit/v24/page-matrix.json',JSON.stringify({commit,method:'Existing TypeScript AST dependency inventory; conditional reachability is not runtime proof',pages,operatorVariants:catalog.operatorVariants,systemFiles:['app/error.tsx','app/global-error.tsx','app/not-found.tsx'].filter(f=>fs.existsSync(f)).map(file=>previous?.systemFiles?.find(p=>p.file===file)??{file,status:'nicht geprüft'})},null,2)+'\n');
console.log(`${pages.length} pages assigned; ${catalog.operatorVariants.length} operator dispatch variants retained; no runtime acceptance inferred.`);
