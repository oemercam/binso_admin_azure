import fs from 'node:fs/promises';
import path from 'node:path';
const read=async name=>JSON.parse(await fs.readFile('lib/locales/'+name+'.json','utf8'));
const [messages,periods,plurals,templates]=await Promise.all(['messages','periods','plurals','templates'].map(read));
const languages=['de','fr','it','en','tr'],indices={en:0,fr:1,it:2,tr:3};
await fs.mkdir('lib/locales/generated',{recursive:true});
for(const locale of languages){
 const selected={messages:locale==='de'?{}:Object.fromEntries(Object.entries(messages).map(([key,values])=>[key,values[indices[locale]]])),periods:Object.fromEntries(Object.entries(periods).filter(([,values])=>values[locale]).map(([key,values])=>[key,values[locale]])),plurals:Object.fromEntries(Object.entries(plurals).filter(([,values])=>values[locale]).map(([key,values])=>[key,values[locale]])),templates:locale==='de'?{}:Object.fromEntries(Object.entries(templates).map(([key,values])=>[key,values[indices[locale]]]))};
 const content=JSON.stringify(selected)+'\n',file=path.join('lib/locales/generated',locale+'.json');
 if(process.argv.includes('--check')){if(await fs.readFile(file,'utf8').catch(()=>null)!==content)throw Error('Locale catalogue is stale: '+file+'; run node scripts/generate-locale-catalogues.mjs');}
 else await fs.writeFile(file,content);
}
console.log('Five selected-language catalogues '+(process.argv.includes('--check')?'verified.':'generated from canonical translations.'));
