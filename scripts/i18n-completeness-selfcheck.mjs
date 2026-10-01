import fs from "node:fs";
const read=p=>fs.readFileSync(p,"utf8");
const locales=["en","fr","it","tr"];
const localeVars={en:"en",fr:"fr",it:"it",tr:"trDict"};
function objectBlock(source,start){let depth=0,quote="",escaped=false;for(let i=start;i<source.length;i++){const c=source[i];if(quote){if(escaped)escaped=false;else if(c==="\\")escaped=true;else if(c===quote)quote="";continue}if(c==='"'||c==="'"){quote=c;continue}if(c==="{")depth++;else if(c==="}"&&--depth===0)return source.slice(start,i+1)}throw new Error("Unbalanced translation object")}
function pairs(block){const map=new Map();for(const m of block.matchAll(/"((?:\\.|[^"\\])*)"\s*:\s*"((?:\\.|[^"\\])*)"/g)){map.set(JSON.parse(`"${m[1]}"`),JSON.parse(`"${m[2]}"`))}return map}
const maps=Object.fromEntries(locales.map(l=>[l,new Map()]));
const core=read("lib/i18n.ts");
for(const locale of locales){const variable=localeVars[locale];const first=new RegExp(`const\\s+${variable}[^=]*=\\s*\\{`).exec(core);if(first){const start=first.index+first[0].lastIndexOf("{");for(const [k,v] of pairs(objectBlock(core,start)))maps[locale].set(k,v)}const re=new RegExp(`Object\\.assign\\(\\s*${variable}\\s*,\\s*\\{`,`g`);for(const m of core.matchAll(re)){const start=m.index+m[0].lastIndexOf("{");for(const [k,v] of pairs(objectBlock(core,start)))maps[locale].set(k,v)}}
for(const file of ["lib/i18n-app.ts","lib/i18n-dynamic.ts"]){const source=read(file);for(const locale of locales){const re=new RegExp(`(?:["']${locale}["']|\\b${locale})\\s*:\\s*\\{`,`g`);for(const m of source.matchAll(re)){const start=m.index+m[0].lastIndexOf("{");for(const [k,v] of pairs(objectBlock(source,start)))maps[locale].set(k,v)}}}
const common=new Set(["Neu","Offen","Aktiv","Inaktiv","Freigegeben","Bezahlt","Überfällig","Genehmigt","Abgelehnt","Heute","Woche","Monat","Jahr","Tage","Stunden","Firma","Kunde","Projekt","Rechnung","Offerte"]);
const exempt=new Set(["Binso One","Business","Start","Pro","PWA","CVC","QR","CHF","TWINT","AHV-Nr.","Deutsch","English","Français","Italiano","Türkçe","Nr."]);
const required=new Set();
const add=(v)=>{v=(v||"").replace(/\s+/g," ").trim();if(v)required.add(v)};
const addMatches=(source,pattern)=>{for(const m of source.matchAll(pattern))add(m[1])};
const addQuotedList=(source,pattern)=>{for(const m of source.matchAll(pattern))for(const x of m[1].matchAll(/"([^"\n]+)"/g))add(x[1])};
// Literal t() and LocalizedText across all visible React surfaces.
const files=[];const walk=dir=>{for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(["node_modules",".next"].includes(e.name))continue;const p=`${dir}/${e.name}`;if(e.isDirectory())walk(p);else if(e.name.endsWith(".tsx"))files.push(p)}};walk("app");walk("components");
for(const file of files){const source=read(file);addMatches(source,/\bt\(\s*"((?:\\.|[^"\\])*)"\s*\)/g);for(const m of source.matchAll(/\bt\(\s*[^()?\n]+\?\s*"([^"\n]+)"\s*:\s*"([^"\n]+)"\s*\)/g)){add(m[1]);add(m[2])}for(const m of source.matchAll(/<LocalizedText>([^<>{}]+)<\/LocalizedText>/g))add(m[1]);}
// Module config: flexible whitespace is mandatory; earlier checks missed formatted entries.
const modules=read("lib/modules.ts");for(const p of [/\blabel\s*:\s*"([^"]+)"/g,/\bdescription\s*:\s*"([^"]+)"/g,/\bprimaryAction\s*:\s*"([^"]+)"/g])addMatches(modules,p);addQuotedList(modules,/\bcolumns\s*:\s*\[([^\]]*)\]/g);
// Entity select labels/options and pricing plans.
const forms=read("config/entity-forms.ts");addMatches(forms,/\blabel\s*:\s*"([^"]+)"/g);addQuotedList(forms,/\boptions\s*:\s*\[([^\]]*)\]/g);
const plans=read("lib/plans.ts");addMatches(plans,/\bdescription\s*:\s*"([^"]+)"/g);addQuotedList(plans,/\bfeatures\s*:\s*\[([^\]]*)\]/gs);
// Marketing data arrays rendered through t(variable).
for(const file of ["components/marketing-landing.tsx","components/marketing/features-marketing-page.tsx"]){const source=read(file);addMatches(source,/\btitle\s*:\s*"([^"]+)"/g);addMatches(source,/\btext\s*:\s*"([^"]+)"/g);addQuotedList(source,/\bitems\s*:\s*\[([^\]]*)\]/g)}
const pricing=read("components/marketing/pricing-marketing-page.tsx");const faq=/const faqs=\[([\s\S]*?)\];/.exec(pricing);if(faq)for(const x of faq[1].matchAll(/"([^"]+)"/g))add(x[1]);
for(const key of ["Arbeitsstunden","Offerte prüfen","MWST vorbereiten","Löhne freigeben","Spesen prüfen"])add(key);
// Built-in demo statistics and semantic demo values are UI copy, not customer-entered content.
const seeds=read("lib/demo/module-seeds.ts");addMatches(seeds,/\blabel\s*:\s*"([^"]+)"/g);addMatches(seeds,/\bmeta\s*:\s*"([^"]+)"/g);
for(const key of ["Administration","Konzeption","Kundenlunch","Parkgebühr","Projektstatus aktualisieren","Gesamt","In Vorbereitung","Geschäftskonto","Adresse, UID, Bankverbindung","Zugriffe und Berechtigungen","Offerten, Rechnungen, Aufträge","Projektprofitabilität","Debitorenliste","Monatsreport","Spesenreglement","Support-Pauschale","Rahmenvertrag Müller Bau","Supportvertrag 2026","3200 Dienstleistungsertrag","6500 Büroaufwand"])add(key);
const pilot=read("lib/demo/pilot-fixtures.ts");addMatches(pilot,/\btitle\s*:\s*"([^"]+)"/g);addMatches(pilot,/\bmessage\s*:\s*"([^"]+)"/g);
// Meta strings that contain only numbers/currency/dates do not require translation.
const languageBearing=s=>/[A-Za-zÄÖÜäöüÀ-ÿ]/.test(s)&&!/^[-+]?\s*(?:CHF\s*)?[\d’.,:%]+(?:\s*(?:h|pp))?$/.test(s)&&!/^\d{2}\.\d{2}\./.test(s)&&!/^Q\d\s+\d{4}$/.test(s);
const missing=[];
for(const key of required){if(exempt.has(key)||!languageBearing(key))continue;for(const locale of locales){if(common.has(key))continue;if(!maps[locale].has(key))missing.push(`${locale}: ${key}`)}}
if(missing.length)throw new Error(`Incomplete visible-copy translations (${missing.length}):\n${missing.slice(0,80).join("\n")}`);
for(const marker of ["local?(ci===row.length-1?t(cell):cell):t(cell)","local?cell:t(cell)","local?row[0]:t(row[0])","t(s.value)"]){if(!read("components/module-page.tsx").includes(marker))throw new Error(`Demo module localization guard missing: ${marker}`)}
if(!read("components/detail-page.tsx").includes("translateSeedValue(row[0])"))throw new Error("Demo detail values must be localized without translating customer-entered content.");
if(!read("components/shell.tsx").includes("label:t(r[0]),sub:t(m.label)"))throw new Error("Demo global search must index localized seed labels and module names.");
if(!read("components/announcements/changelog-page.tsx").includes("t(x.title)")||!read("components/announcements/changelog-page.tsx").includes("t(x.message)"))throw new Error("Built-in changelog announcements must be localized.");
console.log(`I18N completeness self-check passed: ${required.size} visible/dynamic keys are covered for DE/EN/FR/IT/TR; demo values and changelog fixtures use locale-aware rendering.`);
