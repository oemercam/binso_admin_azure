import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {inventory} from './ux-inventory.mjs';

/** Catalogue availability is evidence of stored copy, never linguistic/legal approval. */
export function translationCoverage(catalogues){
 const indexes={en:0,fr:1,it:2,tr:3};
 return Object.fromEntries(['de','fr','it','en','tr'].map(locale=>{
  const missing=[];let total=0;
  for(const [catalogue,entries] of Object.entries(catalogues))for(const [key,values] of Object.entries(entries)){
   total++;
   const value=locale==='de'?key:Array.isArray(values)?values[indexes[locale]]:values[locale];
   if(typeof value==='string'?value.trim().length===0:!value||typeof value.one!=='string'||typeof value.other!=='string')missing.push({catalogue,key});
  }
  return [locale,{total,available:total-missing.length,missing:missing.length,complete:missing.length===0,linguisticallyApproved:false,missingEntries:missing}];
 }));
}

export function auditReport(){
 const catalog=inventory(),catalogues=Object.fromEntries(['messages','templates','periods','plurals'].map(name=>[name,JSON.parse(fs.readFileSync('lib/locales/'+name+'.json','utf8'))]));
 return {
  scope:'Code-derived inventory. Static presence is not rendered, functional, device, provider or security acceptance.',
  sourceRoutes:catalog.routes.length,apiRoutes:catalog.apiRoutes.length,components:catalog.componentCatalog.length,
  routes:catalog.routes.map(route=>({route:route.route,file:route.file,family:route.family,primaryComponent:route.pageComponents[0]??null,status:'Static inventory; rendered coverage is recorded in the audit report.',permission:route.permission})),
  operatorVariants:catalog.operatorVariants,
  apis:catalog.apiRoutes.map(route=>{
   const source=fs.readFileSync(route.file,'utf8');
   return {route:route.route,file:route.file,methods:route.methods,sourceIndicators:['requireSession','getSession','requireOperator','authorize','assertSameOrigin','withTenant','withPlatform','enforceRateLimit'].filter(name=>source.includes(name)),status:'Call indicators only; delegated guards and runtime denials require actual tests.'};
  }),
  translations:translationCoverage(catalogues),
 };
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
 const destination=process.argv[2]??'docs/architecture/full-app-audit-20261025';fs.mkdirSync(destination,{recursive:true});
 const report=auditReport();fs.writeFileSync(path.join(destination,'inventory.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({routes:report.sourceRoutes,apis:report.apiRoutes,components:report.components,operatorVariants:report.operatorVariants.length,translations:Object.fromEntries(Object.entries(report.translations).map(([locale,value])=>[locale,{available:value.available,total:value.total,missing:value.missing,complete:value.complete}]))}));
}
