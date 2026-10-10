import fs from 'node:fs';
import zlib from 'node:zlib';
import {inventory} from './ux-inventory.mjs';

// Source reachability is evidence for ownership, not visual/runtime acceptance.
const result=inventory(),directory='docs/architecture/v22-1';
fs.mkdirSync(directory,{recursive:true});
fs.writeFileSync(directory+'/source-inventory.json.gz',zlib.gzipSync(JSON.stringify(result,null,2)+'\n',{level:9}));
const cell=value=>String(value).replaceAll('|','\\|').replaceAll('\n',' ');
fs.writeFileSync(directory+'/routes.md','# V22.1 Quellinventar\n\nAktuelle statische Import-/Render-Erreichbarkeit; kein Beweis für sämtliche bedingten Laufzeitzustände. Vollständige Renderpfade, JSX-Widgets, Bedingungen, APIs, CSS-Regeln, Zeilen und Breakpoints: `source-inventory.json.gz` (gzip-komprimiertes JSON). `/manifest.webmanifest` ist ein zusätzlicher Route Handler, kein Geschäfts-API-Endpunkt.\n\n| Route | Datei | Familie | Direkt erreichbare Seitenkomponenten |\n|---|---|---|---|\n'+result.routes.map(row=>'| '+[row.route,row.file,row.family,row.pageComponents.join(', ')].map(cell).join(' | ')+' |').join('\n')+'\n');
console.log(JSON.stringify({routes:result.routes.length,handlers:result.apiRoutes.length,components:result.componentCatalog.length,cssRules:result.cssRules.length}));
