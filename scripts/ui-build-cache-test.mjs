import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const root=await fs.mkdtemp(path.join(os.tmpdir(),'binso-ui-build-'));
const script=path.resolve('scripts/prepare-ui-build.mjs');
const run=()=>execFileSync(process.execPath,[script],{cwd:root,encoding:'utf8'});
try{
 await fs.mkdir(path.join(root,'app/styles'),{recursive:true});
 await fs.writeFile(path.join(root,'app/binso-ui.css'),'@import "./styles/tokens.css";');
 await fs.writeFile(path.join(root,'app/styles/tokens.css'),':root{--app-canvas:#fff}');
 await fs.mkdir(path.join(root,'.next/cache'),{recursive:true});
 const stale=path.join(root,'.next/stale-page.rsc');
 await fs.writeFile(stale,'old stylesheet reference');run();
 await assert.rejects(fs.access(stale),'Missing style identity cannot retain stale generated pages');
 const current=path.join(root,'.next/current-page.rsc');await fs.writeFile(current,'current');run();
 assert.equal(await fs.readFile(current,'utf8'),'current','Unchanged central styles retain warm-build output');
 await fs.writeFile(path.join(root,'app/styles/tokens.css'),':root{--app-canvas:#000}');run();
 await assert.rejects(fs.access(current),'A style change invalidates generated pages, not just one route');
 assert.equal(await fs.readFile(path.join(root,'app/styles/tokens.css'),'utf8'),':root{--app-canvas:#000}','The guard does not alter source styles');
 console.log('UI build guard: stale/unknown style identity purges derived output; unchanged styles retain cache; source files remain intact.');
}finally{await fs.rm(root,{recursive:true,force:true});}
