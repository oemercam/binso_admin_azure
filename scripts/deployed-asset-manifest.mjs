import fs from 'node:fs';
import path from 'node:path';
export const stylesheetLinks=html=>[...new Set([...html.matchAll(/<link\b[^>]*>/gi)].map(match=>match[0]).filter(tag=>/\brel=["']stylesheet["']/i.test(tag)).map(tag=>tag.match(/\bhref=["']([^"']+\.css)["']/i)?.[1]).filter(Boolean))].sort();
/** Dynamic localized pages have a client-reference manifest, not prerendered HTML. */
export function expectedStyles(artifact,route){
 const html=path.join(artifact,'.next/server/app',route+'.html');
 if(fs.existsSync(html))return stylesheetLinks(fs.readFileSync(html,'utf8'));
 const file=path.join(artifact,'.next/server/app',route,'page_client-reference-manifest.js');
 const source=fs.readFileSync(file,'utf8');
 const marker='globalThis.__RSC_MANIFEST['+JSON.stringify('/'+route+'/page')+']=';
 const start=source.indexOf(marker);
 if(start<0)throw Error('/'+route+': unknown client-reference manifest format.');
 // Next emits JSON after this assignment. Parse data; never execute artifact code.
 const manifest=JSON.parse(source.slice(start+marker.length).trim().replace(/;$/, ''));
 if(!manifest?.entryCSSFiles)throw Error('/'+route+': missing verified client-reference CSS manifest.');
 const ancestors=['layout',...route.split('/').map((_,index)=>route.split('/').slice(0,index+1).join('/')+'/layout'),route+'/page'];
 const styles=Object.entries(manifest.entryCSSFiles).filter(([key])=>ancestors.some(entry=>key.replaceAll('\\','/').endsWith('/app/'+entry))).flatMap(([,files])=>files.map(item=>'/_next/'+item.path));
 return [...new Set(styles)].sort();
}
