import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs';

export const fullRoutes=['/','/dashboard','/portal','/login','/registrieren','/preise','/produkt','/demo','/operator/login','/operator','/operator/kunden','/operator/tickets','/operator/monitoring','/operator/zahlungen','/operator/sicherheit','/operator/audit','/kunden','/produkte','/mitarbeiter','/spesen','/zahlungen','/angebote','/rechnungen','/finanzen','/finanzen/analyse','/support','/zeit','/einstellungen','/einstellungen/darstellung','/kunden/customer-one','/produkte/product-one','/mitarbeiter/employee-one','/spesen/expense-one','/zahlungen/payment-one','/rechnungen/RE-TEST-1','/angebote/AN-TEST-1','/support/ticket-one','/produkte/neu','/mitarbeiter/neu','/spesen/neu','/projekte/neu','/kunden/neu','/rechnungen/neu','/angebote/neu','/zahlungen/neu','/support/neu','/benachrichtigungen','/kunden/customer-one/bearbeiten','/einstellungen/konto','/einstellungen/firma','/einstellungen/dokumente','/einstellungen/team','/einstellungen/abonnement','/einstellungen/benachrichtigungen','/einstellungen/sprache','/einstellungen/sicherheit','/einstellungen/datenschutz'];
export const webkitFullRoutes=['/dashboard','/finanzen','/support/ticket-one','/rechnungen','/zeit','/mitarbeiter/neu','/mitarbeiter/employee-one','/projekte/neu','/rechnungen/RE-TEST-1','/kunden/neu','/produkte/neu','/spesen/neu','/angebote/neu','/zahlungen/neu'];
const groups={
 products:{match:/product|produkt/,routes:['/produkte','/produkte/product-one','/produkte/neu'],interactions:['products']},
 customers:{match:/customer|kunden|contact/,routes:['/kunden','/kunden/customer-one','/kunden/neu'],interactions:['customers']},
 employees:{match:/employee|mitarbeiter|personal/,routes:['/mitarbeiter','/mitarbeiter/employee-one','/mitarbeiter/neu'],interactions:['employees']},
 documents:{match:/document|invoice|quote|pdf|qr-bill|rechnungen|angebote/,routes:['/rechnungen','/rechnungen/RE-TEST-1','/rechnungen/neu','/angebote','/angebote/AN-TEST-1','/angebote/neu'],interactions:['documents']},
 payments:{match:/payment|zahlungen/,routes:['/zahlungen','/zahlungen/payment-one','/zahlungen/neu'],interactions:[]},
 finance:{match:/finance|finanzen|dashboard|revenue/,routes:['/dashboard','/finanzen','/finanzen/analyse'],interactions:['finance']},
 time:{match:/time|timer|zeit|project|projekte|auftraege/,routes:['/zeit','/projekte/neu'],interactions:['time']},
 expenses:{match:/expense|spesen/,routes:['/spesen','/spesen/expense-one','/spesen/neu'],interactions:['expenses']},
 chat:{match:/support|chat|ticket|workspace-viewport/,routes:['/support','/support/ticket-one','/support/neu'],interactions:['chat']},
 settings:{match:/setting|einstellungen/,routes:['/einstellungen','/einstellungen/darstellung','/benachrichtigungen'],interactions:[]},
 operator:{match:/operator/,routes:fullRoutes.filter(r=>r.startsWith('/operator')),interactions:[]},
 public:{match:/marketing|landing|portal|login|registr|preis|produkt\/|demo|onboarding|manifest|service-worker|public\//,routes:['/','/portal','/login','/registrieren','/preise','/produkt','/demo'],interactions:[]},
};
const representative=['/dashboard','/finanzen','/kunden','/kunden/customer-one','/kunden/neu','/produkte','/produkte/product-one','/produkte/neu','/rechnungen','/rechnungen/RE-TEST-1','/rechnungen/neu','/mitarbeiter/employee-one','/mitarbeiter/neu','/zeit','/projekte/neu','/spesen/neu','/support/ticket-one','/einstellungen','/operator','/operator/kunden','/login'];
const allInteractions=['customers','products','employees','documents','finance','time','expenses','chat'];
export function planChanges(files,{level='standard'}={}){
 if(!['fast','standard','full'].includes(level))throw new Error('Unknown QA level: '+level);
 const paths=[...new Set(files)].sort();
 const isGlobal=p=>/^(app\/styles\/|app\/(binso-ui\.css|layout\.tsx)|components\/(app-pages|app-shell|ui|binso-ux|records|use-dialog-focus)|lib\/client\/|lib\/permissions|lib\/routes|next\.config)/.test(p);
 const global=paths.some(isGlobal);
 // Unknown dependencies, auth, schema and CI changes fail open to broader TEST COVERAGE, never to success.
 const isInfrastructure=p=>/^(\.github\/|package\.json|pnpm-|database\/|lib\/server\/auth|app\/api\/auth|scripts\/)/.test(p);
 const infrastructure=paths.some(isInfrastructure);
 const matched=Object.values(groups).filter(g=>paths.some(p=>g.match.test(p)));
 const unknown=paths.some(p=>!/^(docs\/|README|\.gitignore|AGENTS\.md)/.test(p)&&!isGlobal(p)&&!isInfrastructure(p)&&!Object.values(groups).some(g=>g.match.test(p)));
 const full=level==='full'||level!=='fast'&&(infrastructure||unknown);
 const broad=global||unknown||infrastructure;
 const routes=full?fullRoutes:broad?representative:[...new Set(matched.flatMap(g=>g.routes))];
 const suites=new Set();
 if(global){suites.add('ux-regression-test');suites.add('theme-selfcheck');}
 if(paths.some(p=>/css|styles/.test(p)))suites.add('check-css-architecture');
 if(paths.some(p=>/document|invoice|qr|pdf/.test(p))){suites.add('document-presentation-test');suites.add('pwa-preview-test');}
 if(paths.some(p=>/session|auth/.test(p)))suites.add('client-session-test');
 if(paths.some(p=>/permission|role|page-access/.test(p)))suites.add('permission-selfcheck');
 if(paths.some(p=>/database|server\/repositories|app\/api/.test(p)))suites.add('migration-test');
 if(infrastructure||unknown)suites.add('qa-plan-test');
 return {level:full?'full':level,files:paths,global,reason:full?'Release/CI/auth/schema or unknown dependency: full coverage':broad?'Shared/unknown dependency: representative cross-module coverage':'Changed modules only',routes,webkitRoutes:full?webkitFullRoutes:routes,interactions:full||broad?allInteractions:[...new Set(matched.flatMap(g=>g.interactions))],suites:[...suites],widths:full?[375,430,820,1024,1440]:level==='fast'?[375,1440]:[375,820,1440],webkitWidths:full?[375,430,820]:[375,820],themes:level==='fast'?['light']:['light','dark']};
}
export function changedFiles(base){
 const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).split('\0').filter(Boolean);
 const committed=base?git('diff','--name-only','-z',base+'...HEAD'):[];
 return [...new Set([...committed,...git('diff','--name-only','-z','HEAD'),...git('ls-files','--others','--exclude-standard','-z')])];
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const arg=name=>{const i=process.argv.indexOf(name);return i<0?undefined:process.argv[i+1]};
 const plan=planChanges(arg('--files')?.split(',')??changedFiles(arg('--base')),{level:arg('--level')??'standard'});
 console.log(JSON.stringify(plan,null,2));
 if(process.env.GITHUB_OUTPUT){const entries={level:plan.level,routes:plan.routes.join(','),webkit_routes:plan.webkitRoutes.join(','),widths:plan.widths.join(','),webkit_widths:plan.webkitWidths.join(','),interactions:plan.interactions.join(','),browser:plan.routes.length?'true':'false'};fs.appendFileSync(process.env.GITHUB_OUTPUT,Object.entries(entries).map(([k,v])=>`${k}=${v}\n`).join(''));}
}
