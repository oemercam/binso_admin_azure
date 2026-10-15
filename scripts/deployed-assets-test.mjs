import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {expectedStyles} from './deployed-asset-manifest.mjs';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'binso-assets-'));
try{
 const app=path.join(root,'.next/server/app');fs.mkdirSync(path.join(app,'kunden'),{recursive:true});
 fs.writeFileSync(path.join(app,'kunden.html'),'<link rel="stylesheet" href="/_next/static/css/static.css">');
 assert.deepEqual(expectedStyles(root,'kunden'),['/_next/static/css/static.css']);fs.rmSync(path.join(app,'kunden.html'));
 const data={'/kunden/page':{entryCSSFiles:{'/build/app/layout':[{path:'static/css/root.css'}],'/build/app/kunden/layout':[{path:'static/css/customer.css'}],'/build/app/kunden/page':[{path:'static/css/root.css'}],'/build/app/global-error':[{path:'static/css/error-only.css'}]}}};
 fs.writeFileSync(path.join(app,'kunden/page_client-reference-manifest.js'),'globalThis.__RSC_MANIFEST["/kunden/page"]='+JSON.stringify(data['/kunden/page']));
 assert.deepEqual(expectedStyles(root,'kunden'),['/_next/static/css/customer.css','/_next/static/css/root.css']);
 assert.throws(()=>expectedStyles(root,'missing'),'Missing verified manifests cannot pass');
 console.log('Deployed asset identity: static HTML and dynamic localized manifests, ancestor styles, deduplication and missing-artifact rejection passed.');
}finally{fs.rmSync(root,{recursive:true,force:true})}
