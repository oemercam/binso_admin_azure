import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs';

export const fullRoutes=['/','/dashboard','/portal','/login','/registrieren','/preise','/produkt','/demo','/operator/login','/operator','/operator/kunden','/operator/tickets','/operator/monitoring','/operator/zahlungen','/operator/sicherheit','/operator/audit','/kunden','/produkte','/mitarbeiter','/spesen','/zahlungen','/angebote','/rechnungen','/finanzen','/finanzen/analyse','/support','/zeit','/einstellungen','/einstellungen/darstellung','/kunden/customer-one','/produkte/product-one','/mitarbeiter/employee-one','/spesen/expense-one','/zahlungen/payment-one','/rechnungen/RE-TEST-1','/angebote/AN-TEST-1','/support/ticket-one','/produkte/neu','/mitarbeiter/neu','/spesen/neu','/projekte/neu','/kunden/neu','/rechnungen/neu','/angebote/neu','/zahlungen/neu','/support/neu','/benachrichtigungen','/kunden/customer-one/bearbeiten','/einstellungen/konto','/einstellungen/firma','/einstellungen/dokumente','/einstellungen/team','/einstellungen/abonnement','/einstellungen/benachrichtigungen','/einstellungen/sprache','/einstellungen/sicherheit','/einstellungen/datenschutz','/einstellungen/zeiterfassung'];
// Include every page file, redirect, read-only preview and operator section.
fullRoutes.push('/bericht','/angebot','/berichte','/projekte','/projekte/project-one','/wartung','/operator/wallboard','/dev/ux-lab','/offline','/agb','/datenschutz','/impressum','/auftragsbearbeitung','/unterauftragsbearbeiter','/passwort-vergessen','/passwort-zuruecksetzen','/email-bestaetigen','/einladung','/willkommen','/belege','/portal/login','/portal/registrieren','/preview/zeit','/preview/dashboard','/preview/rechnungen','/operator/finanzen','/operator/abonnemente','/operator/sperrungen','/operator/ankuendigungen');
fullRoutes.push('/lieferanten','/lieferanten/neu','/lieferanten/supplier-one');
fullRoutes.push('/abwesenheiten','/einstellungen/abwesenheiten');
fullRoutes.push('/vertraege','/vertraege/contract-one');
const appLegalRoutes=['/einstellungen/rechtliches',...['impressum','datenschutz','agb','auftragsbearbeitung','unterauftragsbearbeiter'].map(document=>'/einstellungen/rechtliches/'+document)];
fullRoutes.push(...appLegalRoutes);
export const webkitFullRoutes=['/bericht','/angebot','/berichte','/projekte','/projekte/project-one','/dashboard','/finanzen','/support/ticket-one','/rechnungen','/zeit','/mitarbeiter/neu','/mitarbeiter/employee-one','/projekte/neu','/rechnungen/RE-TEST-1','/kunden/neu','/produkte/neu','/spesen/neu','/angebote/neu','/zahlungen/neu'];
webkitFullRoutes.push('/lieferanten/neu','/lieferanten/supplier-one');
webkitFullRoutes.push('/abwesenheiten','/einstellungen/abwesenheiten');
webkitFullRoutes.push('/vertraege','/vertraege/contract-one');
webkitFullRoutes.push(...appLegalRoutes);
const groups={
 contracts:{match:/commercial-contract|contract-document|vertraege|app\/api\/contracts/,routes:['/vertraege','/vertraege/contract-one'],interactions:[]},
 absences:{match:/absence|abwesenheit/,routes:['/abwesenheiten','/einstellungen/abwesenheiten'],interactions:[]},
 suppliers:{match:/supplier|lieferant/,routes:['/lieferanten','/lieferanten/neu','/lieferanten/supplier-one'],interactions:[]},
 products:{match:/product|produkt/,routes:['/produkte','/produkte/product-one','/produkte/neu'],interactions:['products']},
 customers:{match:/customer|kunden|contact/,routes:['/kunden','/kunden/customer-one','/kunden/neu'],interactions:['customers']},
 employees:{match:/employee|employment|mitarbeiter|personal/,routes:['/mitarbeiter','/mitarbeiter/employee-one','/mitarbeiter/neu'],interactions:['employees']},
 documents:{match:/document|invoice|quote|pdf|qr-bill|rechnungen|angebote/,routes:['/rechnungen','/rechnungen/RE-TEST-1','/rechnungen/neu','/angebote','/angebote/AN-TEST-1','/angebote/neu'],interactions:['documents']},
 payments:{match:/payment|zahlungen/,routes:['/zahlungen','/zahlungen/payment-one','/zahlungen/neu'],interactions:['data']},
 finance:{match:/finance|finanzen|dashboard|revenue/,routes:['/dashboard','/finanzen','/finanzen/analyse'],interactions:['finance']},
 reports:{match:/report|berichte|bericht/,routes:['/berichte','/bericht'],interactions:[]},
 time:{match:/time|timer|zeit|project|projekte|auftraege/,routes:['/zeit','/projekte/neu','/einstellungen/zeiterfassung'],interactions:['time']},
 expenses:{match:/expense|spesen/,routes:['/spesen','/spesen/expense-one','/spesen/neu'],interactions:['expenses']},
 chat:{match:/support|chat|ticket|workspace-viewport/,routes:['/support','/support/ticket-one','/support/neu'],interactions:['chat']},
 settings:{match:/setting|einstellungen/,routes:['/einstellungen','/einstellungen/darstellung','/benachrichtigungen','/einstellungen/abonnement'],interactions:['billing','settings']},
 operator:{match:/operator/,routes:fullRoutes.filter(r=>r.startsWith('/operator')),interactions:['operator']},
 public:{match:/marketing|landing|portal|login|registr|preis|produkt\/|demo|onboarding|manifest|service-worker|public(?:\/|-report)/,routes:['/','/portal','/login','/registrieren','/preise','/produkt','/demo','/angebot','/bericht'],interactions:[]},
};
const representative=['/dashboard','/finanzen','/kunden','/kunden/customer-one','/kunden/neu','/produkte','/produkte/product-one','/produkte/neu','/rechnungen','/rechnungen/RE-TEST-1','/rechnungen/neu','/mitarbeiter/employee-one','/mitarbeiter/neu','/zeit','/projekte/neu','/spesen/neu','/support/ticket-one','/einstellungen','/operator','/operator/kunden','/login'];
const allInteractions=['data','customers','products','employees','documents','finance','time','expenses','chat','billing','header','operator','settings','chrome'];
// Only prose with canonical repository paths can omit rendered evidence. Binding
// UX references, executable/configuration evidence and unknown/empty diffs cannot.
export function isDocumentationOnlyChange(files){
 return Array.isArray(files)&&files.length>0&&files.every(p=>typeof p==='string'&&
  !/[\\\r\n]/.test(p)&&!p.split('/').some(part=>!part||part==='.'||part==='..')&&
  !/^(docs\/audit\/v24\/reference\/|docs\/architecture\/reference-foundation\.md$)/.test(p)&&
  /^(README\.md|AGENTS\.md|docs\/.+\.(md|txt))$/.test(p));
}
export function planChanges(files,{level='standard'}={}){
 if(!['fast','integration','standard','full'].includes(level))throw new Error('Unknown QA level: '+level);
 const paths=[...new Set(files)].sort();
 const documentationOnly=isDocumentationOnlyChange(paths);
 const isGlobal=p=>/^(app\/design-system\/|app\/(binso-ui\.css|layout\.tsx)|components\/(pages\/shared|app-pages|app-shell|app-chrome|header-panel(?:-content)?|avatar|form-wizard|ui|binso-ux|records|use-dialog-focus|use-browser-back-guard|use-dirty-snapshot)|lib\/client\/|lib\/permissions|lib\/routes|next\.config)/.test(p);
 const global=paths.some(isGlobal);
 // Unknown dependencies, auth, schema and CI changes fail open to broader TEST COVERAGE, never to success.
 const isInfrastructure=p=>/^(\.github\/|package\.json|pnpm-|database\/|lib\/server\/auth|app\/api\/auth|scripts\/)/.test(p);
 const infrastructure=paths.some(isInfrastructure);
 const matched=documentationOnly?[]:Object.values(groups).filter(g=>paths.some(p=>g.match.test(p)));
 const unknown=!paths.length||paths.some(p=>!isDocumentationOnlyChange([p])&&(/^(docs\/|README|AGENTS\.md)/.test(p)||!isGlobal(p)&&!isInfrastructure(p)&&!Object.values(groups).some(g=>g.match.test(p))));
 const full=level==='full'||level==='standard'&&(global||infrastructure||unknown);
 const broad=global||unknown||infrastructure;
 const modulePaths=paths.filter(p=>p.startsWith('components/pages/')&&!p.endsWith('/shared.tsx'));
 let dependencyRoutes=[];try{const catalog=JSON.parse(fs.readFileSync('docs/architecture/ux-inventory.json','utf8'));dependencyRoutes=catalog.routes.filter(r=>modulePaths.some(p=>r.components.some(c=>c.startsWith(p+'#')))).map(r=>r.route).filter(r=>!r.startsWith('/preview')&&!r.startsWith('/operator')).map(r=>r.replace('[id]',r.startsWith('/kunden')?'customer-one':r.startsWith('/produkte')?'product-one':r.startsWith('/mitarbeiter')?'employee-one':r.startsWith('/lieferanten')?'supplier-one':r.startsWith('/spesen')?'expense-one':r.startsWith('/zahlungen')?'payment-one':r.startsWith('/support')?'ticket-one':r.startsWith('/rechnungen')?'RE-TEST-1':'AN-TEST-1'));}catch{}
 const routes=full?fullRoutes:broad?representative:modulePaths.length&&dependencyRoutes.length?[...new Set([...dependencyRoutes,...matched.flatMap(g=>g.routes).filter(r=>r.startsWith('/einstellungen/zeiterfassung'))])]:[...new Set(matched.flatMap(g=>g.routes))];
 const suites=new Set();
 if(paths.some(p=>/employee|employment|wage-definition|absence|abwesenheit|commercial-contract|contract-condition|app\/api\/contracts|mitarbeiter|supplier|lieferanten|expense|spesen|workforce|external-resource|sensitive-access|invitation|team-settings|lib\/server\/(database|repositories\/business-api)\.ts/.test(p)))suites.add('employee-dossier-test');
 if(global||paths.some(p=>/customer|kunden|business-api|financial/.test(p)))suites.add('customer-financial-projection-test');
 if(global||infrastructure){suites.add('ux-contract-check');suites.add('foundation-integration-test');}
 if(paths.some(p=>/process-draft/.test(p)))suites.add('process-draft-test');
 if(global||matched.some(g=>g!==groups.public&&g!==groups.operator&&g!==groups.settings))suites.add('ux-regression-test');
 if(global){suites.add('theme-selfcheck');suites.add('creation-chrome-test');suites.add('app-workspace-test');suites.add('task-focused-ux-test');suites.add('ui-build-cache-test');}
 if(paths.some(p=>/^(components\/(ui|binso-ux|form-wizard|ux-lab)|scripts\/(eslint\/central-ui|ui-foundation-test))/.test(p)))suites.add('ui-foundation-test');
 if(paths.some(p=>/^lib\/(client\/|money\.|financial-status\.|finance-periods\.)|^scripts\/data-foundation-test/.test(p)))suites.add('data-foundation-test');
 if(paths.some(p=>/^components\/(app-shell|operator|ui)\.|^app\/design-system\/|^scripts\/navigation-foundation-test/.test(p)))suites.add('navigation-foundation-test');
 if(paths.some(p=>/css|styles/.test(p)))suites.add('check-css-architecture');
 if(global||paths.some(p=>/presentation-(cascade|consistency)|css-contract/.test(p)))suites.add('presentation-consistency-test');
 if(paths.some(p=>/document|invoice|qr|pdf/.test(p))){suites.add('document-presentation-test');suites.add('pwa-preview-test');}
 if(paths.some(p=>/session|auth/.test(p))){suites.add('client-session-test');suites.add('auth-integrity-test');}
 if(paths.some(p=>/file-scan|app\/api\/files\/|app\/api\/settings\/company/.test(p))){suites.add('file-scan-test');suites.add('auth-integrity-test');}
 if(paths.some(p=>/http|logger|email|public\/sw/.test(p)))suites.add('runtime-integrity-test');
 if(paths.some(p=>/ux-compliance|scripts\/compliance/.test(p))){suites.add('compliance/selftest');suites.add('compliance/report-test');}
 if(paths.some(p=>/permission|role|page-access/.test(p)))suites.add('permission-selfcheck');
 if(paths.some(p=>/database|server\/repositories|app\/api/.test(p)))suites.add('migration-test');
 // Service-owner-only edits must retain their actual DB/code/PDF security
 // contracts, even when no route file happens to be touched in the same task.
 if(paths.some(p=>/^lib\/server\/(public-reports|report-(exports|mail|document)|plan-access|document-amount-sql)\./.test(p)))suites.add('migration-test');
 if(paths.some(p=>/^lib\/server\/(public-reports|report-mail)\./.test(p))){suites.add('mail-message-test');suites.add('web-vitals-consent-test');}
 if(infrastructure||unknown)suites.add('qa-plan-test');
 return {level:full?'full':level,files:paths,global,reason:full?'Release/CI/auth/schema or unknown dependency: full coverage':broad?'Shared/unknown dependency: representative cross-module coverage':'Changed modules only',routes,webkitRoutes:full?webkitFullRoutes:routes,interactions:full||broad?allInteractions:[...new Set(matched.flatMap(g=>g.interactions))],suites:[...suites],widths:full?[320,375,390,430,600,760,761,768,820,1024,1440,1920,2560,3840]:level==='fast'?[390]:[390,768,1440],webkitWidths:full?[320,375,390,430,600,760,761,768,820,1024,1440,1920,2560,3840]:[390,768],themes:level==='fast'?['light']:['light','dark']};
}
export function shouldRunBrowser(level,args=[]){
 return !args.includes('--no-browser') && (args.includes('--browser') || !['fast','integration'].includes(level));
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
 if(process.env.GITHUB_OUTPUT){const entries={level:plan.level,changed_files:JSON.stringify(plan.files),routes:plan.routes.join(','),webkit_routes:plan.webkitRoutes.join(','),widths:plan.widths.join(','),webkit_widths:plan.webkitWidths.join(','),interactions:plan.interactions.join(','),browser:plan.routes.length?'true':'false'};fs.appendFileSync(process.env.GITHUB_OUTPUT,Object.entries(entries).map(([k,v])=>`${k}=${v}\n`).join(''));}
}
